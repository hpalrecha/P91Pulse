package httpapi

import (
	"net/http"

	"github.com/google/uuid"
)

// handleListSalesPartners — GET /api/erp/sales-partners
// Real data from the synced sales_partners table (replaces the hardcoded
// demoPartners on the Sales Partner Management page). Each row carries its
// pincode/brand coverage, the linked Pulse login (if provisioned), and how many
// leads are currently assigned to that partner by name.
func (s *Server) handleListSalesPartners(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := s.pool.Query(ctx, `
SELECT sp.id, sp.name, COALESCE(sp.partner_type,''), COALESCE(sp.email,''), COALESCE(sp.mobile,''),
       COALESCE(sp.territory,''),
       (SELECT count(*) FROM sales_partner_pincodes pk WHERE pk.partner_id = sp.id),
       COALESCE((SELECT string_agg(b.brand, ', ' ORDER BY b.brand) FROM sales_partner_brands b WHERE b.partner_id = sp.id), ''),
       sp.user_id IS NOT NULL,
       (SELECT count(*) FROM customers c WHERE c.assigned_to = sp.name)
FROM sales_partners sp
ORDER BY (SELECT count(*) FROM sales_partner_pincodes pk WHERE pk.partner_id = sp.id) DESC, sp.name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "sales partners failed: "+err.Error())
		return
	}
	defer rows.Close()

	out := []map[string]any{}
	var distributors, detailers, installers, totalLeads int
	for rows.Next() {
		var id uuid.UUID
		var name, ptype, email, mobile, territory, brands string
		var pincodeCount, leadCount int
		var hasLogin bool
		if rows.Scan(&id, &name, &ptype, &email, &mobile, &territory, &pincodeCount, &brands, &hasLogin, &leadCount) != nil {
			continue
		}
		switch ptype {
		case "Distributor":
			distributors++
		case "Installer":
			installers++
		default:
			detailers++
		}
		totalLeads += leadCount
		out = append(out, map[string]any{
			"id": id.String(), "name": name, "partnerType": ptype, "email": email,
			"mobile": mobile, "territory": territory, "pincodeCount": pincodeCount,
			"brands": brands, "hasLogin": hasLogin, "leadCount": leadCount,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"partners": out,
		"summary": map[string]any{
			"total": len(out), "distributors": distributors, "detailers": detailers,
			"installers": installers, "totalLeads": totalLeads,
		},
	})
}
