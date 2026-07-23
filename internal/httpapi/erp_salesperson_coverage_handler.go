package httpapi

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// coverageDimensions are the four EAV dimensions of salesperson_coverage.
var coverageDimensions = []string{"territory", "brand", "customer_group", "company"}

// handleGetSalespersonCoverage — GET /api/erp/salesperson-coverage/{userId}.
// Returns each dimension's assigned values plus the user's manager (parent).
func (s *Server) handleGetSalespersonCoverage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid userId")
		return
	}
	out := map[string]any{
		"territory":      []string{},
		"brand":          []string{},
		"customer_group": []string{},
		"company":        []string{},
	}
	rows, err := s.pool.Query(ctx,
		`SELECT dimension, value FROM salesperson_coverage WHERE user_id=$1 ORDER BY dimension, value`, uid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load coverage")
		return
	}
	defer rows.Close()
	for rows.Next() {
		var dim, val string
		if err := rows.Scan(&dim, &val); err != nil {
			continue
		}
		if cur, ok := out[dim].([]string); ok {
			out[dim] = append(cur, val)
		}
	}

	var parent *string
	_ = s.pool.QueryRow(ctx, `SELECT parent_user_id::text FROM users WHERE id=$1`, uid).Scan(&parent)
	if parent != nil {
		out["parentUserId"] = *parent
	} else {
		out["parentUserId"] = ""
	}
	writeJSON(w, http.StatusOK, out)
}

// handlePutSalespersonCoverage — PUT /api/erp/salesperson-coverage/{userId}.
// Replaces ALL coverage for the user with the provided dimensions, and
// optionally sets their manager (parentUserId), reusing the assign-distributor
// write shape. Runs in a transaction so a user is never left half-updated.
func (s *Server) handlePutSalespersonCoverage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid userId")
		return
	}
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	// Collect the values per dimension from the payload (arrays of strings).
	values := map[string][]string{}
	for _, dim := range coverageDimensions {
		raw, ok := body[dim].([]any)
		if !ok {
			continue
		}
		for _, item := range raw {
			v, _ := item.(string)
			v = strings.TrimSpace(v)
			if v == "" {
				continue
			}
			if dim == "territory" {
				// territory values must be territories.id (uuid).
				if _, e := uuid.Parse(v); e != nil {
					continue
				}
			}
			values[dim] = append(values[dim], v)
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start transaction")
		return
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM salesperson_coverage WHERE user_id=$1`, uid); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to clear coverage")
		return
	}
	for _, dim := range coverageDimensions {
		for _, v := range values[dim] {
			if _, err := tx.Exec(ctx,
				`INSERT INTO salesperson_coverage (user_id, dimension, value) VALUES ($1,$2,$3)
				 ON CONFLICT DO NOTHING`, uid, dim, v); err != nil {
				writeError(w, http.StatusInternalServerError, "failed to save coverage")
				return
			}
		}
	}

	// Optional manager assignment (mirrors handleErpAssignDistributor).
	if v, ok := body["parentUserId"]; ok {
		var parent *uuid.UUID
		if ps, _ := v.(string); strings.TrimSpace(ps) != "" {
			if u, e := uuid.Parse(strings.TrimSpace(ps)); e == nil {
				parent = &u
			}
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET parent_user_id=$2 WHERE id=$1`, uid, parent); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to set manager")
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "commit failed")
		return
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "salesperson_coverage.updated", "salesperson_coverage", uid.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleDeleteSalespersonCoverage — DELETE /api/erp/salesperson-coverage/{userId}.
func (s *Server) handleDeleteSalespersonCoverage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid userId")
		return
	}
	if _, err := s.pool.Exec(ctx, `DELETE FROM salesperson_coverage WHERE user_id=$1`, uid); err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "salesperson_coverage.deleted", "salesperson_coverage", uid.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}
