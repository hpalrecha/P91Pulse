package httpapi

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/p91/pulse/internal/rbac"
)

// leadScope returns a SQL predicate (starting with " AND ...") that limits
// which customers rows the principal may see, per docs/LEAD-FLOW-SPEC.md §4.
// The alias for the customers table must be "c".
func leadScope(p *rbac.Principal, args *[]any) string {
	switch p.RoleCode {
	case "admin", "platform_super_admin", "nsm":
		// NSM sees everything (all-India coverage); admin is oversight.
		return ""
	case "distributor":
		// Pincode coverage ∪ explicit assignment ∪ own detailers' leads.
		*args = append(*args, p.UserID)
		n := len(*args)
		return fmt.Sprintf(` AND (
  c.distributor_id = $%d
  OR c.detailer_id IN (SELECT id FROM users WHERE parent_user_id = $%d)
  OR c.custom_pincode IN (SELECT pk.pincode FROM sales_partner_pincodes pk
      JOIN sales_partners sp ON sp.id = pk.partner_id WHERE sp.user_id = $%d))`, n, n, n)
	case "detailer", "installer":
		// A detailer sees leads assigned to them OR whose pincode is in their
		// (5km-precomputed) pincode set — "the moment it hits, it shows".
		*args = append(*args, p.UserID)
		n := len(*args)
		return fmt.Sprintf(` AND (
  c.detailer_id = $%d
  OR c.custom_pincode IN (SELECT pk.pincode FROM sales_partner_pincodes pk
      JOIN sales_partners sp ON sp.id = pk.partner_id WHERE sp.user_id = $%d))`, n, n)
	case "salesperson":
		// The salesperson works the unassigned queue (B2C enrichment §3).
		return " AND c.assignment_status <> 'Assigned'"
	case "rsm":
		// Territory visibility via user_states ('*' = all India). A user with no
		// states configured currently sees everything (dev default — tighten once
		// state allocation is administered).
		*args = append(*args, p.UserID)
		n := len(*args)
		return fmt.Sprintf(" AND (NOT EXISTS (SELECT 1 FROM user_states us WHERE us.user_id = $%d)"+
			" OR EXISTS (SELECT 1 FROM user_states us WHERE us.user_id = $%d AND (us.state = '*' OR us.state = c.state)))", n, n)
	case "asm":
		// ASM inherits his distributor's coverage (spec §4): leads assigned to
		// that distributor OR falling in the distributor's partner pincode set;
		// user_states works as an additional manual grant.
		*args = append(*args, p.UserID)
		n := len(*args)
		return fmt.Sprintf(` AND (
  c.distributor_id = (SELECT parent_user_id FROM users WHERE id = $%d)
  OR c.custom_pincode IN (
      SELECT pc.pincode FROM sales_partner_pincodes pc
      JOIN sales_partners sp ON sp.id = pc.partner_id
      WHERE sp.user_id = (SELECT parent_user_id FROM users WHERE id = $%d))
  OR EXISTS (SELECT 1 FROM user_states us WHERE us.user_id = $%d AND (us.state = '*' OR us.state = c.state)))`, n, n, n)
	default:
		return " AND false"
	}
}

// B2C / B2B classification — the single definition, keyed on the ERP Lead.type
// vocabulary (verified live: End User / B2B / Client / Channel Partner /
// Consultant / blank). B2C = consumer; B2B = every partner/business type. The
// blank-type leads are unclassified (salesperson triage), counted in neither.
// {ALIAS} is replaced with the table alias in use ("c" or "" for bare column).
const sqlB2C = "COALESCE({ALIAS}lead_type,'') IN ('End User','Individual','')"
const sqlB2B = "{ALIAS}lead_type IN ('B2B','Client','Channel Partner','Consultant','Sales')"

func b2cCond(alias string) string { return strings.ReplaceAll(sqlB2C, "{ALIAS}", alias) }
func b2bCond(alias string) string { return strings.ReplaceAll(sqlB2B, "{ALIAS}", alias) }

// leadStatsRow is THE single source of lead numbers — used by both the
// lead-management list envelope and the dashboard insights, so both surfaces
// always show identical figures for identical filters.
type leadStatsRow struct {
	Total      int `json:"total"`
	Unassigned int `json:"unassigned"`
	Assigned   int `json:"assigned"`
	Converted  int `json:"converted"`
	Quotation  int `json:"quotation"`
	New        int `json:"new"`       // Lead + Open (compat bucket)
	Contacted  int `json:"contacted"` // Replied + Interested (compat bucket)
	Qualified  int `json:"qualified"` // Opportunity + Quotation + Prospect (compat bucket)
}

// leadStats computes the shared numbers over customers rows matching cond
// (a WHERE clause with alias c) + args.
func (s *Server) leadStats(ctx context.Context, cond string, args []any) (leadStatsRow, error) {
	var st leadStatsRow
	q := `SELECT count(*),
  count(*) FILTER (WHERE c.assignment_status <> 'Assigned'),
  count(*) FILTER (WHERE c.assignment_status = 'Assigned'),
  count(*) FILTER (WHERE c.status = 'Converted'),
  count(*) FILTER (WHERE c.status = 'Quotation'),
  count(*) FILTER (WHERE c.status IN ('Lead','Open')),
  count(*) FILTER (WHERE c.status IN ('Replied','Interested')),
  count(*) FILTER (WHERE c.status IN ('Opportunity','Quotation','Prospect'))
FROM customers c ` + cond
	err := s.pool.QueryRow(ctx, q, args...).
		Scan(&st.Total, &st.Unassigned, &st.Assigned, &st.Converted, &st.Quotation, &st.New, &st.Contacted, &st.Qualified)
	return st, err
}

// matchedPartner is the result of the pincode→Sales-Partner match.
type matchedPartner struct {
	ID          uuid.UUID
	Name        string
	PartnerType string
	UserID      *uuid.UUID
	UserRole    string
}

// matchPartner implements the B2C assignment rule (spec §2): a lead is Assigned
// when its pincode is in a Sales Partner's pincode set and the partner serves
// the lead's brand (partners with no brand rows accept any brand). Detailers
// win over distributors for B2C (the 5km/direct-service rule).
func (s *Server) matchPartner(ctx context.Context, pincode, brand string) (*matchedPartner, error) {
	if pincode == "" {
		return nil, nil
	}
	const q = `
SELECT sp.id, sp.name, COALESCE(sp.partner_type,''), sp.user_id,
       COALESCE((SELECT r.code FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = sp.user_id), '')
FROM sales_partners sp
JOIN sales_partner_pincodes pc ON pc.partner_id = sp.id
WHERE pc.pincode = $1
  AND ($2 = '' OR NOT EXISTS (SELECT 1 FROM sales_partner_brands b WHERE b.partner_id = sp.id)
       OR EXISTS (SELECT 1 FROM sales_partner_brands b WHERE b.partner_id = sp.id AND lower(b.brand) = lower($2)))
ORDER BY (sp.partner_type = 'Detailer') DESC, sp.name
LIMIT 1`
	var m matchedPartner
	err := s.pool.QueryRow(ctx, q, pincode, brand).Scan(&m.ID, &m.Name, &m.PartnerType, &m.UserID, &m.UserRole)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

// applyAssignment mutates the given SQL SET fragments to record an assignment
// (or leave the lead unassigned). Returns whether a partner matched.
// Per spec §2/§3: matched ⇒ Assigned + status promoted to Opportunity.
func assignmentSets(m *matchedPartner) (assignmentStatus, assignedTo string, detailerID, distributorID *uuid.UUID, promote bool) {
	if m == nil {
		return "Not Assigned", "", nil, nil, false
	}
	assignedTo = m.Name
	assignmentStatus = "Assigned"
	if m.UserID != nil {
		switch m.UserRole {
		case "distributor":
			distributorID = m.UserID
		case "detailer", "installer":
			detailerID = m.UserID
		}
	}
	// Partner-type fallback when no Pulse login is linked yet: ids stay nil,
	// the name in assigned_to still surfaces in the UI.
	return assignmentStatus, assignedTo, detailerID, distributorID, true
}
