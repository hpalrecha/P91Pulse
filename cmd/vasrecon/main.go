// Command vasrecon reconciles VAS (SetuPPF) partners against Pulse.
//
// It reads every VAS partner of type STUDIO (detailer) or INSTALLER, then for
// each one checks whether Pulse already knows it — both as a login (users table)
// and as an ERP mirror row (sales_partners). Real, unmatched partners can be
// provisioned as Pulse logins (-provision); by default it is a dry run and
// writes nothing. It ALWAYS emits a JSON payload of the Sales Partners that need
// creating in ERP (for owner review — it never touches ERP itself).
//
// Usage:
//
//	go run ./cmd/vasrecon                 # dry run: report only
//	go run ./cmd/vasrecon -provision      # also create missing Pulse logins
//	go run ./cmd/vasrecon -out payload.json
//
// Config (env, with .env auto-load):
//
//	DATABASE_URL  — Pulse Postgres (P91pulse/.env)
//	VAS_DB        — VAS Postgres   (falls back to SetuPPFPortal/.env DATABASE_URL)
package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/db"
)

// vasPartner is one row from VAS partners.
type vasPartner struct {
	ID          string
	DisplayName string
	Phone       string
	Email       string
	Type        string // STUDIO | INSTALLER
	JobCards    int64
}

// erpSalesPartner is an entry in the ERP-creation payload (owner review).
type erpSalesPartner struct {
	Name        string `json:"name"`
	PartnerType string `json:"partner_type"` // Detailer | Installer
	Mobile      string `json:"mobile"`
	Email       string `json:"email"`
	VASPartner  string `json:"vas_partner_id"`
}

// testNeedles flag rows that are obviously test/dummy data (not real partners).
var testNeedles = []string{
	"test", "dummy", "admin user", "dgr", "tusharinstaller", "tushar partern",
	"my new distributor", "praveen chand",
}

func main() {
	provision := flag.Bool("provision", false, "create missing Pulse logins (default: dry run, no writes)")
	out := flag.String("out", "vasrecon-erp-payload.json", "path to write the ERP Sales Partner payload JSON")
	flag.Parse()

	// Best-effort: load the Pulse .env from the working dir.
	_ = godotenv.Load()

	pulseURL := os.Getenv("DATABASE_URL")
	if pulseURL == "" {
		log.Fatal("DATABASE_URL (Pulse) is required")
	}
	vasURL := resolveVASURL()
	if vasURL == "" {
		log.Fatal("VAS_DB is required (set VAS_DB or provide SetuPPFPortal/.env with DATABASE_URL)")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pulse, err := db.NewPool(ctx, pulseURL)
	if err != nil {
		log.Fatalf("pulse db: %v", err)
	}
	defer pulse.Close()

	vas, err := db.NewPool(ctx, vasURL)
	if err != nil {
		log.Fatalf("vas db: %v", err)
	}
	defer vas.Close()

	partners, err := readVASPartners(ctx, vas)
	if err != nil {
		log.Fatalf("read vas partners: %v", err)
	}
	log.Printf("read %d VAS partners (STUDIO+INSTALLER)", len(partners))

	var (
		fullyBridged     int // already has a Pulse login
		provisioned      int // provisioned now (or would be, in dry run)
		skippedTest      int
		skippedJustSigns int
		erpPayload       = []erpSalesPartner{}
	)

	for _, p := range partners {
		phone10 := last10(p.Phone)
		emailLC := strings.ToLower(strings.TrimSpace(p.Email))

		if strings.Contains(emailLC, "justsigns") {
			skippedJustSigns++
			log.Printf("SKIP justsigns: %q <%s>", p.DisplayName, p.Email)
			continue
		}
		if isTestRow(p.DisplayName, emailLC, phone10) {
			skippedTest++
			log.Printf("SKIP test/dummy: %q <%s> %s", p.DisplayName, p.Email, p.Phone)
			continue
		}

		hasUser, err := pulseHasUser(ctx, pulse, phone10, emailLC)
		if err != nil {
			log.Printf("WARN: users lookup for %q: %v", p.DisplayName, err)
			continue
		}
		inMirror, err := pulseHasSalesPartner(ctx, pulse, phone10, emailLC)
		if err != nil {
			log.Printf("WARN: sales_partners lookup for %q: %v", p.DisplayName, err)
			continue
		}

		partnerType := "Detailer"
		roleCode := "detailer"
		if strings.EqualFold(p.Type, "INSTALLER") {
			partnerType = "Installer"
			roleCode = "installer"
		}

		// ERP mirror missing → owner needs to create this Sales Partner in ERP.
		if !inMirror {
			erpPayload = append(erpPayload, erpSalesPartner{
				Name:        p.DisplayName,
				PartnerType: partnerType,
				Mobile:      phone10,
				Email:       p.Email,
				VASPartner:  p.ID,
			})
		}

		if hasUser {
			fullyBridged++
			continue
		}

		// Real partner with no Pulse login → provision (or report).
		provisioned++
		if *provision {
			id, perr := provisionPulseUser(ctx, pulse, p, roleCode, phone10)
			if perr != nil {
				log.Printf("ERROR provision %q: %v", p.DisplayName, perr)
				provisioned--
				continue
			}
			log.Printf("PROVISIONED %s login %s (%q, jobCards=%d)", roleCode, id, p.DisplayName, p.JobCards)
		} else {
			log.Printf("WOULD PROVISION %s login for %q <%s> %s (vasPartner=%s, jobCards=%d)",
				roleCode, p.DisplayName, p.Email, phone10, p.ID, p.JobCards)
		}
	}

	if werr := writePayload(*out, erpPayload); werr != nil {
		log.Printf("WARN: could not write %s: %v", *out, werr)
	}

	mode := "DRY RUN (no DB writes)"
	if *provision {
		mode = "PROVISION"
	}
	fmt.Println("──────────────────────────────────────────────")
	fmt.Printf("vasrecon summary (%s)\n", mode)
	fmt.Printf("  VAS partners scanned : %d\n", len(partners))
	fmt.Printf("  fully bridged (login): %d\n", fullyBridged)
	if *provision {
		fmt.Printf("  provisioned          : %d\n", provisioned)
	} else {
		fmt.Printf("  would provision      : %d\n", provisioned)
	}
	fmt.Printf("  skipped (test/dummy) : %d\n", skippedTest)
	fmt.Printf("  skipped (justsigns)  : %d\n", skippedJustSigns)
	fmt.Printf("  ERP sales-partners to create: %d  → %s\n", len(erpPayload), *out)
	fmt.Println("──────────────────────────────────────────────")
}

// resolveVASURL returns the VAS DB URL from VAS_DB, else from a SetuPPFPortal
// .env file's DATABASE_URL (searched at a few likely relative locations).
func resolveVASURL() string {
	if v := strings.TrimSpace(os.Getenv("VAS_DB")); v != "" {
		return v
	}
	candidates := []string{
		"../SetuPPFPortal/.env",
		"../../SetuPPFPortal/.env",
		"D:/p91/p91/p91web/SetuPPFPortal/.env",
	}
	for _, path := range candidates {
		if m, err := godotenv.Read(path); err == nil {
			if u := strings.TrimSpace(m["DATABASE_URL"]); u != "" {
				log.Printf("VAS DB URL loaded from %s", path)
				return u
			}
		}
	}
	return ""
}

// readVASPartners loads STUDIO/INSTALLER partners plus their job-card counts.
// type is a Postgres enum, so it is cast to text (COALESCE on the enum errors).
func readVASPartners(ctx context.Context, pool *pgxpool.Pool) ([]vasPartner, error) {
	rows, err := pool.Query(ctx, `
SELECT p.id::text,
       p.display_name,
       COALESCE(p.phone, ''),
       COALESCE(p.email, ''),
       p.type::text,
       (SELECT count(*) FROM job_cards jc WHERE jc.partner_id = p.id)
FROM partners p
WHERE p.type::text IN ('STUDIO','INSTALLER')
ORDER BY p.display_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []vasPartner
	for rows.Next() {
		var p vasPartner
		if err := rows.Scan(&p.ID, &p.DisplayName, &p.Phone, &p.Email, &p.Type, &p.JobCards); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// pulseHasUser reports whether a Pulse users row matches by phone (last 10) or email.
func pulseHasUser(ctx context.Context, pool *pgxpool.Pool, phone10, emailLC string) (bool, error) {
	var id string
	err := pool.QueryRow(ctx, `
SELECT id::text FROM users
WHERE ($1 <> '' AND right(regexp_replace(phone, '\D', '', 'g'), 10) = $1)
   OR ($2 <> '' AND lower(email) = $2)
LIMIT 1`, phone10, emailLC).Scan(&id)
	if err == nil {
		return true, nil
	}
	if err == pgx.ErrNoRows {
		return false, nil
	}
	return false, err
}

// pulseHasSalesPartner reports whether a Pulse sales_partners (ERP mirror) row
// matches by mobile (last 10) or email.
func pulseHasSalesPartner(ctx context.Context, pool *pgxpool.Pool, phone10, emailLC string) (bool, error) {
	var id string
	err := pool.QueryRow(ctx, `
SELECT id::text FROM sales_partners
WHERE ($1 <> '' AND right(regexp_replace(mobile, '\D', '', 'g'), 10) = $1)
   OR ($2 <> '' AND lower(email) = $2)
LIMIT 1`, phone10, emailLC).Scan(&id)
	if err == nil {
		return true, nil
	}
	if err == pgx.ErrNoRows {
		return false, nil
	}
	return false, err
}

// provisionPulseUser inserts a Pulse login for a VAS partner (detailer/installer)
// with a random unusable password. Returns the new user id.
func provisionPulseUser(ctx context.Context, pool *pgxpool.Pool, p vasPartner, roleCode, phone10 string) (string, error) {
	var roleID string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM roles WHERE code=$1`, roleCode).Scan(&roleID); err != nil {
		return "", fmt.Errorf("role %q not found: %w", roleCode, err)
	}
	hash, err := unusableHash()
	if err != nil {
		return "", err
	}
	phone := phone10
	if phone == "" {
		phone = "9" + randomHex(8)[:9] // synthetic; phone is NOT NULL + UNIQUE in Pulse
		phone = onlyDigits(phone)
		if len(phone) < 10 {
			phone = (phone + "0000000000")[:10]
		}
	}
	email := strings.TrimSpace(p.Email)
	name := firstNonEmpty(p.DisplayName, email, phone)
	username := firstNonEmpty(email, phone)
	meta, _ := json.Marshal(map[string]any{
		"ppfSetuAccess":   true,
		"vasPartnerId":    p.ID,
		"provisionedFrom": "vasrecon",
	})
	var id string
	err = pool.QueryRow(ctx, `
INSERT INTO users (role_id, name, email, phone, username, password_hash, status, is_active, metadata)
VALUES ($1,$2,NULLIF(lower($3),''),$4,NULLIF($5,''),$6,'approved',true,$7)
RETURNING id::text`,
		roleID, name, email, phone, username, hash, meta).Scan(&id)
	return id, err
}

func onlyDigits(s string) string {
	var d strings.Builder
	for _, c := range s {
		if c >= '0' && c <= '9' {
			d.WriteRune(c)
		}
	}
	return d.String()
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

// last10 returns the trailing 10 digits of a phone (or fewer if shorter).
func last10(s string) string {
	var d strings.Builder
	for _, c := range s {
		if c >= '0' && c <= '9' {
			d.WriteRune(c)
		}
	}
	x := d.String()
	if len(x) > 10 {
		x = x[len(x)-10:]
	}
	return x
}

// isTestRow reports obvious test/dummy/junk rows.
func isTestRow(name, emailLC, phone10 string) bool {
	hay := strings.ToLower(name) + " " + emailLC
	for _, n := range testNeedles {
		if strings.Contains(hay, n) {
			return true
		}
	}
	return isJunkPhone(phone10)
}

// isJunkPhone flags empty, too-short, or single-repeated-digit phones.
func isJunkPhone(p string) bool {
	if len(p) < 10 {
		return true
	}
	all := true
	for i := 1; i < len(p); i++ {
		if p[i] != p[0] {
			all = false
			break
		}
	}
	return all
}

func writePayload(path string, payload []erpSalesPartner) error {
	b, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o644)
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// unusableHash returns an argon2 hash of a random secret nobody knows.
func unusableHash() (string, error) {
	return auth.HashPassword(randomHex(24))
}
