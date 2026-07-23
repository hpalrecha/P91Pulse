package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/db/sqlc"
	"github.com/p91/pulse/internal/vas"
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
			// Not a Pulse user — try central login via VAS (SetuPPF).
			if s.vas != nil && s.vas.Enabled() {
				vu, vtok, verr := s.vas.Login(identifier, req.Password)
				if verr == nil && vtok != "" {
					feRole, pulseOrigin := vasRoleToPulseFE(vu.Role)
					if !pulseOrigin {
						// VAS-native user (OEM/dealership/salesperson/showroom):
						// send them to the VAS website ALREADY logged in — hand
						// off the VAS JWT so the client can establish a session
						// without a second login (consumed via URL fragment).
						writeJSON(w, http.StatusOK, map[string]any{
							"redirectToVas": s.vas.WebURL(),
							"vasToken":      vtok,
							"message":       "Redirecting you to Pulse VAS…",
						})
						return
					}
					// Pulse-origin detailer/installer: bridge them into Pulse
					// (find or provision a local user) and mint a Pulse session.
					s.finishVASBridgeLogin(w, r, vu, feRole, identifier)
					return
				}
			}
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}

	// Local password check. VAS-bridged users (provisioned from a VAS login)
	// carry only a random, unusable local hash — so a failed local check is the
	// expected case for them, and we must re-delegate to VAS on EVERY login (not
	// just the first). A non-VAS user with a real password is unaffected.
	localOK := false
	if row.User.PasswordHash != nil {
		if ok, verr := auth.VerifyPassword(req.Password, *row.User.PasswordHash); verr == nil && ok {
			localOK = true
		}
	}
	if !localOK {
		if s.vas != nil && s.vas.Enabled() && row.User.Email != nil && s.canVASDelegate(r.Context(), row.User.ID) {
			// Re-authenticate against VAS using their STORED email (VAS
			// /api/auth/login keys on email; the typed identifier may have been
			// a phone or username). This covers both bridged users AND
			// ERP-provisioned VAS-eligible users (ppfSetuAccess) whose local
			// password is a random unusable placeholder.
			if vu, vtok, verr := s.vas.Login(*row.User.Email, req.Password); verr == nil && vtok != "" {
				feRole, _ := vasRoleToPulseFE(vu.Role)
				if feRole == "" {
					feRole = row.RoleCode // fall back to the stored Pulse role
				}
				s.finishVASBridgeLogin(w, r, vu, feRole, *row.User.Email)
				return
			}
		}
		// Uniform "invalid credentials" (no user enumeration).
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

// vasRoleToPulseFE maps a VAS role to the Pulse frontend role and reports
// whether it is a Pulse-origin partner role (detailer/installer) that should be
// bridged into a local Pulse session. VAS-native roles return pulseOrigin=false
// (the caller redirects them to the VAS website instead).
func vasRoleToPulseFE(vasRole string) (feRole string, pulseOrigin bool) {
	switch strings.ToUpper(strings.TrimSpace(vasRole)) {
	case "PARTNER_ADMIN":
		// TODO: the VAS login response omits the partner type, so we default a
		// partner-admin to "detailer". A partner-type lookup (partners.type:
		// STUDIO→detailer, INSTALLER→installer) could refine this.
		return "detailer", true
	case "PARTNER_STAFF", "DETAILING_PARTNER":
		return "installer", true
	default:
		return "", false
	}
}

// finishVASBridgeLogin bridges a VAS-authenticated partner into a Pulse session
// (find-or-provision the local user, refresh the VAS metadata link) and writes
// the same success JSON the normal login path returns. On any failure it logs
// and writes a 401 — it never 500s the login. who is used only for logging.
func (s *Server) finishVASBridgeLogin(w http.ResponseWriter, r *http.Request, vu vas.VASUser, feRole, who string) {
	urow, berr := s.bridgeVASUser(r.Context(), vu, feRole)
	if berr != nil {
		log.Printf("VAS bridge login failed for %q: %v", who, berr)
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	token, terr := s.auth.IssueSession(urow.User.ID, urow.RoleCode, time.Now())
	if terr != nil {
		log.Printf("VAS bridge login: issue session for %q: %v", who, terr)
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	setSessionCookie(w, token, sessionCookieTTL)
	uv := userView{
		ID:       urow.User.ID.String(),
		Name:     urow.User.Name,
		Email:    urow.User.Email,
		Username: urow.User.Username,
		Phone:    urow.User.Phone,
		Role:     roleToFE(urow.RoleCode),
		Status:   urow.User.Status,
		IsActive: urow.User.IsActive,
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true, "message": "", "data": uv, "token": token,
	})
}

// canVASDelegate reports whether a Pulse user should authenticate via VAS
// delegation rather than a local password. This is true for users bridged from a
// VAS login (metadata.provisionedFrom=="vas-login" or a present vasUserId) AND
// for ERP-provisioned VAS-eligible users (metadata.ppfSetuAccess==true) — both
// hold only a random, unusable local password but have a real VAS password.
// Ordinary Pulse users with a real local password never reach this path (it is
// only consulted after the local check fails).
func (s *Server) canVASDelegate(ctx context.Context, id uuid.UUID) bool {
	var provisionedFrom, vasUserID, ppfSetuAccess *string
	if err := s.pool.QueryRow(ctx,
		`SELECT metadata->>'provisionedFrom', metadata->>'vasUserId', metadata->>'ppfSetuAccess' FROM users WHERE id=$1`,
		id).Scan(&provisionedFrom, &vasUserID, &ppfSetuAccess); err != nil {
		return false
	}
	bridged := (provisionedFrom != nil && *provisionedFrom == "vas-login") ||
		(vasUserID != nil && *vasUserID != "")
	ppfOn := ppfSetuAccess != nil && strings.EqualFold(*ppfSetuAccess, "true")
	return bridged || ppfOn
}

// bridgeVASUser finds (by normalized phone last-10 or case-insensitive email) or
// provisions a Pulse user for a VAS-authenticated partner, records the VAS link
// in metadata, and returns the full user row for session minting. It never
// weakens Pulse security: provisioned users get a random, unusable password
// (they authenticate through VAS, not a local password).
func (s *Server) bridgeVASUser(ctx context.Context, vu vas.VASUser, feRole string) (sqlc.GetUserByIDRow, error) {
	roleCode := feToRole(feRole)
	phone := ""
	if p := normalizePhone(&vu.Phone); p != nil {
		phone = *p
	}
	email := strings.TrimSpace(vu.Email)

	var existing uuid.UUID
	err := s.pool.QueryRow(ctx, `
SELECT id FROM users
WHERE ($1 <> '' AND right(regexp_replace(phone, '\D', '', 'g'), 10) = $1)
   OR ($2 <> '' AND lower(email) = lower($2))
LIMIT 1`, phone, email).Scan(&existing)
	switch {
	case err == nil:
		// Merge the VAS link into existing metadata (don't clobber other keys).
		meta, _ := json.Marshal(map[string]any{
			"ppfSetuAccess": true,
			"vasUserId":     vu.ID,
			"vasPartnerId":  vu.PartnerID,
		})
		if _, uerr := s.pool.Exec(ctx,
			`UPDATE users SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb WHERE id=$1`,
			existing, meta); uerr != nil {
			return sqlc.GetUserByIDRow{}, uerr
		}
		return s.q.GetUserByID(ctx, existing)
	case errors.Is(err, pgx.ErrNoRows):
		// Provision a new Pulse login for this VAS partner.
		role, rerr := s.q.GetRoleByCode(ctx, roleCode)
		if rerr != nil {
			return sqlc.GetUserByIDRow{}, rerr
		}
		hash, herr := auth.HashPassword(randomToken() + randomToken())
		if herr != nil {
			return sqlc.GetUserByIDRow{}, herr
		}
		if phone == "" {
			// phone is NOT NULL + UNIQUE in Pulse; synthesize a placeholder.
			phone = randomPlaceholderPhone()
		}
		name := firstNonEmptyStr(strings.TrimSpace(vu.Name), email, phone)
		username := firstNonEmptyStr(email, phone)
		meta, _ := json.Marshal(map[string]any{
			"ppfSetuAccess":   true,
			"vasUserId":       vu.ID,
			"vasPartnerId":    vu.PartnerID,
			"provisionedFrom": "vas-login",
		})
		var id uuid.UUID
		if ierr := s.pool.QueryRow(ctx, `
INSERT INTO users (role_id, name, email, phone, username, password_hash, status, is_active, metadata)
VALUES ($1,$2,NULLIF(lower($3),''),$4,NULLIF($5,''),$6,'approved',true,$7)
RETURNING id`,
			role.ID, name, email, phone, username, hash, meta).Scan(&id); ierr != nil {
			return sqlc.GetUserByIDRow{}, ierr
		}
		return s.q.GetUserByID(ctx, id)
	default:
		return sqlc.GetUserByIDRow{}, err
	}
}

// randomPlaceholderPhone builds a unique, obviously-synthetic 10-digit phone for
// VAS-provisioned users that have no phone on record (the column is NOT NULL).
func randomPlaceholderPhone() string {
	t := randomToken() // 32 hex chars
	var digits strings.Builder
	for _, c := range t {
		if c >= '0' && c <= '9' {
			digits.WriteRune(c)
		}
		if digits.Len() >= 9 {
			break
		}
	}
	return "9" + digits.String() // leading 9 keeps it plausibly Indian-mobile-shaped
}
