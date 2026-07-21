package httpapi

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/p91/pulse/internal/auth"
)

// vasEligibleRoles are the partner roles that get provisioned in VAS on approval.
var vasEligibleRoles = map[string]bool{"detailer": true, "installer": true, "sales_partner": true}

func randomToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// handleCreateInvite — POST /api/erp/invites  (authed: users_rbac:create)
// A distributor/admin issues an invite for a downstream role.
func (s *Server) handleCreateInvite(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
	var body struct {
		Role  string `json:"role"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	role := feToRole(strings.TrimSpace(body.Role))
	if role == "" {
		writeError(w, http.StatusBadRequest, "role is required")
		return
	}
	if _, err := s.q.GetRoleByCode(ctx, role); err != nil {
		writeError(w, http.StatusBadRequest, "unknown role: "+body.Role)
		return
	}
	token := randomToken()
	if _, err := s.pool.Exec(ctx,
		`INSERT INTO invites (token, role_code, invited_by, email, phone) VALUES ($1,$2,$3,NULLIF($4,''),NULLIF($5,''))`,
		token, role, p.UserID, strings.TrimSpace(body.Email), strings.TrimSpace(body.Phone)); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create invite")
		return
	}
	s.writeAudit(ctx, p.UserID, "invite.created", "invites", token)
	writeJSON(w, http.StatusCreated, map[string]any{
		"token": token,
		"role":  roleToFE(role),
		// Relative path — the FE joins it with its own origin.
		"path": "/onboard/" + token,
	})
}

// handleValidateInvite — GET /api/erp/invites/{token}  (PUBLIC)
func (s *Server) handleValidateInvite(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var role, status, invitedByName, email, phone string
	err := s.pool.QueryRow(r.Context(), `
SELECT i.role_code, i.status, COALESCE(u.name,''), COALESCE(i.email,''), COALESCE(i.phone,'')
FROM invites i LEFT JOIN users u ON u.id = i.invited_by
WHERE i.token = $1 AND i.expires_at > now()`, token).Scan(&role, &status, &invitedByName, &email, &phone)
	if err != nil || status != "pending" {
		writeJSON(w, http.StatusOK, map[string]any{"valid": false})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"valid": true, "role": roleToFE(role), "invitedBy": invitedByName,
		"email": email, "phone": phone,
	})
}

// handleOnboardingSignup — POST /api/erp/onboarding/signup  (PUBLIC)
// The invitee fills the form → a PENDING user seated under the inviter.
func (s *Server) handleOnboardingSignup(w http.ResponseWriter, r *http.Request) {
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
	token := str("token")

	// Resolve the invite (must be valid + unused).
	var roleCode string
	var invitedBy *uuid.UUID
	if err := s.pool.QueryRow(ctx,
		`SELECT role_code, invited_by FROM invites WHERE token=$1 AND status='pending' AND expires_at>now()`,
		token).Scan(&roleCode, &invitedBy); err != nil {
		writeError(w, http.StatusBadRequest, "this invite link is invalid or has expired")
		return
	}

	name := str("name")
	phoneRaw := str("phone")
	phone := normalizePhone(&phoneRaw)
	password := str("password")
	if name == "" || phone == nil || len(*phone) < 10 {
		writeError(w, http.StatusBadRequest, "name and a valid 10-digit phone are required")
		return
	}
	if len(password) < 6 {
		writeError(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}
	role, err := s.q.GetRoleByCode(ctx, roleCode)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "invite role no longer exists")
		return
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "hash failed")
		return
	}
	// Business/profile fields → metadata (per-role, per the ERP doctype shape).
	meta := map[string]any{"onboarded": true, "onboardSource": "invite"}
	for _, k := range []string{"businessName", "city", "state", "postalCode", "latitude", "longitude", "placeName", "brand", "businessType", "teamSize"} {
		if v, ok := body[k]; ok && v != nil {
			meta[k] = v
		}
	}
	metaJSON, _ := json.Marshal(meta)

	username := firstNonEmptyStr(str("email"), *phone)
	var id uuid.UUID
	// status='pending' → surfaces in Web Forms for admin/NSM approval.
	err = s.pool.QueryRow(ctx, `
INSERT INTO users (role_id, parent_user_id, name, email, phone, username, password_hash, status, is_active, metadata)
VALUES ($1,$2,$3,NULLIF(lower($4),''),$5,NULLIF($6,''),$7,'pending',false,$8)
RETURNING id`,
		role.ID, invitedBy, name, str("email"), *phone, username, hash, metaJSON).Scan(&id)
	if err != nil {
		writeError(w, http.StatusConflict, "an account with this phone/email already exists")
		return
	}
	if st := str("state"); st != "" {
		_, _ = s.pool.Exec(ctx, `INSERT INTO user_states (user_id, state) VALUES ($1,$2) ON CONFLICT DO NOTHING`, id, st)
	}
	_, _ = s.pool.Exec(ctx, `UPDATE invites SET status='used', used_by=$2 WHERE token=$1`, token, id)
	s.writeAudit(ctx, id, "user.self_registered", "users", id.String())
	writeJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"message": "Registration submitted. An administrator will review and approve your account.",
	})
}
