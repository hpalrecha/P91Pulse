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

// namedItem is the minimal shape the coverage multiselects consume.
type namedItem struct {
	Name string `json:"name"`
}

// handleListCustomerGroups returns the distinct customer groups present on
// leads. SOURCE: derived from the local `customers` mirror (no separate table),
// which is the simplest source that stays in sync with the leads being scoped.
func (s *Server) handleListCustomerGroups(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT DISTINCT customer_group FROM customers
WHERE customer_group IS NOT NULL AND btrim(customer_group) <> ''
ORDER BY 1`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list customer groups")
		return
	}
	defer rows.Close()
	out := []namedItem{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			out = append(out, namedItem{Name: name})
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// handleListCompanies returns the selectable companies for coverage assignment.
// SOURCE: static single-company list — the org has exactly one company today
// ("Plus Nine One Inc") and there is no local company table/column to derive
// from. TODO: replace with a live ERPNext "Company" doctype fetch if multi-
// company support is ever needed.
func (s *Server) handleListCompanies(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, []namedItem{{Name: "Plus Nine One Inc"}})
}
