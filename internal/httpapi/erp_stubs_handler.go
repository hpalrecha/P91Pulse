package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// emptyList backs dashboard tabs whose modules aren't ported yet
// (warranty registrations, installer applications, contact submissions,
// webhook deliveries). They render as empty tables instead of erroring.
func emptyList(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, []any{})
}

// handleVehicleBrands — GET/POST /api/erp/vehicle-management/brands
func (s *Server) handleVehicleBrands(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if r.Method == http.MethodPost {
		var body struct {
			Name string `json:"name"`
		}
		if err := decodeLooseJSON(r, &body); err != nil || strings.TrimSpace(body.Name) == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		var id uuid.UUID
		err := s.pool.QueryRow(ctx,
			`INSERT INTO vehicle_brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET is_active=true RETURNING id`,
			strings.TrimSpace(body.Name)).Scan(&id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create brand failed")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{"id": id.String(), "name": body.Name})
		return
	}
	rows, err := s.pool.Query(ctx, `SELECT id, name, is_active FROM vehicle_brands ORDER BY name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list brands failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var name string
		var active bool
		if rows.Scan(&id, &name, &active) == nil {
			out = append(out, map[string]any{"id": id.String(), "name": name, "isActive": active})
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// handleVehicleModels — GET/POST /api/erp/vehicle-management/models
func (s *Server) handleVehicleModels(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if r.Method == http.MethodPost {
		var body struct {
			Name    string `json:"name"`
			BrandID string `json:"brandId"`
		}
		if err := decodeLooseJSON(r, &body); err != nil || strings.TrimSpace(body.Name) == "" || body.BrandID == "" {
			writeError(w, http.StatusBadRequest, "name and brandId are required")
			return
		}
		brandID, err := uuid.Parse(body.BrandID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid brandId")
			return
		}
		var id uuid.UUID
		err = s.pool.QueryRow(ctx,
			`INSERT INTO vehicle_models (brand_id, name) VALUES ($1,$2) ON CONFLICT (brand_id, name) DO UPDATE SET is_active=true RETURNING id`,
			brandID, strings.TrimSpace(body.Name)).Scan(&id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create model failed")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{"id": id.String(), "name": body.Name})
		return
	}
	rows, err := s.pool.Query(ctx, `SELECT id, brand_id, name, is_active FROM vehicle_models ORDER BY name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list models failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id, brandID uuid.UUID
		var name string
		var active bool
		if rows.Scan(&id, &brandID, &name, &active) == nil {
			out = append(out, map[string]any{"id": id.String(), "brandId": brandID.String(), "name": name, "isActive": active})
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// handlePincodeLookup — GET /api/erp/pincode/{pin} and /api/erp/customers/pincode/{pin}
// State resolution comes from the leads already synced for that pincode; the
// full prefix→state table lands with the syncer package.
func (s *Server) handlePincodeLookup(w http.ResponseWriter, r *http.Request) {
	pin := chi.URLParam(r, "pin")
	ctx := r.Context()
	var state *string
	cities := []string{}
	_ = s.pool.QueryRow(ctx,
		`SELECT c.state FROM customers c WHERE c.custom_pincode = $1 AND COALESCE(c.state,'')<>'' LIMIT 1`, pin).Scan(&state)
	if rows, err := s.pool.Query(ctx,
		`SELECT DISTINCT c.city FROM customers c WHERE c.custom_pincode = $1 AND COALESCE(c.city,'')<>'' LIMIT 10`, pin); err == nil {
		for rows.Next() {
			var city string
			if rows.Scan(&city) == nil {
				cities = append(cities, city)
			}
		}
		rows.Close()
	}
	writeJSON(w, http.StatusOK, map[string]any{"state": state, "cities": cities})
}

var _ = time.Now // placeholder to stabilize imports during iteration
