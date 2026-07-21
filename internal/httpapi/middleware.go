package httpapi

import (
	"net/http"
	"strings"

	"github.com/p91/pulse/internal/db/sqlc"
	"github.com/p91/pulse/internal/rbac"
)

// authenticate parses the Bearer token, loads the user's *live* effective
// permissions, and attaches a Principal to the request context. Loading
// permissions per request (not from the token) means an admin's permission
// change takes effect immediately without forcing a re-login.
func (s *Server) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Accept either a Bearer token (API clients) or the session cookie set at
		// login (the ported browser frontend uses cookies via credentials:include).
		var tokenStr string
		if authz := r.Header.Get("Authorization"); strings.HasPrefix(authz, "Bearer ") {
			tokenStr = strings.TrimPrefix(authz, "Bearer ")
		} else if c, err := r.Cookie(sessionCookieName); err == nil {
			tokenStr = c.Value
		}
		if tokenStr == "" {
			writeError(w, http.StatusUnauthorized, "not authenticated")
			return
		}
		claims, err := s.auth.Parse(tokenStr)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		rows, err := s.q.GetUserEffectivePermissions(r.Context(), claims.UserID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load permissions")
			return
		}
		perms := make([]rbac.Perm, len(rows))
		for i, row := range rows {
			perms[i] = rbac.Perm{Module: row.Module, Action: row.Action}
		}

		principal := &rbac.Principal{
			UserID:      claims.UserID,
			RoleCode:    claims.RoleCode,
			Permissions: rbac.NewSet(perms),
		}
		next.ServeHTTP(w, r.WithContext(withPrincipal(r.Context(), principal)))
	})
}

// requirePerm guards a route, allowing only principals holding module:action.
func requirePerm(module, action string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p := principalFrom(r.Context())
			if p == nil {
				writeError(w, http.StatusUnauthorized, "unauthenticated")
				return
			}
			if !p.Permissions.Has(module, action) {
				writeError(w, http.StatusForbidden, "insufficient permission: "+module+":"+action)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// cors applies permissive-but-scoped CORS for the configured frontend origin.
func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.corsOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type")
		w.Header().Set("Vary", "Origin")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// compile-time assurance that the query interface we depend on is satisfied.
var _ sqlc.Querier = (*sqlc.Queries)(nil)
