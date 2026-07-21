package syncer

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/p91/pulse/internal/auth"
)

// --- pass 4: ERP Customers + login provisioning (dashboard goal 1.1) ---------
//
// "Total users" = everyone who should hold a Pulse login: ERP Customers
// excluding the B2C groups (End User, P91 Car Care) that have a mobile or
// email, PLUS every Sales Partner. Each is provisioned a Pulse login
// (username = mobile, random initial password) if no user matches their
// phone/email yet. The generated password is kept in users.metadata
// (initialPassword) so the admin UI can hand it to the person — rotate on
// first login later.

// roleForCustomerGroup implements the spec's group→actor mapping:
// CAD = distributor · Installers = installer · everything else = detailer.
func roleForCustomerGroup(group string) string {
	switch group {
	case "CAD", "Distributors":
		return "distributor"
	case "Installers":
		return "installer"
	default:
		return "detailer"
	}
}

// SyncCustomers mirrors the ERP Customer doctype into erp_customers
// (B2C groups skipped). Small doctype (~1.8k) — full walk, no cursor.
func (s *Syncer) SyncCustomers(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Customer"}
	fields := []string{"name", "customer_name", "customer_group", "territory", "mobile_no", "email_id", "disabled", "modified",
		"lead_name", "opportunity_name"} // conversion back-links (funnel: lead → customer)
	start := 0
	for {
		docs, err := s.client.List(ctx, "Customer", fields, "", "", start, pageSize)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}
		for _, d := range docs {
			group := d.Str("customer_group")
			// B2C customers are mirrored too (needed for the lead→customer
			// funnel) — they are excluded from LOGIN PROVISIONING, not storage.
			res.Fetched++
			_, err := s.pool.Exec(ctx, `
INSERT INTO erp_customers (erp_name, customer_name, customer_group, territory, mobile, email, disabled, erp_source, erp_modified, lead_name, opportunity_name)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULLIF($10,''),NULLIF($11,''))
ON CONFLICT (erp_source, erp_name) DO UPDATE SET
  customer_name=EXCLUDED.customer_name, customer_group=EXCLUDED.customer_group,
  territory=EXCLUDED.territory, mobile=EXCLUDED.mobile, email=EXCLUDED.email,
  disabled=EXCLUDED.disabled, erp_modified=EXCLUDED.erp_modified,
  lead_name=COALESCE(EXCLUDED.lead_name, erp_customers.lead_name),
  opportunity_name=COALESCE(EXCLUDED.opportunity_name, erp_customers.opportunity_name)`,
				d.Str("name"), d.Str("customer_name"), group, d.Str("territory"),
				d.Str("mobile_no"), d.Str("email_id"), d.F64("disabled") == 1, s.source, d.Str("modified"),
				d.Str("lead_name"), d.Str("opportunity_name"))
			if err != nil {
				log.Printf("erp[%s] customer %s upsert: %v", s.source, d.Str("name"), err)
				continue
			}
			res.Upserted++
		}
		start += len(docs)
		if len(docs) < pageSize || (limit > 0 && start >= limit) {
			break
		}
	}
	return res, nil
}

// randomPassword returns a 10-char alphanumeric initial password.
func randomPassword() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
	b := make([]byte, 10)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		b[i] = chars[n.Int64()]
	}
	return string(b)
}

// provisionOne creates a Pulse user for the given identity unless a user
// already matches by phone/email. Returns the user id ("" = skipped).
func (s *Syncer) provisionOne(ctx context.Context, name, mobile, email, roleCode, source, erpRef string) (string, error) {
	digits := onlyDigits(mobile)
	if len(digits) < 10 && strings.TrimSpace(email) == "" {
		return "", nil // no usable contact — cannot be a Pulse user (goal 1.1 rule)
	}
	if existing, _, err := s.resolveByPhoneEmail(ctx, mobile, email); err != nil {
		return "", err
	} else if existing != "" {
		return existing, nil // already has a login
	}
	if len(digits) < 10 {
		return "", nil // phone is mandatory in Pulse (golden rule); email-only rows wait
	}
	phone := digits[len(digits)-10:]

	pw := randomPassword()
	hash, err := auth.HashPassword(pw)
	if err != nil {
		return "", err
	}
	meta, _ := json.Marshal(map[string]any{
		"provisioned":     true,
		"provisionSource": source, // "erp-customer" | "erp-sales-partner"
		"erpRef":          erpRef,
		"initialPassword": pw, // surfaced in the admin UI; rotate on first login
	})
	var id string
	err = s.pool.QueryRow(ctx, `
INSERT INTO users (role_id, name, email, phone, username, password_hash, status, is_active, metadata)
SELECT r.id, $2, NULLIF(lower($3),''), $4, $4, $5, 'approved', true, $6::jsonb
FROM roles r WHERE r.code = $1
ON CONFLICT DO NOTHING
RETURNING id::text`,
		roleCode, name, strings.TrimSpace(email), phone, hash, meta).Scan(&id)
	if err != nil {
		// unique-violation (phone/email/username already used) → treat as skip
		return "", nil
	}
	return id, nil
}

// ProvisionUsers creates Pulse logins for every eligible ERP customer and
// Sales Partner, links the source rows, and reports how many were created.
func (s *Syncer) ProvisionUsers(ctx context.Context) (created int, err error) {
	// 1) Sales Partners (active lead receivers — always included).
	rows, err := s.pool.Query(ctx, `
SELECT id::text, name, COALESCE(partner_type,''), COALESCE(mobile,''), COALESCE(email,'')
FROM sales_partners WHERE user_id IS NULL`)
	if err != nil {
		return 0, err
	}
	type sp struct{ id, name, ptype, mobile, email string }
	var partners []sp
	for rows.Next() {
		var p sp
		if rows.Scan(&p.id, &p.name, &p.ptype, &p.mobile, &p.email) == nil {
			partners = append(partners, p)
		}
	}
	rows.Close()
	for _, p := range partners {
		role := "detailer"
		if p.ptype == "Distributor" {
			role = "distributor"
		}
		uid, perr := s.provisionOne(ctx, p.name, p.mobile, p.email, role, "erp-sales-partner", p.name)
		if perr != nil {
			log.Printf("provision partner %s: %v", p.name, perr)
			continue
		}
		if uid != "" {
			if _, err := s.pool.Exec(ctx, `UPDATE sales_partners SET user_id=$2::uuid WHERE id=$1::uuid AND user_id IS NULL`, p.id, uid); err == nil {
				created++
			}
		}
	}

	// 2) ERP Customers (platform users by customer_group).
	rows, err = s.pool.Query(ctx, `
SELECT id::text, erp_name, customer_name, COALESCE(customer_group,''), COALESCE(mobile,''), COALESCE(email,'')
FROM erp_customers
WHERE user_id IS NULL AND NOT disabled
  AND COALESCE(customer_group,'') NOT IN ('End User','P91 Car Care','Individual')`)
	if err != nil {
		return created, err
	}
	type ec struct{ id, erpName, name, group, mobile, email string }
	var custs []ec
	for rows.Next() {
		var c ec
		if rows.Scan(&c.id, &c.erpName, &c.name, &c.group, &c.mobile, &c.email) == nil {
			custs = append(custs, c)
		}
	}
	rows.Close()
	for _, c := range custs {
		display := c.name
		if display == "" {
			display = c.erpName
		}
		uid, perr := s.provisionOne(ctx, display, c.mobile, c.email, roleForCustomerGroup(c.group), "erp-customer", c.erpName)
		if perr != nil {
			log.Printf("provision customer %s: %v", c.erpName, perr)
			continue
		}
		if uid != "" {
			if _, err := s.pool.Exec(ctx, `UPDATE erp_customers SET user_id=$2::uuid WHERE id=$1::uuid AND user_id IS NULL`, c.id, uid); err == nil {
				created++
			}
		}
	}
	return created, nil
}

// SyncSalesOrders mirrors a light projection of ERP Sales Orders (name,
// customer, amount) for funnel counts. Full walk (~2.1k docs), no cursor.
func (s *Syncer) SyncSalesOrders(ctx context.Context, limit int) (Result, error) {
	res := Result{Doctype: "Sales Order"}
	fields := []string{"name", "customer", "grand_total", "status", "transaction_date", "modified"}
	start := 0
	for {
		docs, err := s.client.List(ctx, "Sales Order", fields, "", "", start, pageSize)
		if err != nil {
			return res, err
		}
		if len(docs) == 0 {
			break
		}
		for _, d := range docs {
			res.Fetched++
			total := d.F64("grand_total")
			_, err := s.pool.Exec(ctx, `
INSERT INTO erp_sales_orders (erp_name, customer, grand_total, status, transaction_date, erp_source, erp_modified)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (erp_source, erp_name) DO UPDATE SET
  customer=EXCLUDED.customer, grand_total=EXCLUDED.grand_total, status=EXCLUDED.status,
  transaction_date=EXCLUDED.transaction_date, erp_modified=EXCLUDED.erp_modified`,
				d.Str("name"), d.Str("customer"), total, d.Str("status"), d.Str("transaction_date"), s.source, d.Str("modified"))
			if err != nil {
				log.Printf("erp[%s] sales order %s upsert: %v", s.source, d.Str("name"), err)
				continue
			}
			res.Upserted++
		}
		start += len(docs)
		if len(docs) < pageSize || (limit > 0 && start >= limit) {
			break
		}
	}
	return res, nil
}

var _ = fmt.Sprintf // import stabilizer during iteration
