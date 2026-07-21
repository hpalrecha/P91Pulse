package httpapi

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// handleDashboardStats — GET /api/erp/admin/dashboard-stats
// Real aggregates (the stage version returned Math.random() — replaced).
func (s *Server) handleDashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Goal 1.1: Total Users = everyone holding a Pulse login (ERP customers
	// excl. B2C groups + sales partners are auto-provisioned by the syncer).
	// Goal 1.2: Active detailers/distributors = the ERP Sales Partner mirror.
	var totalUsers, activeDistributors, activeDetailers, activeInstallers, pendingApprovals int
	_ = s.pool.QueryRow(ctx, `
SELECT (SELECT count(*) FROM users WHERE password_hash IS NOT NULL),
  (SELECT count(*) FROM sales_partners WHERE partner_type='Distributor'),
  (SELECT count(*) FROM sales_partners WHERE COALESCE(partner_type,'') NOT IN ('Distributor','Installer')),
  (SELECT count(*) FROM sales_partners WHERE partner_type='Installer'),
  (SELECT count(*) FROM users WHERE status='pending')`).
		Scan(&totalUsers, &activeDistributors, &activeDetailers, &activeInstallers, &pendingApprovals)

	// Recent lead activity → the dashboard's activity feed.
	recentActivities := []map[string]any{}
	if rows, err := s.pool.Query(ctx, `
SELECT h.event, COALESCE(u.name,'system'), COALESCE(c.name,''), h.to_status, h.at
FROM lead_history h
LEFT JOIN users u ON u.id=h.actor_id
LEFT JOIN customers c ON c.id=h.customer_id
ORDER BY h.at DESC LIMIT 10`); err == nil {
		for rows.Next() {
			var event, actor, customer string
			var to *string
			var at time.Time
			if rows.Scan(&event, &actor, &customer, &to, &at) == nil {
				color := "blue"
				desc := actor + " " + event + " — " + customer
				switch event {
				case "created":
					color = "green"
				case "assigned":
					color = "yellow"
				case "status_changed":
					if to != nil {
						desc += " → " + *to
					}
				}
				recentActivities = append(recentActivities, map[string]any{
					"type": event, "description": desc, "timestamp": at, "color": color,
				})
			}
		}
		rows.Close()
	}

	// Pending user applications.
	recentApplications := []map[string]any{}
	if rows, err := s.pool.Query(ctx, `
SELECT u.id, u.name, COALESCE(u.metadata->>'businessName',''), COALESCE(u.metadata->>'city',''), COALESCE(u.metadata->>'state','')
FROM users u WHERE u.status='pending' ORDER BY u.created_at DESC LIMIT 5`); err == nil {
		for rows.Next() {
			var id uuid.UUID
			var name, biz, city, state string
			if rows.Scan(&id, &name, &biz, &city, &state) == nil {
				recentApplications = append(recentApplications, map[string]any{
					"id": id.String(), "name": name, "businessName": biz, "city": city, "state": state,
				})
			}
		}
		rows.Close()
	}

	// Leads by state (regional distribution) + by brand (top products).
	regional := map[string]int{}
	if rows, err := s.pool.Query(ctx, `
SELECT c.state, count(*) FROM customers c WHERE COALESCE(c.state,'')<>'' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`); err == nil {
		for rows.Next() {
			var st string
			var c int
			if rows.Scan(&st, &c) == nil {
				regional[st] = c
			}
		}
		rows.Close()
	}
	topProducts := []map[string]any{}
	if rows, err := s.pool.Query(ctx, `
SELECT c.brand, count(*) FROM customers c WHERE COALESCE(c.brand,'')<>'' GROUP BY 1 ORDER BY 2 DESC LIMIT 5`); err == nil {
		for rows.Next() {
			var b string
			var c int
			if rows.Scan(&b, &c) == nil {
				topProducts = append(topProducts, map[string]any{"product": b, "count": c})
			}
		}
		rows.Close()
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"totalUsers":           totalUsers,
		"activeDistributors":   activeDistributors,
		"activeDetailers":      activeDetailers,
		"activeInstallers":     activeInstallers,
		"totalWarranties":      0, // warranty module not ported yet
		"openClaims":           0, // claims module not ported yet
		"pendingApprovals":     pendingApprovals,
		"recentActivities":     recentActivities,
		"recentApplications":   recentApplications,
		"regionalDistribution": regional,
		"topProducts":          topProducts,
	})
}

// handleProvisionedLogins — GET /api/erp/admin/provisioned-logins
// Dashboard goal 1.1: the table of ERP-derived Pulse logins with their
// mobile/email/username and the generated initial password.
func (s *Server) handleProvisionedLogins(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(), `
SELECT u.id, u.name, COALESCE(u.phone,''), COALESCE(u.email,''), COALESCE(u.username,''),
       r.code, COALESCE(u.metadata->>'initialPassword',''), COALESCE(u.metadata->>'provisionSource',''),
       COALESCE(u.metadata->>'erpRef',''), u.is_active, u.created_at,
       COALESCE((SELECT string_agg(us.state, ', ' ORDER BY us.state) FROM user_states us WHERE us.user_id = u.id),
                COALESCE(u.metadata->>'state',''))
FROM users u JOIN roles r ON r.id = u.role_id
WHERE u.metadata->>'provisioned' = 'true'
ORDER BY u.created_at DESC, u.name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "provisioned logins failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var name, phone, email, username, role, pw, source, erpRef, territory string
		var active bool
		var at time.Time
		if rows.Scan(&id, &name, &phone, &email, &username, &role, &pw, &source, &erpRef, &active, &at, &territory) == nil {
			out = append(out, map[string]any{
				"id": id.String(), "name": name, "phone": phone, "email": email,
				"username": username, "role": roleToFE(role), "password": pw,
				"source": source, "erpRef": erpRef, "isActive": active, "createdAt": at,
				"territory": territory,
			})
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// handleLeadsOverview — GET /api/erp/admin/leads-overview
// Dashboard goal 1.3: unassigned-lead bifurcation — by status, plus who is
// RESPONSIBLE for them by pincode coverage — and assigned counts per partner.
func (s *Server) handleLeadsOverview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// One row per ERP Lead (Lead-only model). B2C/B2B via the shared classifier.
	var total, unassigned, unassignedWithPin, assigned, b2cUnassigned, b2bUnassigned int
	_ = s.pool.QueryRow(ctx, `
SELECT count(*),
       count(*) FILTER (WHERE c.assignment_status <> 'Assigned'),
       count(*) FILTER (WHERE c.assignment_status <> 'Assigned' AND COALESCE(c.custom_pincode,'') <> ''),
       count(*) FILTER (WHERE c.assignment_status = 'Assigned'),
       count(*) FILTER (WHERE c.assignment_status <> 'Assigned' AND `+b2cCond("c.")+`),
       count(*) FILTER (WHERE c.assignment_status <> 'Assigned' AND `+b2bCond("c.")+`)
FROM customers c`).Scan(&total, &unassigned, &unassignedWithPin, &assigned, &b2cUnassigned, &b2bUnassigned)

	group := func(q string, args ...any) []map[string]any {
		out := []map[string]any{}
		rows, err := s.pool.Query(ctx, q, args...)
		if err != nil {
			return out
		}
		defer rows.Close()
		for rows.Next() {
			var k string
			var c int
			if rows.Scan(&k, &c) == nil {
				out = append(out, map[string]any{"name": k, "count": c})
			}
		}
		return out
	}

	unassignedByStatus := group(`
SELECT status, count(*) FROM customers
WHERE assignment_status <> 'Assigned' GROUP BY 1 ORDER BY 2 DESC LIMIT 12`)

	// Who WOULD be responsible: unassigned leads whose pincode falls in a
	// partner's pincode set (a lead can match several partners — the ERP tie).
	responsibleByPartner := group(`
SELECT sp.name || ' (' || COALESCE(sp.partner_type,'?') || ')', count(DISTINCT c.id)
FROM customers c
JOIN sales_partner_pincodes pc ON pc.pincode = c.custom_pincode
JOIN sales_partners sp ON sp.id = pc.partner_id
WHERE c.assignment_status <> 'Assigned' AND COALESCE(c.custom_pincode,'') <> ''
GROUP BY 1 ORDER BY 2 DESC LIMIT 15`)

	assignedByPartner := group(`
SELECT COALESCE(NULLIF(assigned_to,''),'(unnamed partner)'), count(*)
FROM customers WHERE assignment_status = 'Assigned' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`)

	writeJSON(w, http.StatusOK, map[string]any{
		"company":              "P91 India (Plus Nine One Inc)",
		"totalLeads":           total,
		"unassigned":           unassigned,
		"b2cUnassigned":        b2cUnassigned,
		"b2bUnassigned":        b2bUnassigned,
		"unassignedWithPin":    unassignedWithPin,
		"unassignedNoPin":      unassigned - unassignedWithPin,
		"assigned":             assigned,
		"unassignedByStatus":   unassignedByStatus,
		"responsibleByPartner": responsibleByPartner,
		"assignedByPartner":    assignedByPartner,
	})
}

// handleLeadsInsights — GET /api/erp/leads-insights?from=&to=&territory=
// The interactive panel: date-ranged inflow + funnel (Converted / Quotation /
// Customer / Sales Order), and a territory drill-down (name → its pincodes →
// leads + responsible partners + what was done). Role-scoped via leadScope so
// every user sees their own slice.
func (s *Server) handleLeadsInsights(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
	qs := r.URL.Query()

	args := []any{}
	cond := "WHERE 1=1" + leadScope(p, &args)
	if from := qs.Get("from"); from != "" {
		args = append(args, from)
		cond += fmt.Sprintf(" AND c.erp_created >= $%d::timestamptz", len(args))
	}
	if to := qs.Get("to"); to != "" {
		args = append(args, to)
		cond += fmt.Sprintf(" AND c.erp_created < ($%d::timestamptz + interval '1 day')", len(args))
	}
	territory := strings.TrimSpace(qs.Get("territory"))
	terrCond := cond
	terrArgs := args
	if territory != "" {
		terrArgs = append(terrArgs, "%"+territory+"%")
		n := len(terrArgs)
		terrCond += fmt.Sprintf(" AND (c.territory ILIKE $%d OR c.city ILIKE $%d OR c.state ILIKE $%d)", n, n, n)
	}
	// Per-brand breakdown is computed BEFORE the brand filter (so the brand
	// table always shows every brand under the current date/territory scope);
	// everything else (funnel, statuses, drill-down) applies the brand filter.
	brandCond := terrCond
	brandArgs := terrArgs
	if brand := strings.TrimSpace(qs.Get("brand")); brand != "" && brand != "all" {
		terrArgs = append(terrArgs, brand)
		terrCond += fmt.Sprintf(" AND c.brand = $%d", len(terrArgs))
	}

	// Funnel over the (date-filtered, role-scoped) lead set. Base counts come
	// from the SHARED leadStats source (item 5 — identical to lead management).
	st, err := s.leadStats(ctx, terrCond, terrArgs)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "stats failed: "+err.Error())
		return
	}
	came, converted, quotation := st.Total, st.Converted, st.Quotation

	// Customer / Sales Order ride the ERP back-links: Customer.lead_name →
	// lead docname, then Sales Order.customer → that Customer docname.
	var becameCustomer, soCount int
	var soAmount float64
	// The scalar sub-queries are non-correlated, so an inner `customers c` shadows
	// the outer alias cleanly — no fragile string re-aliasing (fixes the ASM 500
	// where ReplaceAll corrupted the `pk.`/`pc.` pincode-scope alias).
	q := `
SELECT
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM erp_customers ec WHERE ec.lead_name = c.erp_lead_id)),
  (SELECT count(*) FROM erp_sales_orders so WHERE so.customer IN (
     SELECT ec.erp_name FROM erp_customers ec JOIN customers c ON ec.lead_name = c.erp_lead_id ` + terrCond + `)),
  COALESCE((SELECT sum(so.grand_total) FROM erp_sales_orders so WHERE so.customer IN (
     SELECT ec.erp_name FROM erp_customers ec JOIN customers c ON ec.lead_name = c.erp_lead_id ` + terrCond + `)), 0)
FROM customers c ` + terrCond
	// Placeholders repeat across the three predicate copies — one arg list, referenced 3×.
	if err := s.pool.QueryRow(ctx, q, terrArgs...).Scan(&becameCustomer, &soCount, &soAmount); err != nil {
		writeError(w, http.StatusInternalServerError, "funnel failed: "+err.Error())
		return
	}

	// Status breakdown for the filtered set.
	statuses := []map[string]any{}
	if rows, err := s.pool.Query(ctx,
		"SELECT c.status, count(*) FROM customers c "+terrCond+" GROUP BY 1 ORDER BY 2 DESC LIMIT 14", terrArgs...); err == nil {
		for rows.Next() {
			var st string
			var n int
			if rows.Scan(&st, &n) == nil {
				statuses = append(statuses, map[string]any{"name": st, "count": n})
			}
		}
		rows.Close()
	}

	// Unassigned summary within the current filters (unassigned from shared
	// stats; the with-pincode split needs its own filter).
	unassigned := st.Unassigned
	var unassignedWithPin int
	_ = s.pool.QueryRow(ctx, `
SELECT count(*) FILTER (WHERE c.assignment_status <> 'Assigned' AND COALESCE(c.custom_pincode,'') <> '')
FROM customers c `+terrCond, terrArgs...).Scan(&unassignedWithPin)

	// Per-brand segmentation (date/territory-scoped, brand filter NOT applied).
	brands := []map[string]any{}
	if rows, err := s.pool.Query(ctx, `
SELECT COALESCE(NULLIF(c.brand,''),'(no brand)'), count(*),
  count(*) FILTER (WHERE c.assignment_status <> 'Assigned'),
  count(*) FILTER (WHERE c.assignment_status = 'Assigned'),
  count(*) FILTER (WHERE c.status = 'Converted')
FROM customers c `+brandCond+` GROUP BY 1 ORDER BY 2 DESC LIMIT 10`, brandArgs...); err == nil {
		for rows.Next() {
			var b string
			var n, un, as, cv int
			if rows.Scan(&b, &n, &un, &as, &cv) == nil {
				brands = append(brands, map[string]any{
					"brand": b, "total": n, "unassigned": un, "assigned": as, "converted": cv,
				})
			}
		}
		rows.Close()
	}

	out := map[string]any{
		"company":           "P91 India (Plus Nine One Inc)",
		"came":              came,
		"converted":         converted,
		"quotation":         quotation,
		"customers":         becameCustomer,
		"soCount":           soCount,
		"statuses":          statuses,
		"brands":            brands,
		"unassigned":        unassigned,
		"unassignedWithPin": unassignedWithPin,
		"unassignedNoPin":   unassigned - unassignedWithPin,
	}
	// Sales-order money is admin/NSM-only (spec §3).
	if p.RoleCode == "admin" || p.RoleCode == "nsm" || p.RoleCode == "platform_super_admin" {
		out["soAmount"] = soAmount
	}

	// Territory drill-down: its pincodes, per-pincode volume + responsible
	// partners, and the recent actions taken on those leads.
	if territory != "" {
		pincodes := []map[string]any{}
		if rows, err := s.pool.Query(ctx, `
SELECT COALESCE(NULLIF(c.custom_pincode,''),'(no pincode)') AS pin, count(*),
  count(*) FILTER (WHERE c.assignment_status='Assigned'),
  COALESCE(string_agg(DISTINCT sp.name || ' (' || COALESCE(sp.partner_type,'?') || ')', ', '), '')
FROM customers c
LEFT JOIN sales_partner_pincodes pc ON pc.pincode = c.custom_pincode
LEFT JOIN sales_partners sp ON sp.id = pc.partner_id
`+terrCond+` GROUP BY 1 ORDER BY 2 DESC LIMIT 40`, terrArgs...); err == nil {
			for rows.Next() {
				var pin, partners string
				var n, assigned int
				if rows.Scan(&pin, &n, &assigned, &partners) == nil {
					pincodes = append(pincodes, map[string]any{
						"pincode": pin, "leads": n, "assigned": assigned, "responsible": partners,
					})
				}
			}
			rows.Close()
		}
		out["pincodes"] = pincodes

		activity := []map[string]any{}
		if rows, err := s.pool.Query(ctx, `
SELECT h.at, COALESCE(u.name,'system'), h.event, COALESCE(h.from_status,''), COALESCE(h.to_status,''),
       COALESCE(h.note,''), c.name
FROM lead_history h
JOIN customers c ON c.id = h.customer_id
LEFT JOIN users u ON u.id = h.actor_id
`+terrCond+` ORDER BY h.at DESC LIMIT 25`, terrArgs...); err == nil {
			for rows.Next() {
				var at time.Time
				var actor, event, from, to, note, leadName string
				if rows.Scan(&at, &actor, &event, &from, &to, &note, &leadName) == nil {
					activity = append(activity, map[string]any{
						"at": at, "actor": actor, "event": event, "from": from, "to": to,
						"note": note, "lead": leadName,
					})
				}
			}
			rows.Close()
		}
		out["activity"] = activity
	}

	writeJSON(w, http.StatusOK, out)
}

// handleAdminActivity — GET /api/erp/admin/activity (live feed, 15s poll).
func (s *Server) handleAdminActivity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	out := []map[string]any{}
	rows, err := s.pool.Query(ctx, `
SELECT h.id, h.at, COALESCE(u.name,'system'), h.actor_id, COALESCE(r.code,''),
       COALESCE(c.name,''), h.customer_id, h.from_status, h.to_status
FROM lead_history h
LEFT JOIN users u ON u.id=h.actor_id
LEFT JOIN roles r ON r.id=u.role_id
LEFT JOIN customers c ON c.id=h.customer_id
ORDER BY h.at DESC LIMIT 50`)
	if err == nil {
		for rows.Next() {
			var id, customerID uuid.UUID
			var actorID *uuid.UUID
			var at time.Time
			var actorName, roleCode, customerName string
			var from, to *string
			if rows.Scan(&id, &at, &actorName, &actorID, &roleCode, &customerName, &customerID, &from, &to) == nil {
				row := map[string]any{
					"id": id.String(), "at": at, "actor_name": actorName, "actor_role": roleToFE(roleCode),
					"customer_name": customerName, "customer_id": customerID.String(),
					"from_status": from, "to_status": to,
				}
				if actorID != nil {
					row["actor_id"] = actorID.String()
				}
				out = append(out, row)
			}
		}
		rows.Close()
	}
	writeJSON(w, http.StatusOK, out)
}
