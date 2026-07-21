package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/p91/pulse/internal/auth"
)

type loginRequest struct {
	Identifier string `json:"identifier"` // email or username (API clients)
	Username   string `json:"username"`   // the ported frontend posts this
	Password   string `json:"password"`
}

type userView struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Email    *string  `json:"email"`
	Username *string  `json:"username"`
	Phone    string   `json:"phone"`
	Role     string   `json:"role"`
	Status   string   `json:"status"`
	IsActive bool     `json:"isActive"`
	Perms    []string `json:"permissions,omitempty"`
}

// sessionCookieTTL matches the JWT refresh lifetime (long-lived browser session).
const sessionCookieTTL = 30 * 24 * time.Hour

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	identifier := req.Identifier
	if identifier == "" {
		identifier = req.Username
	}
	if identifier == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}

	row, err := s.q.GetUserForLogin(r.Context(), identifier)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}

	// Uniform "invalid credentials" for every auth failure (no user enumeration).
	if row.User.PasswordHash == nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	ok, err := auth.VerifyPassword(req.Password, *row.User.PasswordHash)
	if err != nil || !ok {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if row.User.Status != "approved" || !row.User.IsActive {
		writeError(w, http.StatusForbidden, "account is not active")
		return
	}

	token, err := s.auth.IssueSession(row.User.ID, row.RoleCode, time.Now())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}
	setSessionCookie(w, token, sessionCookieTTL)

	uv := userView{
		ID:       row.User.ID.String(),
		Name:     row.User.Name,
		Email:    row.User.Email,
		Username: row.User.Username,
		Phone:    row.User.Phone,
		Role:     roleToFE(row.RoleCode),
		Status:   row.User.Status,
		IsActive: row.User.IsActive,
	}
	// The frontend reads `userData.data || userData`, so nest the user under data
	// and also expose the token for API clients that prefer bearer auth.
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "",
		"data":    uv,
		"token":   token,
	})
}

// handleErpMe returns the current user as a bare object with the role mapped to
// the frontend's vocabulary. Backs GET /api/erp/me (sidebar, dashboards, leads).
func (s *Server) handleErpMe(w http.ResponseWriter, r *http.Request) {
	p := principalFrom(r.Context())
	row, err := s.q.GetUserByID(r.Context(), p.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load user")
		return
	}
	perms := make([]string, 0, len(p.Permissions))
	for perm := range p.Permissions {
		perms = append(perms, perm.Module+":"+perm.Action)
	}
	writeJSON(w, http.StatusOK, userView{
		ID:       row.User.ID.String(),
		Name:     row.User.Name,
		Email:    row.User.Email,
		Username: row.User.Username,
		Phone:    row.User.Phone,
		Role:     roleToFE(row.RoleCode),
		Status:   row.User.Status,
		IsActive: row.User.IsActive,
		Perms:    perms,
	})
}

// handleLogout clears the session cookie.
func (s *Server) handleLogout(w http.ResponseWriter, _ *http.Request) {
	clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	p := principalFrom(r.Context())
	row, err := s.q.GetUserByID(r.Context(), p.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load user")
		return
	}
	perms := make([]string, 0, len(p.Permissions))
	for perm := range p.Permissions {
		perms = append(perms, perm.Module+":"+perm.Action)
	}
	writeJSON(w, http.StatusOK, userView{
		ID:       row.User.ID.String(),
		Name:     row.User.Name,
		Email:    row.User.Email,
		Username: row.User.Username,
		Role:     row.RoleCode,
		Status:   row.User.Status,
		IsActive: row.User.IsActive,
		Perms:    perms,
	})
}

func (s *Server) handleMyPermissions(w http.ResponseWriter, r *http.Request) {
	p := principalFrom(r.Context())
	perms := make([]string, 0, len(p.Permissions))
	for perm := range p.Permissions {
		perms = append(perms, perm.Module+":"+perm.Action)
	}
	writeJSON(w, http.StatusOK, map[string]any{"permissions": perms})
}
