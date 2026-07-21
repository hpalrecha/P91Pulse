package httpapi

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// leadRow is the JSON shape the ported lead-management UI consumes
// (field names verbatim from the stage frontend — mixed camel/snake).
type leadRow struct {
	ID               string     `json:"id"`
	Name             string     `json:"name"`
	Status           string     `json:"status"`
	LeadType         *string    `json:"lead_type"`
	CallStatus       *string    `json:"callStatus"`
	ProspectName     *string    `json:"prospectName"`
	DupCount         int        `json:"dupCount"`
	Phone            *string    `json:"phone"`
	Email            *string    `json:"email"`
	City             *string    `json:"city"`
	State            *string    `json:"state"`
	Pincode          *string    `json:"pincode"`
	Brand            *string    `json:"brand"`
	CustomerGroup    *string    `json:"customerGroup"`
	Territory        *string    `json:"territory"`
	DetailerID       *string    `json:"detailerId"`
	DistributorID    *string    `json:"distributorId"`
	AssignedTo       *string    `json:"assignedTo"`
	AssignmentStatus string     `json:"assignmentStatus"`
	Vehicle          *string    `json:"vehicle"`
	VehicleBrand     *string    `json:"vehicleBrand"`
	VehicleModel     *string    `json:"vehicleModel"`
	AlternatePhone   *string    `json:"alternatePhone"`
	LeadSource       *string    `json:"leadSource"`
	ExternalID       *string    `json:"external_id"`
	ExternalSource   *string    `json:"external_source"`
	Comments         *string    `json:"comments"`
	Disposition      *string    `json:"disposition"`
	CreatedBy        *string    `json:"createdBy"`
	ErpLeadID        *string    `json:"erpLeadId"`
	ErpOpportunityID *string    `json:"erpOpportunityId"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
	LeadScore        *float64   `json:"leadScore"`
	FrozenAt         *time.Time `json:"-"`
	IsFrozen         bool       `json:"isFrozen"`
}

const leadCols = `c.id, c.name, c.status, c.lead_type, c.call_status, c.prospect_name, c.phone, c.email,
c.city, c.state, c.custom_pincode, c.brand, c.customer_group, c.territory,
c.detailer_id, c.distributor_id, c.assigned_to, c.assignment_status,
c.vehicle, c.vehicle_brand, c.vehicle_model, c.alternate_phone, c.lead_source,
c.external_id, c.external_source, c.remarks, c.disposition, c.created_by,
c.erp_lead_id, c.erp_opportunity_id, c.created_at, c.updated_at, c.lead_score, c.is_frozen`

func scanLead(row pgx.Row) (*leadRow, error) {
	var l leadRow
	var id uuid.UUID
	var det, dis *uuid.UUID
	err := row.Scan(&id, &l.Name, &l.Status, &l.LeadType, &l.CallStatus, &l.ProspectName, &l.Phone, &l.Email,
		&l.City, &l.State, &l.Pincode, &l.Brand, &l.CustomerGroup, &l.Territory,
		&det, &dis, &l.AssignedTo, &l.AssignmentStatus,
		&l.Vehicle, &l.VehicleBrand, &l.VehicleModel, &l.AlternatePhone, &l.LeadSource,
		&l.ExternalID, &l.ExternalSource, &l.Comments, &l.Disposition, &l.CreatedBy,
		&l.ErpLeadID, &l.ErpOpportunityID, &l.CreatedAt, &l.UpdatedAt, &l.LeadScore, &l.IsFrozen)
	if err != nil {
		return nil, err
	}
	l.ID = id.String()
	if det != nil {
		s := det.String()
		l.DetailerID = &s
	}
	if dis != nil {
		s := dis.String()
		l.DistributorID = &s
	}
	return &l, nil
}

// scopedLead loads one lead the principal is allowed to see (else 404).
func (s *Server) scopedLead(ctx context.Context, r *http.Request, id string) (*leadRow, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, pgx.ErrNoRows
	}
	p := principalFrom(r.Context())
	args := []any{uid}
	cond := leadScope(p, &args)
	q := "SELECT " + leadCols + " FROM customers c WHERE c.id = $1" + cond
	return scanLead(s.pool.QueryRow(ctx, q, args...))
}

// handleListCustomers — GET /api/erp/customers
// Returns the envelope the ported UI expects: {rows, facets, stats, total}.
func (s *Server) handleListCustomers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
	qs := r.URL.Query()

	args := []any{}
	where := "WHERE 1=1" + leadScope(p, &args)

	addEq := func(col, val string) {
		if val != "" && val != "all" {
			args = append(args, val)
			where += fmt.Sprintf(" AND c.%s = $%d", col, len(args))
		}
	}

	// Brand-arm segmentation (All / P91 CC B2C / Others).
	switch qs.Get("arm") {
	case "p91cc":
		where += " AND (lower(COALESCE(c.brand,'')) IN ('p91 cc','p91cc') OR c.customer_group = 'P91 Car Care')"
	case "others":
		where += " AND NOT (lower(COALESCE(c.brand,'')) IN ('p91 cc','p91cc') OR c.customer_group = 'P91 Car Care')"
	}
	switch qs.Get("assignment") {
	case "assigned":
		where += " AND c.assignment_status = 'Assigned'"
	case "unassigned":
		where += " AND c.assignment_status <> 'Assigned'"
	}
	switch qs.Get("leadCategory") {
	case "b2c":
		where += " AND " + b2cCond("c.")
	case "b2b":
		where += " AND " + b2bCond("c.")
	}
	addEq("status", qs.Get("status"))
	addEq("lead_type", qs.Get("leadType"))
	addEq("brand", qs.Get("brand"))
	addEq("customer_group", qs.Get("customerGroup"))
	addEq("territory", qs.Get("territory"))
	addEq("created_by", qs.Get("createdBy"))
	addEq("call_status", qs.Get("callStatus"))
	if q := strings.TrimSpace(qs.Get("search")); q != "" {
		args = append(args, "%"+q+"%")
		n := len(args)
		where += fmt.Sprintf(" AND (c.name ILIKE $%d OR c.phone ILIKE $%d OR c.email ILIKE $%d)", n, n, n)
	}

	// Shared stats — the SAME source the dashboard insights use (item 5).
	st, err := s.leadStats(ctx, where, args)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "stats failed: "+err.Error())
		return
	}
	total := st.Total
	stats := st

	// facets — computed under the role scope only (not the other filters), so
	// the dropdowns always show the full option set for this user.
	facetArgs := []any{}
	facetCond := "WHERE 1=1" + leadScope(p, &facetArgs)
	facets := map[string][]map[string]any{}
	for key, col := range map[string]string{
		"status": "status", "leadType": "lead_type", "brand": "brand",
		"customerGroup": "customer_group", "territory": "territory", "createdBy": "created_by",
	} {
		rows, err := s.pool.Query(ctx,
			fmt.Sprintf(`SELECT c.%s, count(*) FROM customers c %s AND COALESCE(c.%s,'') <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 60`, col, facetCond, col),
			facetArgs...)
		if err != nil {
			continue
		}
		list := []map[string]any{}
		for rows.Next() {
			var v string
			var c int
			if rows.Scan(&v, &c) == nil {
				list = append(list, map[string]any{"value": v, "count": c})
			}
		}
		rows.Close()
		facets[key] = list
	}

	// page
	page, _ := strconv.Atoi(qs.Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(qs.Get("pageSize"))
	if pageSize < 1 || pageSize > 200 {
		pageSize = 50
	}
	args = append(args, pageSize, (page-1)*pageSize)
	listQ := "SELECT " + leadCols + " FROM customers c " + where +
		fmt.Sprintf(" ORDER BY c.updated_at DESC NULLS LAST, c.id DESC LIMIT $%d OFFSET $%d", len(args)-1, len(args))
	rows, err := s.pool.Query(ctx, listQ, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list failed: "+err.Error())
		return
	}
	defer rows.Close()
	leads := []*leadRow{}
	for rows.Next() {
		l, err := scanLead(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed: "+err.Error())
			return
		}
		leads = append(leads, l)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"rows": leads, "facets": facets, "stats": stats, "total": total,
	})
}

// handleCreateCustomer — POST /api/erp/customers (create lead, B2C flow entry).
func (s *Server) handleCreateCustomer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
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
	phone := str("phone")
	if name == "" || phone == "" {
		writeError(w, http.StatusBadRequest, "name and phone are required")
		return
	}
	pincode := str("pincode")
	brand := str("brand")

	// The B2C assignment rule (spec §2): pincode present → try the partner match.
	m, err := s.matchPartner(ctx, pincode, brand)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "assignment match failed: "+err.Error())
		return
	}
	assignStatus, assignedTo, detID, disID, matched := assignmentSets(m)
	status := "Lead"
	if matched {
		status = "Opportunity" // assigned ⇒ promoted (spec §3)
	}

	// Explicit assignee from the create dialog overrides/augments the auto-match.
	if v := str("detailerId"); v != "" {
		if u, e := uuid.Parse(v); e == nil {
			detID, assignStatus = &u, "Assigned"
		}
	}
	if v := str("distributorId"); v != "" {
		if u, e := uuid.Parse(v); e == nil {
			disID, assignStatus = &u, "Assigned"
		}
	}

	creator := p.UserID.String()
	if u, e := s.q.GetUserByID(ctx, p.UserID); e == nil {
		creator = u.User.Name
	}

	var id uuid.UUID
	err = s.pool.QueryRow(ctx, `
INSERT INTO customers (name, phone, email, city, state, custom_pincode, brand, customer_group,
  lead_type, lead_source, vehicle, vehicle_brand, vehicle_model, alternate_phone, remarks,
  external_id, external_source, status, assignment_status, assigned_to, detailer_id, distributor_id, created_by)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NULLIF($20,''),$21,$22,$23)
RETURNING id`,
		name, phone, nilIfEmpty(str("email")), nilIfEmpty(str("city")), nilIfEmpty(str("state")),
		nilIfEmpty(pincode), nilIfEmpty(brand), nilIfEmpty(str("customerGroup")),
		nilIfEmpty(str("lead_type")), nilIfEmpty(str("leadSource")), nilIfEmpty(str("vehicle")),
		nilIfEmpty(str("vehicleBrand")), nilIfEmpty(str("vehicleModel")), nilIfEmpty(str("alternatePhone")),
		nilIfEmpty(str("comments")), nilIfEmpty(str("external_id")), nilIfEmpty(str("external_source")),
		status, assignStatus, assignedTo, detID, disID, creator).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "create failed: "+err.Error())
		return
	}
	s.writeLeadHistory(ctx, id, "created", "", status, p.UserID, "")
	if matched {
		s.writeLeadHistory(ctx, id, "assigned", "", "", p.UserID, "auto-matched to "+assignedTo)
	}
	s.writeAudit(ctx, p.UserID, "lead.created", "customers", id.String())
	writeJSON(w, http.StatusCreated, map[string]any{"id": id.String(), "status": status, "assignmentStatus": assignStatus, "assignedTo": assignedTo})
}

// handlePatchCustomer — PATCH /api/erp/customers/{id} (call status / disposition).
func (s *Server) handlePatchCustomer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
	lead, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "lead not found")
		return
	}
	var body struct {
		CallStatus  *string `json:"callStatus"`
		Disposition *string `json:"disposition"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	_, err = s.pool.Exec(ctx,
		`UPDATE customers SET call_status = COALESCE($2, call_status), disposition = COALESCE($3, disposition) WHERE id = $1`,
		lead.ID, body.CallStatus, body.Disposition)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update failed")
		return
	}
	uid, _ := uuid.Parse(lead.ID)
	s.writeAudit(ctx, p.UserID, "lead.disposition", "customers", lead.ID)
	if body.Disposition != nil {
		s.writeLeadHistory(ctx, uid, "disposition", "", *body.Disposition, p.UserID, strFrom(body.CallStatus))
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleLeadComments — GET/POST /api/erp/customers/{id}/comments
func (s *Server) handleLeadComments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lead, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "lead not found")
		return
	}
	if r.Method == http.MethodPost {
		p := principalFrom(ctx)
		var body struct {
			Comment string `json:"comment"`
		}
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.Comment) == "" {
			writeError(w, http.StatusBadRequest, "comment is required")
			return
		}
		_, err := s.pool.Exec(ctx, `INSERT INTO lead_comments (customer_id, user_id, comment) VALUES ($1,$2,$3)`,
			lead.ID, p.UserID, body.Comment)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "comment failed")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{"success": true})
		return
	}
	rows, err := s.pool.Query(ctx,
		`SELECT lc.id, lc.user_id, lc.comment, lc.created_at FROM lead_comments lc WHERE lc.customer_id = $1 ORDER BY lc.created_at DESC`, lead.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "comments failed")
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id uuid.UUID
		var userID *uuid.UUID
		var comment string
		var at time.Time
		if rows.Scan(&id, &userID, &comment, &at) == nil {
			row := map[string]any{"id": id.String(), "comment": comment, "createdAt": at}
			if userID != nil {
				row["userId"] = userID.String()
			}
			out = append(out, row)
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// handleLeadActivity — GET /api/erp/customers/{id}/activity
// Tracks tab: {erp:[], local:[], erpReachable}. ERP-side entries arrive once the
// live ERP proxy lands; local history/comments render now.
func (s *Server) handleLeadActivity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lead, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "lead not found")
		return
	}
	local := []map[string]any{}
	rows, err := s.pool.Query(ctx, `
SELECT h.event, h.from_status, h.to_status, h.note, h.at, COALESCE(u.name,'')
FROM lead_history h LEFT JOIN users u ON u.id = h.actor_id
WHERE h.customer_id = $1 ORDER BY h.at DESC`, lead.ID)
	if err == nil {
		for rows.Next() {
			var event, note, who string
			var from, to *string
			var at time.Time
			if rows.Scan(&event, &from, &to, &note, &at, &who) == nil {
				title := event
				if to != nil && *to != "" {
					title = strFrom(from) + " → " + *to
				}
				local = append(local, map[string]any{
					"when": at, "label": event, "doctype": "Pulse", "title": title,
					"who": who, "source": "pulse", "detail": note,
				})
			}
		}
		rows.Close()
	}
	writeJSON(w, http.StatusOK, map[string]any{"erp": []any{}, "local": local, "erpReachable": false})
}

// handleLeadErpDoc — GET /api/erp/customers/{id}/erp-doc
// Serves the edit form. Until the live ERP proxy lands, the "lead" doc is
// reconstructed from the local mirror using ERP fieldnames.
func (s *Server) handleLeadErpDoc(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	l, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "lead not found")
		return
	}
	doc := map[string]any{
		"lead_name":             l.Name,
		"status":                l.Status,
		"type":                  strFrom(l.LeadType),
		"source":                strFrom(l.LeadSource),
		"custom_brand":          strFrom(l.Brand),
		"custom_customer_group": strFrom(l.CustomerGroup),
		"custom_lead_status":    l.AssignmentStatus,
		"custom_score":          l.LeadScore,
		"mobile_no":             strFrom(l.Phone),
		"phone":                 strFrom(l.Phone),
		"email_id":              strFrom(l.Email),
		"city":                  strFrom(l.City),
		"state":                 strFrom(l.State),
		"territory":             strFrom(l.Territory),
		"custom_pincode":        strFrom(l.Pincode),
		"custom_remarks":        strFrom(l.Comments),
		"custom_vehicle_type":   "",
		"custom_car_brand":      strFrom(l.VehicleBrand),
		"custom_car_model_name": strFrom(l.VehicleModel),
		"creation":              l.CreatedAt.Format(time.RFC3339),
		"modified":              l.UpdatedAt.Format(time.RFC3339),
	}
	resolved := map[string]any{}
	if l.ErpLeadID != nil {
		resolved["lead"] = *l.ErpLeadID
	}
	if l.ErpOpportunityID != nil {
		resolved["opportunity"] = *l.ErpOpportunityID
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"lead": doc, "erpReachable": false, "resolved": resolved,
	})
}

// handleLeadErpEdit — PUT /api/erp/customers/{id}/erp-lead
// The salesperson enrichment path (spec §3): edits land locally now and re-run
// the assignment match when pincode/brand change; the nightly batch pushes to ERP.
func (s *Server) handleLeadErpEdit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	p := principalFrom(ctx)
	lead, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "lead not found")
		return
	}
	if lead.IsFrozen {
		writeError(w, http.StatusConflict, "lead is frozen (converted/lost)")
		return
	}
	var body struct {
		Fields          map[string]any `json:"fields"`
		Comment         string         `json:"comment"`
		ProspectComment string         `json:"prospectComment"`
	}
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if len(body.Fields) == 0 && strings.TrimSpace(body.Comment) == "" {
		writeJSON(w, http.StatusOK, map[string]any{"noop": true})
		return
	}

	// ERP fieldname → customers column (the subset the tab edits).
	colFor := map[string]string{
		"lead_name": "name", "status": "status", "type": "lead_type", "source": "lead_source",
		"custom_brand": "brand", "custom_customer_group": "customer_group",
		"mobile_no": "phone", "email_id": "email", "city": "city", "state": "state",
		"territory": "territory", "custom_pincode": "custom_pincode", "custom_remarks": "remarks",
		"custom_car_brand": "vehicle_brand", "custom_car_model_name": "vehicle_model",
		"custom_bike_brand": "vehicle_brand", "custom_bike_model_name": "vehicle_model",
	}
	sets := []string{}
	args := []any{}
	fieldNote := []string{}
	newStatus := ""
	for f, v := range body.Fields {
		col, ok := colFor[f]
		if !ok {
			continue // unmapped ERP fields queue for the nightly writeback later
		}
		sv := fmt.Sprintf("%v", v)
		args = append(args, sv)
		sets = append(sets, fmt.Sprintf("%s = $%d", col, len(args)))
		fieldNote = append(fieldNote, f)
		if col == "status" {
			newStatus = sv
		}
	}
	if len(sets) > 0 {
		args = append(args, lead.ID)
		q := "UPDATE customers SET " + strings.Join(sets, ", ") + fmt.Sprintf(" WHERE id = $%d", len(args))
		if _, err := s.pool.Exec(ctx, q, args...); err != nil {
			writeError(w, http.StatusInternalServerError, "update failed: "+err.Error())
			return
		}
	}
	uid, _ := uuid.Parse(lead.ID)

	// Status transitions freeze converted/lost (spec: frozen leads lock edits).
	if newStatus != "" && newStatus != lead.Status {
		frozen := newStatus == "Converted" || newStatus == "Lost" || newStatus == "Do Not Contact"
		_, _ = s.pool.Exec(ctx, `UPDATE customers SET is_frozen = $2 WHERE id = $1`, lead.ID, frozen)
		s.writeLeadHistory(ctx, uid, "status_changed", lead.Status, newStatus, p.UserID, body.Comment)
	}

	// Re-run the B2C match when pincode or brand changed (enrichment core).
	pinChanged := body.Fields["custom_pincode"] != nil
	brandChanged := body.Fields["custom_brand"] != nil
	if pinChanged || brandChanged {
		fresh, err := s.scopedLead(ctx, r, lead.ID)
		if err == nil && fresh.AssignmentStatus != "Assigned" {
			m, _ := s.matchPartner(ctx, strFrom(fresh.Pincode), strFrom(fresh.Brand))
			if st, to, det, dis, matched := assignmentSets(m); matched {
				_, _ = s.pool.Exec(ctx, `
UPDATE customers SET assignment_status=$2, assigned_to=$3, detailer_id=COALESCE($4, detailer_id),
  distributor_id=COALESCE($5, distributor_id),
  status = CASE WHEN status IN ('Lead','Open','Replied','Interested') THEN 'Opportunity' ELSE status END
WHERE id = $1`, lead.ID, st, to, det, dis)
				s.writeLeadHistory(ctx, uid, "assigned", "", "", p.UserID, "matched to "+to+" after enrichment")
			}
		}
	}

	if c := strings.TrimSpace(body.Comment); c != "" {
		_, _ = s.pool.Exec(ctx, `INSERT INTO lead_comments (customer_id, user_id, comment) VALUES ($1,$2,$3)`, lead.ID, p.UserID, c)
	}
	if len(fieldNote) > 0 {
		s.writeLeadHistory(ctx, uid, "erp_edit", "", "", p.UserID, "fields: "+strings.Join(fieldNote, ", "))
	}
	s.writeAudit(ctx, p.UserID, "lead.erp_edit", "customers", lead.ID)
	writeJSON(w, http.StatusOK, map[string]any{"noop": false})
}

// handleLeadTaskOrEvent — POST /api/erp/customers/{id}/tasks and /events.
// Stored as flagged comments until ERP ToDo/Event sync lands.
func (s *Server) handleLeadTaskOrEvent(kind string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		p := principalFrom(ctx)
		lead, err := s.scopedLead(ctx, r, chi.URLParam(r, "id"))
		if err != nil {
			writeError(w, http.StatusNotFound, "lead not found")
			return
		}
		var body map[string]any
		if err := decodeLooseJSON(r, &body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}
		text := fmt.Sprintf("%v", firstNonNil(body["description"], body["subject"], ""))
		note := fmt.Sprintf("[%s] %s", strings.ToUpper(kind), text)
		_, _ = s.pool.Exec(ctx, `INSERT INTO lead_comments (customer_id, user_id, comment) VALUES ($1,$2,$3)`, lead.ID, p.UserID, note)
		uid, _ := uuid.Parse(lead.ID)
		s.writeLeadHistory(ctx, uid, kind+"_created", "", "", p.UserID, text)
		writeJSON(w, http.StatusCreated, map[string]any{"success": true})
	}
}

// --- small shared helpers ---------------------------------------------------

func (s *Server) writeLeadHistory(ctx context.Context, customerID uuid.UUID, event, from, to string, actor uuid.UUID, note string) {
	_, _ = s.pool.Exec(ctx,
		`INSERT INTO lead_history (customer_id, event, from_status, to_status, actor_id, note) VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),$5,NULLIF($6,''))`,
		customerID, event, from, to, actor, note)
}

func (s *Server) writeAudit(ctx context.Context, actor uuid.UUID, action, entity, entityID string) {
	_, _ = s.pool.Exec(ctx,
		`INSERT INTO audit_logs (actor_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)`,
		actor, action, entity, entityID)
}

// decodeLooseJSON accepts unknown fields (the ported UI posts wide payloads).
func decodeLooseJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return errors.New("empty body")
	}
	return jsonNewDecoder(r).Decode(dst)
}

func nilIfEmpty(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func strFrom(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func firstNonNil(vals ...any) any {
	for _, v := range vals {
		if v != nil {
			if s, ok := v.(string); ok && s == "" {
				continue
			}
			return v
		}
	}
	return ""
}
