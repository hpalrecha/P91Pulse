// Package syncer pulls ERPNext Leads, Opportunities and Sales Partners and
// upserts them into Postgres (customers / sales_partners + child tables).
// Backfill + incremental via the per-doctype `modified` cursor in
// erp_sync_state. Raw pgx SQL; each page is upserted in one round-trip and the
// cursor is saved per page, so an interrupted run resumes cleanly.
//
// NOTE on status vocabulary: this build stores the RAW ERP status strings
// verbatim in customers.status. Lead rows carry the Lead vocabulary
// (Lead/Open/Replied/Interested/Opportunity/Do Not Contact/Quotation/
// Converted/Prospect/...) and Opportunity rows carry the Opportunity
// vocabulary (Open/Quotation/Converted/Lost/Replied/Closed) — both live in the
// same customers table, distinguished by erp_lead_id vs erp_opportunity_id.
package syncer

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/p91/pulse/internal/erp"
	"github.com/p91/pulse/internal/pincode"
)

const pageSize = 100

type Syncer struct {
	client *erp.Client
	pool   *pgxpool.Pool
	source string // erp_source tag on every row ("p91")
}

func New(client *erp.Client, pool *pgxpool.Pool) *Syncer {
	return &Syncer{client: client, pool: pool, source: client.ID}
}

type Result struct {
	Doctype      string
	Fetched      int
	Upserted     int
	LastModified string
}

// --- erp_sync_state cursor ---------------------------------------------------

// GetCursor returns the saved `modified` high-water mark for a doctype ("" when
// none — full backfill).
func (s *Syncer) GetCursor(ctx context.Context, doctype string) (string, error) {
	var cur *string
	err := s.pool.QueryRow(ctx,
		`SELECT last_modified FROM erp_sync_state WHERE source = $1 AND doctype = $2`,
		s.source, doctype).Scan(&cur)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	if cur == nil {
		return "", nil
	}
	return *cur, nil
}

// SetCursor upserts the `modified` high-water mark for a doctype.
func (s *Syncer) SetCursor(ctx context.Context, doctype, lastModified string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO erp_sync_state (source, doctype, last_modified) VALUES ($1, $2, $3)
		 ON CONFLICT (source, doctype) DO UPDATE SET last_modified = EXCLUDED.last_modified`,
		s.source, doctype, lastModified)
	return err
}

// --- customer row + shared upsert machinery ---------------------------------

// customerRow is one row bound for the customers table. Nil pointers become
// SQL NULLs. DetailerID/DistributorID are user UUIDs as text.
type customerRow struct {
	Name             string
	Phone            *string
	Email            *string
	City             *string
	Territory        *string
	State            *string
	Status           string
	Brand            *string
	LeadSource       *string
	LeadType         *string
	Remarks          *string
	Vehicle          *string
	VehicleBrand     *string
	VehicleModel     *string
	LossReason       *string
	LeadScore        *float64
	AssignmentStatus string
	IsFrozen         bool
	CustomerGroup    *string
	Pincode          *string
	AssignedTo       *string
	DetailerID       *string
	DistributorID    *string
	CreatedBy        *string
	ERPLeadID        *string
	ERPOpportunityID *string
	ERPModified      *string
	ERPCreated       *string // ERP `creation` — the real "lead came on" date
	ExternalID       *string
	ExternalSource   *string
}

// customerCols is the full insert column list shared by both passes; fields a
// pass doesn't map stay nil (NULL).
var customerCols = []string{
	"name", "phone", "email", "city", "territory", "state", "status", "brand",
	"lead_source", "lead_type", "remarks", "vehicle", "vehicle_brand", "vehicle_model",
	"loss_reason", "lead_score", "assignment_status", "is_frozen", "customer_group",
	"custom_pincode", "assigned_to", "detailer_id", "distributor_id", "created_by",
	"erp_source", "erp_lead_id", "erp_opportunity_id", "erp_modified", "erp_created",
	"external_id", "external_source",
}

func (r customerRow) args(source string) []any {
	return []any{
		r.Name, r.Phone, r.Email, r.City, r.Territory, r.State, r.Status, r.Brand,
		r.LeadSource, r.LeadType, r.Remarks, r.Vehicle, r.VehicleBrand, r.VehicleModel,
		r.LossReason, r.LeadScore, r.AssignmentStatus, r.IsFrozen, r.CustomerGroup,
		r.Pincode, r.AssignedTo, r.DetailerID, r.DistributorID, r.CreatedBy,
		source, r.ERPLeadID, r.ERPOpportunityID, r.ERPModified, r.ERPCreated,
		r.ExternalID, r.ExternalSource,
	}
}

// customerUpdateSet is the DO UPDATE clause: ERP-owned fields take EXCLUDED
// verbatim; Pulse-owned fields (detailer_id, distributor_id, assigned_to,
// call_status, disposition) are COALESCE-preserved — an existing Pulse-side
// value always wins over what the sync proposes.
const customerUpdateSet = `
	name = CASE WHEN EXCLUDED.name IN ('', 'Unknown') THEN customers.name ELSE EXCLUDED.name END,
	phone = COALESCE(EXCLUDED.phone, customers.phone),
	email = COALESCE(EXCLUDED.email, customers.email),
	city = COALESCE(EXCLUDED.city, customers.city),
	territory = COALESCE(EXCLUDED.territory, customers.territory),
	state = COALESCE(EXCLUDED.state, customers.state),
	-- Lead-only model: the Lead is the sole writer, so its own status/type win.
	status = EXCLUDED.status,
	is_frozen = EXCLUDED.is_frozen,
	erp_opportunity_id = EXCLUDED.erp_opportunity_id,
	brand = EXCLUDED.brand,
	lead_source = EXCLUDED.lead_source,
	lead_type = EXCLUDED.lead_type,
	remarks = EXCLUDED.remarks,
	vehicle = EXCLUDED.vehicle,
	vehicle_brand = EXCLUDED.vehicle_brand,
	vehicle_model = EXCLUDED.vehicle_model,
	loss_reason = EXCLUDED.loss_reason,
	lead_score = COALESCE(EXCLUDED.lead_score, customers.lead_score),
	assignment_status = CASE WHEN customers.assignment_status = 'Assigned'
	                         THEN customers.assignment_status ELSE EXCLUDED.assignment_status END,
	customer_group = COALESCE(EXCLUDED.customer_group, customers.customer_group),
	custom_pincode = COALESCE(EXCLUDED.custom_pincode, customers.custom_pincode),
	created_by = EXCLUDED.created_by,
	erp_modified = EXCLUDED.erp_modified,
	erp_created = COALESCE(customers.erp_created, EXCLUDED.erp_created),
	external_id = EXCLUDED.external_id,
	external_source = EXCLUDED.external_source,
	assigned_to = COALESCE(customers.assigned_to, EXCLUDED.assigned_to),
	detailer_id = COALESCE(customers.detailer_id, EXCLUDED.detailer_id),
	distributor_id = COALESCE(customers.distributor_id, EXCLUDED.distributor_id),
	call_status = COALESCE(customers.call_status, EXCLUDED.call_status),
	disposition = COALESCE(customers.disposition, EXCLUDED.disposition)`

// upsertCustomers batch-upserts one page with a multi-row VALUES insert.
// conflictClause selects the partial unique index (lead vs opportunity key).
func (s *Syncer) upsertCustomers(ctx context.Context, rows []customerRow, conflictClause string) (int, error) {
	if len(rows) == 0 {
		return 0, nil
	}
	ncols := len(customerCols)
	var b strings.Builder
	b.WriteString("INSERT INTO customers (")
	b.WriteString(strings.Join(customerCols, ", "))
	b.WriteString(") VALUES ")
	args := make([]any, 0, len(rows)*ncols)
	for i, r := range rows {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString("(")
		for j := 0; j < ncols; j++ {
			if j > 0 {
				b.WriteString(",")
			}
			fmt.Fprintf(&b, "$%d", i*ncols+j+1)
		}
		b.WriteString(")")
		args = append(args, r.args(s.source)...)
	}
	b.WriteString(" ON CONFLICT ")
	b.WriteString(conflictClause)
	b.WriteString(" DO UPDATE SET ")
	b.WriteString(customerUpdateSet)

	tag, err := s.pool.Exec(ctx, b.String(), args...)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}

// --- pass 1: Leads -----------------------------------------------------------

var leadFields = []string{
	"name", "lead_name", "first_name", "status", "type", "source", "custom_brand",
	"custom_score", "custom_lead_status", "custom_customer_group", "email_id",
	"mobile_no", "phone", "whatsapp_no", "city", "state", "territory",
	"custom_pincode", "custom_remarks", "custom_vehicle_type", "custom_car_brand",
	"custom_car_model_name", "custom_bike_brand", "custom_bike_model_name",
	"creation", "modified", "owner",
}

// SyncLeads backfills/updates ERP Leads into customers. limit<=0 means all.
func (s *Syncer) SyncLeads(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Lead"}
	cursor, err := s.GetCursor(ctx, "Lead")
	if err != nil {
		return res, fmt.Errorf("lead cursor: %w", err)
	}

	start := 0
	for {
		page := pageSize
		if limit > 0 && limit-res.Fetched < page {
			page = limit - res.Fetched
		}
		if page <= 0 {
			break
		}
		docs, err := s.client.List(ctx, "Lead", leadFields, "", cursor, start, page)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}

		rows := make([]customerRow, 0, len(docs))
		var maxMod string
		for _, d := range docs {
			res.Fetched++
			if m := d.Str("modified"); m > maxMod {
				maxMod = m
			}
			rows = append(rows, s.mapLead(d))
		}

		n, err := s.upsertCustomers(ctx, rows,
			"(erp_source, erp_lead_id) WHERE erp_lead_id IS NOT NULL")
		if err != nil {
			return res, fmt.Errorf("lead page upsert at start=%d: %w", start, err)
		}
		res.Upserted += n
		if maxMod != "" {
			if err := s.SetCursor(ctx, "Lead", maxMod); err != nil {
				log.Printf("erp[%s] set lead cursor: %v", s.source, err)
			}
			res.LastModified = maxMod
		}
		log.Printf("erp[%s] leads: page start=%d fetched=%d upserted=%d", s.source, start, len(docs), n)

		start += len(docs)
		if len(docs) < page {
			break
		}
		if limit > 0 && res.Fetched >= limit {
			break
		}
	}
	return res, nil
}

func (s *Syncer) mapLead(d erp.Doc) customerRow {
	pin := d.Str("custom_pincode")

	// assignment_status must stay within Pulse's two-value vocabulary.
	assign := d.Str("custom_lead_status")
	if assign != "Assigned" && assign != "Not Assigned" {
		assign = "Not Assigned"
	}

	vt := d.Str("custom_vehicle_type")
	vb := firstNonEmpty(d.Str("custom_car_brand"), d.Str("custom_bike_brand"))
	vm := firstNonEmpty(d.Str("custom_car_model_name"), d.Str("custom_bike_model_name"))

	return customerRow{
		Name:  firstNonEmpty(d.Str("lead_name"), d.Str("first_name"), "Unknown"),
		Phone: strPtr(firstNonEmpty(d.Str("mobile_no"), d.Str("phone"), d.Str("whatsapp_no"))),
		Email: strPtr(d.Str("email_id")),
		City:  strPtr(d.Str("city")),
		// state: ERP value, else derived from the pincode prefix.
		State:            strPtr(firstNonEmpty(d.Str("state"), pincode.StateForPincode(pin))),
		Territory:        strPtr(d.Str("territory")),
		Status:           d.Str("status"), // RAW ERP Lead status, verbatim (see package doc)
		Brand:            strPtr(d.Str("custom_brand")),
		LeadSource:       strPtr(d.Str("source")),
		LeadType:         strPtr(d.Str("type")), // RAW ERP type: "End User"/"Client"/"Channel Partner"/""
		Remarks:          strPtr(d.Str("custom_remarks")),
		Vehicle:          strPtr(vehicleString(vt, vb, vm)),
		VehicleBrand:     strPtr(vb),
		VehicleModel:     strPtr(vm),
		LeadScore:        f64Ptr(d.F64("custom_score")),
		AssignmentStatus: assign,
		CustomerGroup:    strPtr(d.Str("custom_customer_group")),
		Pincode:          strPtr(pin),
		CreatedBy:        strPtr(d.Str("owner")),
		ERPLeadID:        strPtr(d.Str("name")),
		ERPModified:      strPtr(d.Str("modified")),
		ERPCreated:       strPtr(d.Str("creation")),
		ExternalID:       strPtr(d.Str("name")),
		ExternalSource:   strPtr("ERPNext-Lead:" + s.source),
	}
}

// --- pass 2: Opportunities ---------------------------------------------------

var oppFields = []string{
	"name", "customer_name", "title", "status", "opportunity_type", "source",
	"custom_brand", "contact_email", "contact_mobile", "phone", "city", "state",
	"territory", "custom_assigned_partner_customer_name", "custom_assign_partner_mobile",
	"custom_assign_partner_email", "custom_vehicle_type", "custom_car_brand",
	"custom_car_modelname", "custom_bike_brand", "custom_bike_modelname",
	"custom_additional_requirement", "order_lost_reason", "creation", "modified", "owner",
	// the Lead join (docs/ERP-PIPELINE-MAP.md): party_name = the Lead docname
	// when opportunity_from='Lead' (all 9.3k); custom_lead_id is sparse backup.
	"opportunity_from", "party_name", "custom_lead_id",
}

// SyncOpportunities backfills/updates ERP Opportunities into customers.
// limit<=0 means all.
func (s *Syncer) SyncOpportunities(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Opportunity"}
	cursor, err := s.GetCursor(ctx, "Opportunity")
	if err != nil {
		return res, fmt.Errorf("opportunity cursor: %w", err)
	}

	start := 0
	for {
		page := pageSize
		if limit > 0 && limit-res.Fetched < page {
			page = limit - res.Fetched
		}
		if page <= 0 {
			break
		}
		docs, err := s.client.List(ctx, "Opportunity", oppFields, "", cursor, start, page)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}

		// Lead-only model (docs/ERP-PIPELINE-MAP.md): the Lead carries the whole
		// funnel via Lead.status, so opportunities are NOT merged into customers.
		// They go into the erp_opportunities mirror for downstream linkage only.
		var maxMod string
		n := 0
		for _, d := range docs {
			res.Fetched++
			if m := d.Str("modified"); m > maxMod {
				maxMod = m
			}
			ct, err := s.pool.Exec(ctx, `
INSERT INTO erp_opportunities (erp_name, party_name, opportunity_from, status, opportunity_type, brand, erp_source, erp_modified)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (erp_source, erp_name) DO UPDATE SET
  party_name=EXCLUDED.party_name, opportunity_from=EXCLUDED.opportunity_from, status=EXCLUDED.status,
  opportunity_type=EXCLUDED.opportunity_type, brand=EXCLUDED.brand, erp_modified=EXCLUDED.erp_modified`,
				d.Str("name"), d.Str("party_name"), d.Str("opportunity_from"), d.Str("status"),
				d.Str("opportunity_type"), d.Str("custom_brand"), s.source, d.Str("modified"))
			if err != nil {
				log.Printf("erp[%s] opportunity %s upsert: %v", s.source, d.Str("name"), err)
				continue
			}
			n += int(ct.RowsAffected())
		}
		res.Upserted += n
		if maxMod != "" {
			if err := s.SetCursor(ctx, "Opportunity", maxMod); err != nil {
				log.Printf("erp[%s] set opportunity cursor: %v", s.source, err)
			}
			res.LastModified = maxMod
		}
		log.Printf("erp[%s] opportunities: page start=%d fetched=%d upserted=%d", s.source, start, len(docs), n)

		start += len(docs)
		if len(docs) < page {
			break
		}
		if limit > 0 && res.Fetched >= limit {
			break
		}
	}
	return res, nil
}

func (s *Syncer) mapOpportunity(ctx context.Context, d erp.Doc) customerRow {
	status := d.Str("status") // RAW ERP Opportunity status, verbatim (see package doc)

	vt := d.Str("custom_vehicle_type")
	vb := firstNonEmpty(d.Str("custom_car_brand"), d.Str("custom_bike_brand"))
	// Note: Opportunity spells the model fields custom_car_modelname /
	// custom_bike_modelname (no underscore), unlike Lead.
	vm := firstNonEmpty(d.Str("custom_car_modelname"), d.Str("custom_bike_modelname"))

	row := customerRow{
		Name:             firstNonEmpty(d.Str("customer_name"), d.Str("title"), "Unknown"),
		Phone:            strPtr(firstNonEmpty(d.Str("phone"), d.Str("contact_mobile"))),
		Email:            strPtr(d.Str("contact_email")),
		City:             strPtr(d.Str("city")),
		State:            strPtr(d.Str("state")), // no pincode fallback on Opportunity
		Territory:        strPtr(d.Str("territory")),
		Status:           status,
		Brand:            strPtr(d.Str("custom_brand")),
		LeadSource:       strPtr(d.Str("source")),
		LeadType:         strPtr(d.Str("opportunity_type")), // RAW ERP opportunity_type, verbatim
		Remarks:          strPtr(d.Str("custom_additional_requirement")),
		Vehicle:          strPtr(vehicleString(vt, vb, vm)),
		VehicleBrand:     strPtr(vb),
		VehicleModel:     strPtr(vm),
		LossReason:       strPtr(d.Str("order_lost_reason")),
		AssignmentStatus: "Not Assigned",
		IsFrozen:         status == "Converted" || status == "Lost",
		CreatedBy:        strPtr(d.Str("owner")),
		ERPOpportunityID: strPtr(d.Str("name")),
		ERPModified:      strPtr(d.Str("modified")),
		ERPCreated:       strPtr(d.Str("creation")),
		ExternalID:       strPtr(d.Str("name")),
		ExternalSource:   strPtr("ERPNext:" + s.source),
	}

	// DEDUP (docs/ERP-PIPELINE-MAP.md §1): an Opportunity that came from a Lead
	// IS that lead — carry the Lead docname so the upsert merges onto the
	// existing Lead row instead of creating a second one.
	if d.Str("opportunity_from") == "Lead" {
		if leadID := firstNonEmpty(d.Str("party_name"), d.Str("custom_lead_id")); leadID != "" {
			row.ERPLeadID = strPtr(leadID)
		}
	}

	partnerName := d.Str("custom_assigned_partner_customer_name")
	partnerMobile := d.Str("custom_assign_partner_mobile")
	partnerEmail := d.Str("custom_assign_partner_email")
	if partnerName != "" || partnerMobile != "" || partnerEmail != "" {
		row.AssignmentStatus = "Assigned"
		// ERP often carries only the partner's mobile/email (name field blank);
		// resolve the display name from the synced Sales Partner mirror so the
		// admin always sees WHO the lead is assigned to.
		if partnerName == "" {
			partnerName = s.resolvePartnerName(ctx, partnerMobile, partnerEmail)
		}
		row.AssignedTo = strPtr(partnerName)
		userID, role, err := s.resolveByPhoneEmail(ctx, partnerMobile, partnerEmail)
		if err != nil {
			log.Printf("erp[%s] opp %s resolve partner (%s/%s): %v",
				s.source, d.Str("name"), partnerMobile, partnerEmail, err)
		} else if userID != "" {
			switch role {
			case "distributor":
				row.DistributorID = &userID
			case "detailer", "installer":
				row.DetailerID = &userID
			}
		}
	}
	return row
}

// resolveByPhoneEmail matches a Pulse user by phone last-10-digits or
// case-insensitive email. Returns ("", "", nil) when nothing matches.
func (s *Syncer) resolveByPhoneEmail(ctx context.Context, mobile, email string) (userID, role string, err error) {
	digits := onlyDigits(mobile)
	email = strings.TrimSpace(email)
	if digits == "" && email == "" {
		return "", "", nil
	}
	err = s.pool.QueryRow(ctx, `
		SELECT u.id::text, r.code
		FROM users u
		JOIN roles r ON r.id = u.role_id
		WHERE ($1 <> '' AND right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10) = right($1, 10))
		   OR ($2 <> '' AND lower(coalesce(u.email, '')) = lower($2))
		LIMIT 1`,
		digits, email).Scan(&userID, &role)
	if err == pgx.ErrNoRows {
		return "", "", nil
	}
	if err != nil {
		return "", "", err
	}
	return userID, role, nil
}

// resolvePartnerName looks up a Sales Partner's display name by mobile
// (last-10) or email in the local mirror. Empty string when no match.
func (s *Syncer) resolvePartnerName(ctx context.Context, mobile, email string) string {
	digits := onlyDigits(mobile)
	email = strings.TrimSpace(email)
	if digits == "" && email == "" {
		return ""
	}
	var name string
	err := s.pool.QueryRow(ctx, `
		SELECT sp.name FROM sales_partners sp
		WHERE ($1 <> '' AND right(regexp_replace(coalesce(sp.mobile, ''), '\D', '', 'g'), 10) = right($1, 10))
		   OR ($2 <> '' AND lower(coalesce(sp.email, '')) = lower($2))
		LIMIT 1`, digits, email).Scan(&name)
	if err != nil {
		return ""
	}
	return name
}

// --- pass 2b: Sales Partner Assigned Lead (the Lead->partner bridge) ---------

// SyncAssignedLeads walks the ERP "Sales Partner Assigned Lead" doctype — the
// bridge that records WHICH partner an ERP Lead was assigned to — and stamps
// assigned_to (+ partner user ids when resolvable) onto the matching customers
// rows. Small doctype (~400 rows): full walk each run, no cursor.
func (s *Syncer) SyncAssignedLeads(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Sales Partner Assigned Lead"}
	fields := []string{"name", "document_id", "sales_partner", "sales_partner_mobile_number", "lead_status", "modified"}
	start := 0
	for {
		docs, err := s.client.List(ctx, "Sales Partner Assigned Lead", fields, "", "", start, pageSize)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}
		for _, d := range docs {
			leadID := d.Str("document_id")
			partner := d.Str("sales_partner")
			if leadID == "" || partner == "" {
				continue
			}
			res.Fetched++
			mobile := d.Str("sales_partner_mobile_number")
			userID, role, _ := s.resolveByPhoneEmail(ctx, mobile, "")
			var det, dis *string
			switch role {
			case "distributor":
				dis = &userID
			case "detailer", "installer":
				det = &userID
			}
			ct, err := s.pool.Exec(ctx, `
UPDATE customers SET assigned_to = $2, assignment_status = 'Assigned',
  detailer_id = COALESCE(detailer_id, $3::uuid),
  distributor_id = COALESCE(distributor_id, $4::uuid)
WHERE erp_source = $5 AND erp_lead_id = $1`,
				leadID, partner, det, dis, s.source)
			if err != nil {
				log.Printf("erp[%s] assigned-lead %s update: %v", s.source, leadID, err)
				continue
			}
			res.Upserted += int(ct.RowsAffected())
		}
		start += len(docs)
		if len(docs) < pageSize || (limit > 0 && start >= limit) {
			break
		}
	}
	return res, nil
}

// LinkPartnerLeads back-fills customers.detailer_id / distributor_id from
// sales_partners.user_id for every lead whose assigned_to names a partner
// with a linked Pulse login. Run after any pass (and after creating partner
// users) so "different users actually receive their leads."
func (s *Syncer) LinkPartnerLeads(ctx context.Context) (int64, error) {
	ct, err := s.pool.Exec(ctx, `
UPDATE customers c SET
  detailer_id    = CASE WHEN r.code IN ('detailer','installer') THEN sp.user_id ELSE c.detailer_id END,
  distributor_id = CASE WHEN r.code = 'distributor'             THEN sp.user_id ELSE c.distributor_id END
FROM sales_partners sp
JOIN users u ON u.id = sp.user_id
JOIN roles r ON r.id = u.role_id
WHERE sp.user_id IS NOT NULL
  AND c.assigned_to = sp.name
  AND (c.detailer_id IS DISTINCT FROM sp.user_id AND c.distributor_id IS DISTINCT FROM sp.user_id)`)
	if err != nil {
		return 0, err
	}
	return ct.RowsAffected(), nil
}

// --- pass 3: Sales Partners --------------------------------------------------

// SyncSalesPartners mirrors the ERP Sales Partner doctype (plus its pincode/
// brand/lead-type child tables) into sales_partners. The doctype is small
// (~105 docs) so it lists all names then GetDocs each one — no cursor; every
// run is a full refresh. Child rows are replace-all per partner. limit<=0
// means all.
func (s *Syncer) SyncSalesPartners(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Sales Partner"}

	// 1) Collect all docnames.
	var names []string
	start := 0
	for {
		docs, err := s.client.List(ctx, "Sales Partner", []string{"name"}, "", "", start, pageSize)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}
		for _, d := range docs {
			if n := d.Str("name"); n != "" {
				names = append(names, n)
			}
		}
		start += len(docs)
		if len(docs) < pageSize {
			break
		}
	}
	if limit > 0 && len(names) > limit {
		names = names[:limit]
	}

	// 2) GetDoc each (full doc includes the child tables) and upsert.
	for _, name := range names {
		doc, err := s.client.GetDoc(ctx, "Sales Partner", name)
		if err != nil {
			log.Printf("erp[%s] sales partner %s fetch: %v", s.source, name, err)
			continue
		}
		res.Fetched++
		if m := doc.Str("modified"); m > res.LastModified {
			res.LastModified = m
		}
		if err := s.upsertSalesPartner(ctx, doc); err != nil {
			log.Printf("erp[%s] sales partner %s upsert: %v", s.source, name, err)
			continue
		}
		res.Upserted++
	}
	log.Printf("erp[%s] sales partners: fetched=%d upserted=%d", s.source, res.Fetched, res.Upserted)
	return res, nil
}

func (s *Syncer) upsertSalesPartner(ctx context.Context, doc erp.Doc) error {
	name := doc.Str("name")
	if name == "" {
		return fmt.Errorf("sales partner without name")
	}

	// Resolve the Pulse login for this partner (phone last-10 or email).
	var userID *string
	if id, _, err := s.resolveByPhoneEmail(ctx, doc.Str("custom_mobile_no"), doc.Str("custom_email")); err != nil {
		log.Printf("erp[%s] sales partner %s resolve user: %v", s.source, name, err)
	} else if id != "" {
		userID = &id
	}

	var rate *float64
	if r := doc.F64("commission_rate"); r != 0 {
		rate = &r
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var partnerID string
	err = tx.QueryRow(ctx, `
		INSERT INTO sales_partners
			(name, partner_type, lat_long, email, mobile, commission_rate, territory, erp_source, erp_modified, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (erp_source, name) DO UPDATE SET
			partner_type    = EXCLUDED.partner_type,
			lat_long        = EXCLUDED.lat_long,
			email           = EXCLUDED.email,
			mobile          = EXCLUDED.mobile,
			commission_rate = EXCLUDED.commission_rate,
			territory       = EXCLUDED.territory,
			erp_modified    = EXCLUDED.erp_modified,
			user_id         = COALESCE(EXCLUDED.user_id, sales_partners.user_id)
		RETURNING id::text`,
		name,
		strPtr(doc.Str("partner_type")),
		strPtr(doc.Str("custom_lat_long")),
		strPtr(doc.Str("custom_email")),
		strPtr(doc.Str("custom_mobile_no")),
		rate,
		strPtr(doc.Str("territory")),
		s.source,
		strPtr(doc.Str("modified")),
		userID,
	).Scan(&partnerID)
	if err != nil {
		return err
	}

	// Replace-all child rows. ERP child rows: custom_pincode[].pincodes (int),
	// custom_brand[].brand, custom_lead_type[].lead_type.
	type childSpec struct {
		table, column, docKey, rowField string
	}
	for _, cs := range []childSpec{
		{"sales_partner_pincodes", "pincode", "custom_pincode", "pincodes"},
		{"sales_partner_brands", "brand", "custom_brand", "brand"},
		{"sales_partner_lead_types", "lead_type", "custom_lead_type", "lead_type"},
	} {
		if _, err := tx.Exec(ctx,
			fmt.Sprintf(`DELETE FROM %s WHERE partner_id = $1`, cs.table), partnerID); err != nil {
			return err
		}
		seen := map[string]bool{}
		for _, row := range doc.Rows(cs.docKey) {
			v := row.Str(cs.rowField) // coerces the int pincode to text
			if v == "" || seen[v] {
				continue
			}
			seen[v] = true
			if _, err := tx.Exec(ctx,
				fmt.Sprintf(`INSERT INTO %s (partner_id, %s) VALUES ($1, $2)`, cs.table, cs.column),
				partnerID, v); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

// --- helpers -----------------------------------------------------------------

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if t := strings.TrimSpace(v); t != "" {
			return t
		}
	}
	return ""
}

func strPtr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func f64Ptr(f float64) *float64 {
	if f == 0 {
		return nil
	}
	return &f
}

var nonDigits = regexp.MustCompile(`\D`)

func onlyDigits(s string) string {
	return nonDigits.ReplaceAllString(s, "")
}

// vehicleString joins vehicle_type + "brand model" with " | ", skipping blanks.
func vehicleString(vtype, brand, model string) string {
	var parts []string
	if v := strings.TrimSpace(vtype); v != "" {
		parts = append(parts, v)
	}
	if bm := strings.TrimSpace(strings.TrimSpace(brand) + " " + strings.TrimSpace(model)); bm != "" {
		parts = append(parts, bm)
	}
	return strings.Join(parts, " | ")
}
