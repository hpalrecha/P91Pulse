package httpapi

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// installerView is one row of the Installer Management list. It merges the
// canonical users row (role='installer') with any linked ERP Sales Partner of
// type 'Installer' (territory, pincode coverage, brands) and the onboarding
// form fields stored on users.metadata.
type installerView struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Status       string    `json:"status"`
	IsActive     bool      `json:"isActive"`
	ParentID     string    `json:"parentId"`
	ParentName   string    `json:"parentName"`
	BusinessName string    `json:"businessName"`
	City         string    `json:"city"`
	State        string    `json:"state"`
	Brand        string    `json:"brand"`
	BusinessType string    `json:"businessType"`
	TeamSize     string    `json:"teamSize"`
	SpTerritory  string    `json:"spTerritory"`
	PincodeCount int       `json:"pincodeCount"`
	SpBrands     string    `json:"spBrands"`
	CreatedAt    time.Time `json:"createdAt"`
}

// handleListInstallers — GET /api/erp/installers.
func (s *Server) handleListInstallers(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT u.id::text, u.name, COALESCE(u.email,''), COALESCE(u.phone,''), u.status, u.is_active,
       COALESCE(u.parent_user_id::text,''), COALESCE(pu.name,''),
       COALESCE(u.metadata->>'businessName',''),
       COALESCE(u.metadata->>'city',''),
       COALESCE(NULLIF(u.metadata->>'state',''), u.metadata->>'territory', ''),
       COALESCE(u.metadata->>'brand',''),
       COALESCE(u.metadata->>'businessType',''),
       COALESCE(u.metadata->>'teamSize',''),
       COALESCE(sp.territory,''),
       COALESCE((SELECT count(*) FROM sales_partner_pincodes pk WHERE pk.partner_id = sp.id), 0),
       COALESCE((SELECT string_agg(b.brand, ', ' ORDER BY b.brand) FROM sales_partner_brands b WHERE b.partner_id = sp.id), ''),
       u.created_at
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN users pu ON pu.id = u.parent_user_id
LEFT JOIN sales_partners sp ON sp.user_id = u.id AND sp.partner_type = 'Installer'
WHERE r.code = 'installer'
ORDER BY u.created_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list installers failed")
		return
	}
	defer rows.Close()
	out := []installerView{}
	for rows.Next() {
		var v installerView
		if err := rows.Scan(&v.ID, &v.Name, &v.Email, &v.Phone, &v.Status, &v.IsActive,
			&v.ParentID, &v.ParentName, &v.BusinessName, &v.City, &v.State, &v.Brand,
			&v.BusinessType, &v.TeamSize, &v.SpTerritory, &v.PincodeCount, &v.SpBrands, &v.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "scan installer failed: "+err.Error())
			return
		}
		out = append(out, v)
	}
	writeJSON(w, http.StatusOK, out)
}

// installerApplication is the "form the installer filled" view — the onboarding
// metadata captured by handleOnboardingSignup, surfaced for review/approval.
type installerApplication struct {
	ID                 int64     `json:"id"`
	Name               string    `json:"name"`
	Email              string    `json:"email"`
	Phone              string    `json:"phone"`
	BusinessName       string    `json:"businessName"`
	City               string    `json:"city"`
	PinCode            string    `json:"pinCode"`
	BusinessType       string    `json:"businessType"`
	Services           []string  `json:"services"`
	Website            string    `json:"website"`
	InstagramHandle    string    `json:"instagramHandle"`
	StoreArea          string    `json:"storeArea"`
	GoogleMapsLocation string    `json:"googleMapsLocation"`
	Message            string    `json:"message"`
	Status             string    `json:"status"`
	SubmittedAt        time.Time `json:"submittedAt"`
}

// handleListInstallerApplications — GET /api/erp/installer-applications.
// The REAL onboarding form submissions live in the SEPARATE P91Elite DB
// (installer_applications), so this reads the optional Elite pool. If that pool
// is nil/unavailable it degrades to {data:[], unavailable:true} with HTTP 200 —
// it never 500s and never falls back to Pulse's own DB.
func (s *Server) handleListInstallerApplications(w http.ResponseWriter, r *http.Request) {
	if s.elitePool == nil {
		writeJSON(w, http.StatusOK, map[string]any{"data": []installerApplication{}, "unavailable": true})
		return
	}
	rows, err := s.elitePool.Query(r.Context(), `
SELECT id, COALESCE(name,''), COALESCE(email,''), COALESCE(phone,''),
       COALESCE(business_name,''), COALESCE(city,''), COALESCE(pin_code,''),
       COALESCE(business_type,''), services,
       COALESCE(website,''), COALESCE(instagram_handle,''), COALESCE(store_area,''),
       COALESCE(google_maps_location,''), COALESCE(message,''),
       COALESCE(status::text,''), created_at
FROM installer_applications
ORDER BY created_at DESC`)
	if err != nil {
		// Elite reachable-check failed at query time — report unavailable, not 500.
		log.Printf("elite installer_applications query failed: %v", err)
		writeJSON(w, http.StatusOK, map[string]any{"data": []installerApplication{}, "unavailable": true})
		return
	}
	defer rows.Close()
	out := []installerApplication{}
	for rows.Next() {
		var a installerApplication
		var services []byte // json column → raw bytes → []string
		if err := rows.Scan(&a.ID, &a.Name, &a.Email, &a.Phone,
			&a.BusinessName, &a.City, &a.PinCode, &a.BusinessType, &services,
			&a.Website, &a.InstagramHandle, &a.StoreArea, &a.GoogleMapsLocation,
			&a.Message, &a.Status, &a.SubmittedAt); err != nil {
			log.Printf("elite installer_applications scan failed: %v", err)
			writeJSON(w, http.StatusOK, map[string]any{"data": []installerApplication{}, "unavailable": true})
			return
		}
		a.Services = parseServices(services)
		out = append(out, a)
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": out, "unavailable": false})
}

// parseServices tolerates the services column being JSON (["a","b"]), a JSON
// string of a JSON array, or NULL/empty. Always returns a non-nil slice.
func parseServices(raw []byte) []string {
	out := []string{}
	if len(raw) == 0 {
		return out
	}
	if err := json.Unmarshal(raw, &out); err == nil {
		return out
	}
	// It may be a JSON-encoded string that itself contains a JSON array.
	var s string
	if err := json.Unmarshal(raw, &s); err == nil && s != "" {
		_ = json.Unmarshal([]byte(s), &out)
	}
	return out
}

// handleListInstallerParents — GET /api/erp/installer-parents. The pickable
// managers for an installer (detailers + distributors). Adapts
// handleErpListDistributors to two roles.
func (s *Server) handleListInstallerParents(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT u.id::text, u.name, r.code
FROM users u JOIN roles r ON r.id = u.role_id
WHERE r.code IN ('detailer', 'distributor') AND u.status = 'approved' AND u.is_active
ORDER BY r.code, u.name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list installer parents failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id, name, role string
		if rows.Scan(&id, &name, &role) == nil {
			out = append(out, map[string]any{"id": id, "name": name, "role": role})
		}
	}
	writeJSON(w, http.StatusOK, out)
}
