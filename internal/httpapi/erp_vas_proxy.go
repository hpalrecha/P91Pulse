package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

// vasTabsForRole returns the VAS tabs a Pulse role sees inside Pulse
// (owner spec): partner = WorkOrder+JobCard+Allocation+Staff, detailer =
// WO+Job+Staff, installer = Job (no staff). Empty slice = no VAS tabs.
func vasTabsForRole(roleFE string) []string {
	switch roleFE {
	case "sales_partner", "partner":
		return []string{"work-orders", "job-cards", "allocations", "staff"}
	case "detailer":
		return []string{"work-orders", "job-cards", "staff"}
	case "installer":
		return []string{"job-cards"}
	default:
		return nil
	}
}

// vasIdentity returns the phone/email to identify this Pulse user in VAS, plus
// whether they have VAS access turned on, and their FE role.
func (s *Server) vasIdentity(ctx context.Context, userID interface{ String() string }) (identifier, roleFE string, enabled bool) {
	var phone, email, roleCode, meta string
	_ = s.pool.QueryRow(ctx, `
SELECT u.phone, COALESCE(u.email,''), r.code, COALESCE(u.metadata::text,'{}')
FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`, userID.String()).
		Scan(&phone, &email, &roleCode, &meta)
	roleFE = roleToFE(roleCode)
	var m map[string]any
	if json.Unmarshal([]byte(meta), &m) == nil {
		if b, ok := m["ppfSetuAccess"].(bool); ok {
			enabled = b
		}
	}
	// Prefer email (VAS is email-first), fall back to phone.
	identifier = email
	if identifier == "" {
		identifier = phone
	}
	return identifier, roleFE, enabled
}

// tabForVASPath maps an incoming /api/vas/<rest> to the tab it belongs to, for
// the per-role allow-list check.
func tabForVASPath(rest string) string {
	switch {
	case strings.HasPrefix(rest, "work-orders"):
		return "work-orders"
	case strings.HasPrefix(rest, "job-cards"):
		return "job-cards"
	case strings.HasPrefix(rest, "allocations"):
		return "allocations"
	case strings.HasPrefix(rest, "partners/"):
		// Only the /staff sub-resource of a partner is exposed as a tab. Every
		// other partners/<id>/... subpath stays disallowed so the allow-list
		// doesn't leak (e.g. partners/<id>/showrooms, .../pulse-invite).
		parts := strings.SplitN(rest, "/", 3) // ["partners", "<id>", "staff..."]
		if len(parts) == 3 && (parts[2] == "staff" || strings.HasPrefix(parts[2], "staff/")) {
			return "staff"
		}
		return ""
	default:
		return ""
	}
}

// handleVASMe — GET /api/vas/me : the VAS user + the tabs this Pulse role gets.
func (s *Server) handleVASMe(w http.ResponseWriter, r *http.Request) {
	if s.vas == nil || !s.vas.Enabled() {
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false, "tabs": []string{}})
		return
	}
	p := principalFrom(r.Context())
	identifier, roleFE, enabled := s.vasIdentity(r.Context(), p.UserID)
	tabs := vasTabsForRole(roleFE)
	if !enabled || len(tabs) == 0 || identifier == "" {
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false, "tabs": []string{}})
		return
	}
	_, vu, err := s.vas.MintToken(identifier)
	if err != nil {
		// VAS reachable check failed — report not-linked rather than 500.
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false, "tabs": tabs, "error": "not linked in VAS yet"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"enabled": true, "tabs": tabs, "vasUser": vu})
}

// handleVASSSO — GET /api/vas/sso : mints a per-user VAS JWT for the iframe
// embed to auto-authenticate against the real VAS app. Never 500s — a Pulse user
// with no VAS account (or VAS unreachable) simply reports enabled:false.
func (s *Server) handleVASSSO(w http.ResponseWriter, r *http.Request) {
	if s.vas == nil || !s.vas.Enabled() {
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false})
		return
	}
	p := principalFrom(r.Context())
	identifier, _, enabled := s.vasIdentity(r.Context(), p.UserID)
	if !enabled || identifier == "" {
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false})
		return
	}
	token, _, err := s.vas.MintToken(identifier)
	if err != nil {
		// A detailer with no VAS account yet is normal — not an error.
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false, "error": "not linked in VAS"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"enabled": true, "token": token, "webUrl": s.vas.WebURL()})
}

// handleVASProxy — the allow-listed passthrough for /api/vas/*.
func (s *Server) handleVASProxy(w http.ResponseWriter, r *http.Request) {
	if s.vas == nil || !s.vas.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "VAS integration is not configured")
		return
	}
	p := principalFrom(r.Context())
	identifier, roleFE, enabled := s.vasIdentity(r.Context(), p.UserID)
	if !enabled {
		writeError(w, http.StatusForbidden, "VAS access is not enabled for your account")
		return
	}
	rest := chi.URLParam(r, "*")
	tab := tabForVASPath(rest)
	allowed := false
	for _, t := range vasTabsForRole(roleFE) {
		if t == tab {
			allowed = true
			break
		}
	}
	if tab == "" || !allowed {
		writeError(w, http.StatusForbidden, "not permitted for your role")
		return
	}

	token, _, err := s.vas.MintToken(identifier)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not authenticate with VAS: "+err.Error())
		return
	}

	var body []byte
	if r.Body != nil {
		body, _ = io.ReadAll(r.Body)
	}
	// Preserve the query string so VAS filtering/pagination/search work.
	vasPath := "/api/" + rest
	if r.URL.RawQuery != "" {
		vasPath += "?" + r.URL.RawQuery
	}
	status, respBody, err := s.vas.Do(r.Method, vasPath, token, bytes.NewReader(body))
	if err != nil {
		writeError(w, http.StatusBadGateway, "VAS request failed: "+err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(respBody)
}
