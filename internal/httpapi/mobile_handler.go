package httpapi

import (
	"encoding/json"
	"net/http"
)

// Handlers for the native P91 mobile app (v1). Everything here is READ-ONLY and additive:
// condensed, phone-friendly shapes under the isolated /api/mobile/* namespace, behind the
// same authenticate middleware as the rest of /api. No writes, no migrations, and no changes
// to existing handlers/queries. See the app repo's docs/MOBILE-V1-SPEC.md for the contract.

// handleMobilePulseDashboard — GET /api/mobile/pulse/dashboard
//
// Returns the { "tiles": [{label,value}, ...] } shape the mobile Dashboard tab renders.
// It reuses the SAME aggregate counts as handleDashboardStats (erp_dashboard_handler.go),
// which any authenticated user can already read — so this adds a shape, not new exposure.
func (s *Server) handleMobilePulseDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var totalUsers, activeDistributors, activeDetailers, activeInstallers, pendingApprovals int
	// Same query as handleDashboardStats — read-only aggregate counts.
	_ = s.pool.QueryRow(ctx, `
SELECT (SELECT count(*) FROM users WHERE password_hash IS NOT NULL),
  (SELECT count(*) FROM sales_partners WHERE partner_type='Distributor'),
  (SELECT count(*) FROM sales_partners WHERE COALESCE(partner_type,'') NOT IN ('Distributor','Installer')),
  (SELECT count(*) FROM sales_partners WHERE partner_type='Installer'),
  (SELECT count(*) FROM users WHERE status='pending')`).
		Scan(&totalUsers, &activeDistributors, &activeDetailers, &activeInstallers, &pendingApprovals)

	tile := func(label string, value int) map[string]any {
		return map[string]any{"label": label, "value": value}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"tiles": []map[string]any{
			tile("Total users", totalUsers),
			tile("Distributors", activeDistributors),
			tile("Detailers", activeDetailers),
			tile("Installers", activeInstallers),
			tile("Pending approvals", pendingApprovals),
		},
	})
}

// vasDashboardTiles maps VAS metric keys → friendly tile labels, in display order.
var vasDashboardTiles = []struct{ key, label string }{
	{"activeWorkOrders", "Active work orders"},
	{"pendingApprovals", "Pending approvals"},
	{"inProgressJobs", "In-progress jobs"},
	{"completedJobs", "Completed jobs"},
	{"pendingJobs", "Pending jobs"},
	{"avgTAT", "Avg TAT"},
	{"thisMonthRevenue", "Revenue (month)"},
	{"thisMonthEarnings", "Earnings (month)"},
}

// handleMobileVasDashboard — GET /api/mobile/vas/dashboard
//
// Read-only VAS KPI tiles for the native app. Reuses the SAME machinery as the existing
// /api/vas/* proxy — per-user VAS identity + minted token via the vas.Gateway — to fetch
// VAS's own GET /api/dashboard/metrics, then reshapes its flat numeric metrics into the
// { tiles: [...] } shape. No writes, and no change to the VAS backend. Never 500s: a user
// without VAS access (or VAS unreachable) simply gets an empty tile list.
func (s *Server) handleMobileVasDashboard(w http.ResponseWriter, r *http.Request) {
	empty := map[string]any{"tiles": []map[string]any{}}
	if s.vas == nil || !s.vas.Enabled() {
		writeJSON(w, http.StatusOK, empty)
		return
	}
	p := principalFrom(r.Context())
	identifier, _, enabled := s.vasIdentity(r.Context(), p.UserID)
	if !enabled || identifier == "" {
		writeJSON(w, http.StatusOK, empty)
		return
	}
	token, _, err := s.vas.MintToken(identifier)
	if err != nil {
		writeJSON(w, http.StatusOK, empty)
		return
	}
	status, body, err := s.vas.Do("GET", "/api/dashboard/metrics", token, nil)
	if err != nil || status < 200 || status >= 300 {
		writeJSON(w, http.StatusOK, empty)
		return
	}
	var metrics map[string]any
	if json.Unmarshal(body, &metrics) != nil {
		writeJSON(w, http.StatusOK, empty)
		return
	}
	tiles := []map[string]any{}
	for _, t := range vasDashboardTiles {
		if v, ok := metrics[t.key]; ok {
			if n, ok := v.(float64); ok {
				tiles = append(tiles, map[string]any{"label": t.label, "value": n})
			}
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"tiles": tiles})
}
