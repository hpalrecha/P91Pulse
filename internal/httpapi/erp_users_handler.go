package httpapi

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/p91/pulse/internal/auth"
)

// erpUserView is the user shape the ported User Management UI consumes.
type erpUserView struct {
	ID            string          `json:"id"`
	Name          string          `json:"name"`
	Username      *string         `json:"username"`
	Email         *string         `json:"email"`
	Phone         string          `json:"phone"`
	Role          string          `json:"role"`
	Status        string          `json:"status"`
	IsActive      bool            `json:"isActive"`
	DistributorID *string         `json:"distributorId"`
	Metadata      json.RawMessage `json:"metadata"`
	PpfSetuAccess bool            `json:"ppfSetuAccess"`
	Brands        string          `json:"brands"`
	Territory     string          `json:"territory"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

// feToRole maps the frontend's legacy role strings to the backend role codes
// (inverse of roleToFE).
func feToRole(fe string) string {
	switch fe {
	case "national_sales_manager":
		return "nsm"
	case "regional_sales_manager":
		return "rsm"
	default:
		return fe // admin, distributor, detailer, installer, salesperson, sales_partner, asm
	}
}

const erpUserCols = `u.id, u.name, u.username, u.email, u.phone, u.status, u.is_active,
u.parent_user_id, u.metadata, u.created_at, u.updated_at, r.code,
COALESCE((SELECT string_agg(b.code, ', ' ORDER BY b.code) FROM user_brands ub JOIN brands b ON b.id = ub.brand_id WHERE ub.user_id = u.id), ''),
COALESCE((SELECT string_agg(us.state, ', ' ORDER BY us.state) FROM user_states us WHERE us.user_id = u.id), COALESCE(u.metadata->>'state',''))`

func scanErpUser(scan func(dest ...any) error) (*erpUserView, error) {
	var v erpUserView
	var id uuid.UUID
	var parent *uuid.UUID
	var meta []byte
	var roleCode string
	if err := scan(&id, &v.Name, &v.Username, &v.Email, &v.Phone, &v.Status, &v.IsActive,
		&parent, &meta, &v.CreatedAt, &v.UpdatedAt, &roleCode, &v.Brands, &v.Territory); err != nil {
		return nil, err
	}
	v.ID = id.String()
	if parent != nil {
		s := parent.String()
		v.DistributorID = &s
	}
	if len(meta) == 0 {
		meta = []byte("{}")
	}
	v.Metadata = meta
	v.Role = roleToFE(roleCode)
	var m map[string]any
	if json.Unmarshal(meta, &m) == nil {
		if b, ok := m["ppfSetuAccess"].(bool); ok {
			v.PpfSetuAccess = b
		}
	}
	return &v, nil
}

// handleErpListUsers — GET /api/erp/users
func (s *Server) handleErpListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(),
		"SELECT "+erpUserCols+" FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list users failed")
		return
	}
	defer rows.Close()
	out := []*erpUserView{}
	for rows.Next() {
		v, err := scanErpUser(rows.Scan)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed: "+err.Error())
			return
		}
		out = append(out, v)
	}
	writeJSON(w, http.StatusOK, out)
}

// handleErpGetUser — GET /api/erp/users/{id}
func (s *Server) handleErpGetUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	row := s.pool.QueryRow(r.Context(),
		"SELECT "+erpUserCols+" FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1", id)
	v, err := scanErpUser(row.Scan)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, v)
}

// handleErpListDistributors — GET /api/erp/distributors (assign dialog).
func (s *Server) handleErpListDistributors(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT u.id, u.name, COALESCE(u.metadata->>'state','') FROM users u
JOIN roles r ON r.id = u.role_id
WHERE r.code = 'distributor' AND u.status = 'approved' AND u.is_active
ORDER BY u.name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list distributors failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var name, state string
		if rows.Scan(&id, &name, &state) == nil {
			out = append(out, map[string]any{"id": id.String(), "name": name, "metadata": map[string]any{"state": state}})
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// metadataKeys are the per-role profile fields the create/edit form posts;
// they are stored in users.metadata (spec: per-role field sets, MEMORY §7.5).
var metadataKeys = []string{
	"firstName", "lastName", "position", "businessName", "workspaceName", "businessTypes",
	"businessAddress", "street", "city", "state", "country", "postalCode", "latitude",
	"longitude", "placeId", "placeName", "businessType", "territory", "teamSize", "permissions",
	"organizationId", "customerId",
}

// handleErpCreateUser — POST /api/erp/users/create
func (s *Server) handleErpCreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	str := func(k string) string {
		if v, ok := body[k].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}
	name := str("name")
	if name == "" {
		name = strings.TrimSpace(str("firstName") + " " + str("lastName"))
	}
	phoneRaw := str("phone")
	phone := normalizePhone(&phoneRaw)
	if name == "" || phone == nil || len(*phone) < 10 {
		writeError(w, http.StatusBadRequest, "name and a valid 10-digit phone are required")
		return
	}
	password := str("password")
	if len(password) < 6 {
		writeError(w, http.StatusBadRequest, "password of at least 6 characters is required")
		return
	}
	roleCode := feToRole(str("role"))
	role, err := s.q.GetRoleByCode(ctx, roleCode)
	if err != nil {
		writeError(w, http.StatusBadRequest, "unknown role: "+str("role"))
		return
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "hash failed")
		return
	}
	username := str("username")
	if username == "" {
		username = firstNonEmptyStr(str("email"), *phone)
	}
	meta := map[string]any{}
	for _, k := range metadataKeys {
		if v, ok := body[k]; ok && v != nil {
			meta[k] = v
		}
	}
	metaJSON, _ := json.Marshal(meta)

	var parent *uuid.UUID
	if v := str("distributorId"); v != "" {
		if u, e := uuid.Parse(v); e == nil {
			parent = &u
		}
	}

	var id uuid.UUID
	err = s.pool.QueryRow(ctx, `
INSERT INTO users (role_id, parent_user_id, name, email, phone, username, password_hash, status, is_active, metadata)
VALUES ($1,$2,$3,NULLIF(lower($4),''),$5,NULLIF($6,''),$7,'approved',true,$8)
RETURNING id`,
		role.ID, parent, name, str("email"), *phone, username, hash, metaJSON).Scan(&id)
	if err != nil {
		writeError(w, http.StatusConflict, "could not create user (duplicate email/phone/username?)")
		return
	}
	// Territory visibility for sales roles (spec §4).
	if st := str("state"); st != "" {
		_, _ = s.pool.Exec(ctx, `INSERT INTO user_states (user_id, state) VALUES ($1,$2) ON CONFLICT DO NOTHING`, id, st)
	}
	if roleCode == "nsm" {
		_, _ = s.pool.Exec(ctx, `INSERT INTO user_states (user_id, state) VALUES ($1,'*') ON CONFLICT DO NOTHING`, id)
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "user.created", "users", id.String())
	writeJSON(w, http.StatusCreated, map[string]any{"id": id.String(), "name": name})
}

// handleErpUpdateUser — PUT /api/erp/users/{id}
func (s *Server) handleErpUpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	str := func(k string) string {
		if v, ok := body[k].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}
	// Scalar updates (only when present).
	if v := str("name"); v != "" {
		if _, err := s.pool.Exec(ctx, `UPDATE users SET name=$2 WHERE id=$1`, id, v); err != nil {
			writeError(w, http.StatusInternalServerError, "update failed")
			return
		}
	}
	if v := str("email"); v != "" {
		_, _ = s.pool.Exec(ctx, `UPDATE users SET email=lower($2) WHERE id=$1`, id, v)
	}
	if v := str("phone"); v != "" {
		if p := normalizePhone(&v); p != nil {
			_, _ = s.pool.Exec(ctx, `UPDATE users SET phone=$2 WHERE id=$1`, id, *p)
		}
	}
	if v := str("role"); v != "" {
		if role, err := s.q.GetRoleByCode(ctx, feToRole(v)); err == nil {
			_, _ = s.pool.Exec(ctx, `UPDATE users SET role_id=$2 WHERE id=$1`, id, role.ID)
		}
	}
	if v := str("password"); v != "" {
		if hash, err := auth.HashPassword(v); err == nil {
			_, _ = s.pool.Exec(ctx, `UPDATE users SET password_hash=$2 WHERE id=$1`, id, hash)
		}
	}
	// Merge metadata keys.
	meta := map[string]any{}
	for _, k := range metadataKeys {
		if v, ok := body[k]; ok && v != nil {
			meta[k] = v
		}
	}
	if len(meta) > 0 {
		metaJSON, _ := json.Marshal(meta)
		_, _ = s.pool.Exec(ctx, `UPDATE users SET metadata = metadata || $2::jsonb WHERE id=$1`, id, metaJSON)
	}
	if st := str("state"); st != "" {
		_, _ = s.pool.Exec(ctx, `INSERT INTO user_states (user_id, state) VALUES ($1,$2) ON CONFLICT DO NOTHING`, id, st)
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "user.updated", "users", id.String())
	name := str("name")
	writeJSON(w, http.StatusOK, map[string]any{"id": id.String(), "name": name})
}

// handleErpDeleteUser — DELETE /api/erp/users/{id}
func (s *Server) handleErpDeleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if _, err := s.pool.Exec(r.Context(), `DELETE FROM users WHERE id=$1`, id); err != nil {
		writeError(w, http.StatusConflict, "could not delete user")
		return
	}
	p := principalFrom(r.Context())
	s.writeAudit(r.Context(), p.UserID, "user.deleted", "users", id.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleErpUserAction — approve / reject / enable / disable / password-reset.
func (s *Server) handleErpUserAction(action string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid id")
			return
		}
		switch action {
		case "approve":
			// Approving activates the account. For a VAS-eligible partner role,
			// also provision them in VAS (the form → VAS-partner loop).
			_, err = s.pool.Exec(ctx, `UPDATE users SET status='approved', is_active=true WHERE id=$1`, id)
			if err == nil {
				var name, username, phone, email, roleCode string
				_ = s.pool.QueryRow(ctx,
					`SELECT u.name, COALESCE(u.username,''), u.phone, COALESCE(u.email,''), r.code
					 FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`, id).
					Scan(&name, &username, &phone, &email, &roleCode)
				if vasEligibleRoles[roleCode] {
					partnerType := "STUDIO"
					if roleCode == "installer" {
						partnerType = "INSTALLER"
					}
					if verr := sendVasWebhook("activate", name, username, phone, email, partnerType, id.String()); verr != nil {
						log.Printf("VAS provision on approve for %s: %v", id, verr)
					}
					_, _ = s.pool.Exec(ctx, `UPDATE users SET metadata = metadata || '{"ppfSetuAccess":true}'::jsonb WHERE id=$1`, id)
				}
			}
		case "reject":
			_, err = s.pool.Exec(ctx, `UPDATE users SET status='rejected' WHERE id=$1`, id)
		case "enable":
			_, err = s.pool.Exec(ctx, `UPDATE users SET is_active=true WHERE id=$1`, id)
		case "disable":
			_, err = s.pool.Exec(ctx, `UPDATE users SET is_active=false WHERE id=$1`, id)
		case "password-reset":
			// Email delivery lands with the notification service; acknowledge for now.
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, action+" failed")
			return
		}
		p := principalFrom(ctx)
		s.writeAudit(ctx, p.UserID, "user."+action, "users", id.String())
		writeJSON(w, http.StatusOK, map[string]any{"success": true})
	}
}

// handleErpAssignDistributor — PUT /api/erp/users/{id}/assign-distributor
func (s *Server) handleErpAssignDistributor(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		DistributorID any `json:"distributorId"`
	}
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	var parent *uuid.UUID
	if s2, ok := body.DistributorID.(string); ok && s2 != "" {
		if u, e := uuid.Parse(s2); e == nil {
			parent = &u
		}
	}
	if _, err := s.pool.Exec(ctx, `UPDATE users SET parent_user_id=$2 WHERE id=$1`, id, parent); err != nil {
		writeError(w, http.StatusInternalServerError, "assign failed")
		return
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "user.assign_distributor", "users", id.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handlePpfSetuAccess — PATCH /api/users/{id}/ppf-setu-access (stored in
// metadata; the VAS provisioning webhook is a later integration step).
func (s *Server) handlePpfSetuAccess(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	patch := map[string]any{}
	for _, k := range []string{"ppfSetuAccess", "ppfSetuPartnerType", "partnerId"} {
		if v, ok := body[k]; ok {
			patch[k] = v
		}
	}
	metaJSON, _ := json.Marshal(patch)
	if _, err := s.pool.Exec(ctx, `UPDATE users SET metadata = metadata || $2::jsonb WHERE id=$1`, id, metaJSON); err != nil {
		writeError(w, http.StatusInternalServerError, "update failed")
		return
	}

	// Fire the VAS provisioning webhook (item 8 phase 1). Failure doesn't roll
	// back the local flag — VAS can be re-synced by toggling again.
	enabled, _ := body["ppfSetuAccess"].(bool)
	action := "deactivate"
	if enabled {
		action = "activate"
	}
	partnerType, _ := body["ppfSetuPartnerType"].(string)
	if partnerType == "" {
		partnerType = "STUDIO"
	}
	partnerID, _ := body["partnerId"].(string)
	var name, username, phone, email string
	_ = s.pool.QueryRow(ctx,
		`SELECT name, COALESCE(username,''), phone, COALESCE(email,'') FROM users WHERE id=$1`, id).
		Scan(&name, &username, &phone, &email)
	if err := sendVasWebhook(action, name, username, phone, email, partnerType, partnerID); err != nil {
		log.Printf("VAS webhook error for user %s: %v", id, err)
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "vasWebhook": "failed: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "vasWebhook": "sent"})
}

func firstNonEmptyStr(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

var _ = context.Background // keep context import if unused paths change
