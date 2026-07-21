package httpapi

import (
	"net/http"

	"github.com/p91/pulse/internal/db/sqlc"
)

func (s *Server) handleListRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := s.q.ListRoles(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list roles")
		return
	}
	if roles == nil {
		roles = []sqlc.Role{}
	}
	writeJSON(w, http.StatusOK, roles)
}

func (s *Server) handleListPermissions(w http.ResponseWriter, r *http.Request) {
	perms, err := s.q.ListPermissions(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list permissions")
		return
	}
	if perms == nil {
		perms = []sqlc.Permission{}
	}
	writeJSON(w, http.StatusOK, perms)
}

func (s *Server) handleListBrands(w http.ResponseWriter, r *http.Request) {
	brands, err := s.q.ListBrands(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list brands")
		return
	}
	if brands == nil {
		brands = []sqlc.Brand{}
	}
	writeJSON(w, http.StatusOK, brands)
}
