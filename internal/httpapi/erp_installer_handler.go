package httpapi

import (
	"encoding/json"
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
	ID            string          `json:"id"`
	Name          string          `json:"name"`
	Email         string          `json:"email"`
	Phone         string          `json:"phone"`
	Status        string          `json:"status"`
	BusinessName  string          `json:"businessName"`
	City          string          `json:"city"`
	State         string          `json:"state"`
	PostalCode    string          `json:"postalCode"`
	Brand         string          `json:"brand"`
	BusinessType  string          `json:"businessType"`
	TeamSize      string          `json:"teamSize"`
	PlaceName     string          `json:"placeName"`
	OnboardSource string          `json:"onboardSource"`
	SubmittedAt   time.Time       `json:"submittedAt"`
	Metadata      json.RawMessage `json:"metadata"`
}

// handleListInstallerApplications — GET /api/erp/installer-applications.
// The REAL submissions: role='installer' users, pending first. Replaces the
// empty /api/installer-applications stub (which is left untouched).
func (s *Server) handleListInstallerApplications(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT u.id::text, u.name, COALESCE(u.email,''), COALESCE(u.phone,''), u.status,
       COALESCE(u.metadata->>'businessName',''),
       COALESCE(u.metadata->>'city',''),
       COALESCE(NULLIF(u.metadata->>'state',''), u.metadata->>'territory', ''),
       COALESCE(u.metadata->>'postalCode',''),
       COALESCE(u.metadata->>'brand',''),
       COALESCE(u.metadata->>'businessType',''),
       COALESCE(u.metadata->>'teamSize',''),
       COALESCE(NULLIF(u.metadata->>'placeName',''), u.metadata->>'businessAddress', ''),
       COALESCE(u.metadata->>'onboardSource',''),
       u.created_at,
       COALESCE(u.metadata, '{}'::jsonb)
FROM users u
JOIN roles r ON r.id = u.role_id
WHERE r.code = 'installer'
ORDER BY (u.status = 'pending') DESC, u.created_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list installer applications failed")
		return
	}
	defer rows.Close()
	out := []installerApplication{}
	for rows.Next() {
		var a installerApplication
		var meta []byte
		if err := rows.Scan(&a.ID, &a.Name, &a.Email, &a.Phone, &a.Status,
			&a.BusinessName, &a.City, &a.State, &a.PostalCode, &a.Brand,
			&a.BusinessType, &a.TeamSize, &a.PlaceName, &a.OnboardSource, &a.SubmittedAt, &meta); err != nil {
			writeError(w, http.StatusInternalServerError, "scan application failed: "+err.Error())
			return
		}
		if len(meta) == 0 {
			meta = []byte("{}")
		}
		a.Metadata = meta
		out = append(out, a)
	}
	writeJSON(w, http.StatusOK, out)
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
