// Command mappincodes is an IDEMPOTENT seed tool for the territory tree. It
// (a) ensures a 'national' root and the standard Indian states/UTs as 'state'
// nodes (parent = national; regions are added later by the admin), (b) derives
// city nodes + pincode→city mappings from the local `customers` mirror (the
// confirmed v1 source — covers 100% of pincoded leads), and (c) resolves a
// pincode that appears with >1 city by frequency (mode), flagging the count.
//
// It only writes territory/pincode rows; it never touches ERP. Safe to re-run.
//
// All writes are BATCHED (one round-trip per chunk, not per row) so it completes
// over a slow VPN link to Neon: states + cities via chunked multi-row INSERTs,
// pincodes via COPY into a temp staging table then a single set-based upsert.
//
// Usage:
//
//	go run ./cmd/mappincodes
//
// Config: DATABASE_URL (auto-loaded from .env like cmd/vasrecon).
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/p91/pulse/internal/db"
)

// indianStates is the fixed middle layer (28 states + 8 UTs).
var indianStates = []string{
	"Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
	"Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
	"Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
	"Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
	"Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
	"Andaman and Nicobar Islands", "Chandigarh",
	"Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
	"Ladakh", "Lakshadweep", "Puducherry",
}

// chunkSize bounds each multi-row INSERT's parameter count well under Postgres's
// 65535-parameter ceiling (cities use 3 params/row → 1500 rows = 4500 params).
const chunkSize = 1500

// stagePin is one pincode_territory row staged for the batched upsert.
type stagePin struct {
	pincode  string
	cityID   *string
	state    *string
	cityName *string
}

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	// Generous overall budget for the whole run over VPN.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pool, err := db.NewPool(ctx, dbURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	// 1) National root (single upsert-by-lookup).
	nationalID, _, err := ensureNode(ctx, pool, "national", "National", nil)
	if err != nil {
		log.Fatalf("national root: %v", err)
	}
	log.Printf("national root ready: %s", nationalID)

	// 2) States (parent = national) — one batched INSERT, then read the ids back.
	statesInserted, err := batchInsertNodes(ctx, pool, "state", nationalID, indianStates)
	if err != nil {
		log.Fatalf("seed states: %v", err)
	}
	stateByName, err := loadChildIDs(ctx, pool, "state", nationalID)
	if err != nil {
		log.Fatalf("load state ids: %v", err)
	}
	log.Printf("states present: %d (%d newly inserted)", len(indianStates), statesInserted)

	// 3) Derive one row per pincode from customers (single query, into memory).
	rows, err := pool.Query(ctx, `
SELECT custom_pincode AS pincode,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(state),''))     AS state,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(city),''))      AS city,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(territory),'')) AS territory,
       count(DISTINCT NULLIF(btrim(city),''))                     AS city_variants
FROM customers
WHERE NULLIF(btrim(custom_pincode),'') IS NOT NULL
GROUP BY custom_pincode
ORDER BY custom_pincode`)
	if err != nil {
		log.Fatalf("derive from customers: %v", err)
	}

	type pinRow struct {
		pincode, state, cityName string // resolved
		parentID                 string // state node id (or national)
	}
	var pins []pinRow
	var conflicts, unresolvedState int
	// cityKeys collects the distinct (parentID, cityName) pairs to create.
	type cityKey struct{ parentID, name string }
	cityKeySet := map[cityKey]bool{}

	for rows.Next() {
		var pincode string
		var state, city, territory *string
		var cityVariants int
		if err := rows.Scan(&pincode, &state, &city, &territory, &cityVariants); err != nil {
			rows.Close()
			log.Fatalf("scan pincode row: %v", err)
		}
		if cityVariants > 1 {
			conflicts++ // resolved by mode() above; flagged for review
		}
		stateName := deref(state)
		cityName := firstNonEmpty(deref(city), deref(territory))
		parentID := nationalID
		if stateName != "" {
			if sid, ok := stateByName[strings.ToLower(stateName)]; ok {
				parentID = sid
			} else {
				unresolvedState++
			}
		}
		pins = append(pins, pinRow{pincode: pincode, state: stateName, cityName: cityName, parentID: parentID})
		if cityName != "" {
			cityKeySet[cityKey{parentID: parentID, name: cityName}] = true
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		log.Fatalf("iterate pincodes: %v", err)
	}
	rows.Close()

	// 4) Cities — batched INSERT of the distinct (parent, name) pairs, then read
	//    all city ids back into a (parentID|lower(name)) -> id map.
	cityRows := make([][]any, 0, len(cityKeySet))
	for k := range cityKeySet {
		cityRows = append(cityRows, []any{k.name, "city", k.parentID})
	}
	citiesInserted, err := batchInsertNodeRows(ctx, pool, cityRows)
	if err != nil {
		log.Fatalf("seed cities: %v", err)
	}
	cityByKey, err := loadCityIDs(ctx, pool)
	if err != nil {
		log.Fatalf("load city ids: %v", err)
	}

	// 5) Pincodes — COPY every row into a temp staging table, then one set-based
	//    upsert into pincode_territory. Two round-trips total, not ~1,700.
	staging := make([]stagePin, 0, len(pins))
	for _, p := range pins {
		var cityID *string
		if p.cityName != "" {
			if id, ok := cityByKey[p.parentID+"|"+strings.ToLower(p.cityName)]; ok {
				idCopy := id
				cityID = &idCopy
			}
		}
		staging = append(staging, stagePin{
			pincode:  p.pincode,
			cityID:   cityID,
			state:    nilIfEmpty(p.state),
			cityName: nilIfEmpty(p.cityName),
		})
	}

	pincodesUpserted, err := upsertPincodes(ctx, pool, staging)
	if err != nil {
		log.Fatalf("upsert pincodes: %v", err)
	}

	fmt.Println("──────────────────────────────────────────────")
	fmt.Println("mappincodes summary")
	fmt.Printf("  states inserted (new) : %d (of %d present)\n", statesInserted, len(indianStates))
	fmt.Printf("  cities inserted (new) : %d (of %d distinct)\n", citiesInserted, len(cityKeySet))
	fmt.Printf("  pincodes upserted     : %d\n", pincodesUpserted)
	fmt.Printf("  multi-city conflicts  : %d (resolved by frequency)\n", conflicts)
	fmt.Printf("  unresolved states     : %d (city parented under National — reassign in admin)\n", unresolvedState)
	fmt.Println("──────────────────────────────────────────────")
}

// upsertPincodes COPYs every row into a temp staging table then runs one
// set-based INSERT ... SELECT ... ON CONFLICT DO UPDATE, inside one transaction
// (so the temp table auto-drops on commit). city_territory_id is staged as text
// and cast to uuid on insert, so COPY needs no uuid binary encoding. Returns
// rows affected.
func upsertPincodes(ctx context.Context, pool *pgxpool.Pool, rows []stagePin) (int64, error) {
	if len(rows) == 0 {
		return 0, nil
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
CREATE TEMP TABLE _pt_stage (
  pincode text, city_territory_id text, state text, city text
) ON COMMIT DROP`); err != nil {
		return 0, fmt.Errorf("create stage: %w", err)
	}

	src := make([][]any, len(rows))
	for i, r := range rows {
		cityIDStr := ""
		if r.cityID != nil {
			cityIDStr = *r.cityID
		}
		src[i] = []any{r.pincode, cityIDStr, derefAny(r.state), derefAny(r.cityName)}
	}
	if _, err := tx.CopyFrom(ctx,
		pgx.Identifier{"_pt_stage"},
		[]string{"pincode", "city_territory_id", "state", "city"},
		pgx.CopyFromRows(src)); err != nil {
		return 0, fmt.Errorf("copy into stage: %w", err)
	}

	tag, err := tx.Exec(ctx, `
INSERT INTO pincode_territory (pincode, city_territory_id, state, city, source, updated_at)
SELECT s.pincode, NULLIF(s.city_territory_id,'')::uuid, NULLIF(s.state,''), NULLIF(s.city,''), 'derived', now()
FROM _pt_stage s
ON CONFLICT (pincode) DO UPDATE SET
  city_territory_id = EXCLUDED.city_territory_id,
  state = EXCLUDED.state, city = EXCLUDED.city,
  source = 'derived', updated_at = now()`)
	if err != nil {
		return 0, fmt.Errorf("upsert from stage: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit: %w", err)
	}
	return tag.RowsAffected(), nil
}

// batchInsertNodes inserts territory nodes of a level under one parent, in
// chunked multi-row INSERTs (ON CONFLICT DO NOTHING). Returns rows inserted.
func batchInsertNodes(ctx context.Context, pool *pgxpool.Pool, level, parentID string, names []string) (int, error) {
	rows := make([][]any, 0, len(names))
	for _, n := range names {
		rows = append(rows, []any{n, level, parentID})
	}
	return batchInsertNodeRows(ctx, pool, rows)
}

// batchInsertNodeRows inserts (name, level, parent_id) rows into territories in
// chunks. Idempotency is provided by a NOT-EXISTS guard (there is no unique
// constraint on (name,level,parent_id)), so re-runs insert nothing.
func batchInsertNodeRows(ctx context.Context, pool *pgxpool.Pool, rows [][]any) (int, error) {
	total := 0
	for start := 0; start < len(rows); start += chunkSize {
		end := start + chunkSize
		if end > len(rows) {
			end = len(rows)
		}
		chunk := rows[start:end]

		var sb strings.Builder
		sb.WriteString(`INSERT INTO territories (name, level, parent_id)
SELECT v.name, v.level, v.parent_id::uuid FROM (VALUES `)
		args := make([]any, 0, len(chunk)*3)
		for i, r := range chunk {
			if i > 0 {
				sb.WriteString(",")
			}
			b := i * 3
			fmt.Fprintf(&sb, "($%d,$%d,$%d)", b+1, b+2, b+3)
			args = append(args, r...)
		}
		sb.WriteString(`) AS v(name, level, parent_id)
WHERE NOT EXISTS (
  SELECT 1 FROM territories t
  WHERE t.level = v.level AND lower(t.name) = lower(v.name) AND t.parent_id = v.parent_id::uuid
)`)
		tag, err := pool.Exec(ctx, sb.String(), args...)
		if err != nil {
			return total, err
		}
		total += int(tag.RowsAffected())
	}
	return total, nil
}

// loadChildIDs returns lower(name) -> id for all nodes of a level under parent.
func loadChildIDs(ctx context.Context, pool *pgxpool.Pool, level, parentID string) (map[string]string, error) {
	rows, err := pool.Query(ctx,
		`SELECT id::text, name FROM territories WHERE level=$1 AND parent_id=$2`, level, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]string{}
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		out[strings.ToLower(name)] = id
	}
	return out, rows.Err()
}

// loadCityIDs returns "parentID|lower(name)" -> id for every city node (one
// query), so pincode rows resolve their city node without per-city lookups.
func loadCityIDs(ctx context.Context, pool *pgxpool.Pool) (map[string]string, error) {
	rows, err := pool.Query(ctx,
		`SELECT id::text, COALESCE(parent_id::text,''), name FROM territories WHERE level='city'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]string{}
	for rows.Next() {
		var id, parentID, name string
		if err := rows.Scan(&id, &parentID, &name); err != nil {
			return nil, err
		}
		out[parentID+"|"+strings.ToLower(name)] = id
	}
	return out, rows.Err()
}

// ensureNode finds (by level + case-insensitive name + parent) or creates a
// single territory node. Used only for the national root. Returns (id, created).
func ensureNode(ctx context.Context, pool *pgxpool.Pool, level, name string, parentID *string) (string, bool, error) {
	var id string
	var err error
	if parentID == nil {
		err = pool.QueryRow(ctx,
			`SELECT id::text FROM territories WHERE level=$1 AND lower(name)=lower($2) AND parent_id IS NULL LIMIT 1`,
			level, name).Scan(&id)
	} else {
		err = pool.QueryRow(ctx,
			`SELECT id::text FROM territories WHERE level=$1 AND lower(name)=lower($2) AND parent_id=$3 LIMIT 1`,
			level, name, *parentID).Scan(&id)
	}
	if err == nil {
		return id, false, nil
	}
	if err != pgx.ErrNoRows {
		return "", false, err
	}
	if err := pool.QueryRow(ctx,
		`INSERT INTO territories (name, level, parent_id) VALUES ($1,$2,$3) RETURNING id::text`,
		name, level, parentID).Scan(&id); err != nil {
		return "", false, err
	}
	return id, true, nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return strings.TrimSpace(*s)
}

func derefAny(s *string) any {
	if s == nil {
		return ""
	}
	return *s
}

func nilIfEmpty(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
