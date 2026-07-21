package httpapi

import (
	"net/http"

	"github.com/google/uuid"
)

// handleMyCoverage — GET /api/erp/my-coverage
// "Pincodes assigned + the detailers/installers in their area" for the current
// user (spec §4). Pincodes come from the Sales Partner linked to the login
// (ASM: the parent distributor's); states from user_states; team = users
// seated under this user in the hierarchy.
func (s *Server) handleMyCoverage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)

	// Whose partner record drives the pincode set? ASM inherits his distributor.
	coverageUser := p.UserID
	if p.RoleCode == "asm" {
		var parent *uuid.UUID
		if err := s.pool.QueryRow(ctx, `SELECT parent_user_id FROM users WHERE id=$1`, p.UserID).Scan(&parent); err == nil && parent != nil {
			coverageUser = *parent
		}
	}

	var partnerName, partnerType *string
	_ = s.pool.QueryRow(ctx,
		`SELECT name, partner_type FROM sales_partners WHERE user_id = $1 LIMIT 1`, coverageUser).
		Scan(&partnerName, &partnerType)

	pincodes := []string{}
	if rows, err := s.pool.Query(ctx, `
SELECT DISTINCT pc.pincode FROM sales_partner_pincodes pc
JOIN sales_partners sp ON sp.id = pc.partner_id
WHERE sp.user_id = $1 ORDER BY pc.pincode`, coverageUser); err == nil {
		for rows.Next() {
			var pin string
			if rows.Scan(&pin) == nil {
				pincodes = append(pincodes, pin)
			}
		}
		rows.Close()
	}

	states := []string{}
	if rows, err := s.pool.Query(ctx,
		`SELECT state FROM user_states WHERE user_id = $1 ORDER BY state`, p.UserID); err == nil {
		for rows.Next() {
			var st string
			if rows.Scan(&st) == nil {
				states = append(states, st)
			}
		}
		rows.Close()
	}

	// Direct reports (detailers/installers under a distributor, ASMs under
	// their distributor, etc.). For ASM show the distributor's team.
	team := []map[string]any{}
	if rows, err := s.pool.Query(ctx, `
SELECT u.id, u.name, r.code, u.phone, u.is_active
FROM users u JOIN roles r ON r.id = u.role_id
WHERE u.parent_user_id = $1 ORDER BY u.name LIMIT 100`, coverageUser); err == nil {
		for rows.Next() {
			var id uuid.UUID
			var name, role, phone string
			var active bool
			if rows.Scan(&id, &name, &role, &phone, &active) == nil {
				team = append(team, map[string]any{
					"id": id.String(), "name": name, "role": roleToFE(role), "phone": phone, "isActive": active,
				})
			}
		}
		rows.Close()
	}

	out := map[string]any{
		"role":     roleToFE(p.RoleCode),
		"states":   states,
		"pincodes": pincodes,
		"team":     team,
	}
	if partnerName != nil {
		out["partnerName"] = *partnerName
	}
	if partnerType != nil {
		out["partnerType"] = *partnerType
	}
	writeJSON(w, http.StatusOK, out)
}
