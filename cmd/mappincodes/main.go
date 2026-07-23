// Command mappincodes is an IDEMPOTENT seed tool for the territory tree. It
// (a) ensures a 'national' root and the standard Indian states/UTs as 'state'
// nodes (parent = national; regions are added later by the admin), (b) derives
// city nodes + pincode→city mappings from the local `customers` mirror (the
// confirmed v1 source — covers 100% of pincoded leads), and (c) resolves a
// pincode that appears with >1 city by frequency (mode), flagging the count.
//
// It only writes territory/pincode rows; it never touches ERP. Safe to re-run.
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

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pool, err := db.NewPool(ctx, dbURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	// 1) National root.
	nationalID, err := ensureNode(ctx, pool, "national", "National", nil)
	if err != nil {
		log.Fatalf("national root: %v", err)
	}
	log.Printf("national root ready: %s", nationalID)

	// 2) States (parent = national). Regions are created later by the admin, who
	//    then re-parents states under them.
	stateByName := map[string]string{} // lower(name) -> id
	statesSeeded := 0
	for _, name := range indianStates {
		id, created, err := ensureNodeCounted(ctx, pool, "state", name, &nationalID)
		if err != nil {
			log.Fatalf("state %q: %v", name, err)
		}
		stateByName[strings.ToLower(name)] = id
		if created {
			statesSeeded++
		}
	}
	log.Printf("states present: %d (%d newly seeded)", len(indianStates), statesSeeded)

	// 3) Derive cities + pincode→city from customers.
	rows, err := pool.Query(ctx, `
SELECT custom_pincode AS pincode,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(state),''))     AS state,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(city),''))      AS city,
       mode() WITHIN GROUP (ORDER BY NULLIF(btrim(territory),'')) AS territory,
       count(DISTINCT NULLIF(btrim(city),''))                     AS city_variants,
       count(*)                                                   AS n
FROM customers
WHERE NULLIF(btrim(custom_pincode),'') IS NOT NULL
GROUP BY custom_pincode
ORDER BY custom_pincode`)
	if err != nil {
		log.Fatalf("derive from customers: %v", err)
	}
	defer rows.Close()

	cityByKey := map[string]string{} // lower(state|city) -> city node id
	var citiesCreated, pincodesMapped, conflicts, unresolvedState int

	type pinRow struct {
		pincode                   string
		state, city, territory    *string
		cityVariants, occurrences int
	}
	var pins []pinRow
	for rows.Next() {
		var pr pinRow
		if err := rows.Scan(&pr.pincode, &pr.state, &pr.city, &pr.territory, &pr.cityVariants, &pr.occurrences); err != nil {
			log.Fatalf("scan pincode row: %v", err)
		}
		pins = append(pins, pr)
	}
	if err := rows.Err(); err != nil {
		log.Fatalf("iterate pincodes: %v", err)
	}

	for _, pr := range pins {
		if pr.cityVariants > 1 {
			conflicts++ // resolved by mode() above; flagged for review
		}
		cityName := firstNonEmpty(deref(pr.city), deref(pr.territory))
		stateName := deref(pr.state)

		// Resolve the city node's parent: its state node if known, else national.
		parentID := nationalID
		if stateName != "" {
			if sid, ok := stateByName[strings.ToLower(stateName)]; ok {
				parentID = sid
			} else {
				unresolvedState++
			}
		}

		var cityID *string
		if cityName != "" {
			key := strings.ToLower(stateName + "|" + cityName)
			id, ok := cityByKey[key]
			if !ok {
				newID, created, err := ensureNodeCounted(ctx, pool, "city", cityName, &parentID)
				if err != nil {
					log.Fatalf("city %q: %v", cityName, err)
				}
				id = newID
				cityByKey[key] = id
				if created {
					citiesCreated++
				}
			}
			cityID = &id
		}

		if _, err := pool.Exec(ctx, `
INSERT INTO pincode_territory (pincode, city_territory_id, state, city, source, updated_at)
VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),'derived',now())
ON CONFLICT (pincode) DO UPDATE SET
  city_territory_id = EXCLUDED.city_territory_id,
  state = EXCLUDED.state, city = EXCLUDED.city,
  source = 'derived', updated_at = now()`,
			pr.pincode, cityID, stateName, cityName); err != nil {
			log.Fatalf("pincode %q upsert: %v", pr.pincode, err)
		}
		pincodesMapped++
	}

	fmt.Println("──────────────────────────────────────────────")
	fmt.Println("mappincodes summary")
	fmt.Printf("  states seeded (new)   : %d (of %d present)\n", statesSeeded, len(indianStates))
	fmt.Printf("  cities created (new)  : %d\n", citiesCreated)
	fmt.Printf("  pincodes mapped       : %d\n", pincodesMapped)
	fmt.Printf("  multi-city conflicts  : %d (resolved by frequency)\n", conflicts)
	fmt.Printf("  unresolved states     : %d (city parented under National — reassign in admin)\n", unresolvedState)
	fmt.Println("──────────────────────────────────────────────")
}

// ensureNode finds (by level + case-insensitive name + parent) or creates a
// territory node, returning its id. Idempotent.
func ensureNode(ctx context.Context, pool *pgxpool.Pool, level, name string, parentID *string) (string, error) {
	id, _, err := ensureNodeCounted(ctx, pool, level, name, parentID)
	return id, err
}

// ensureNodeCounted is ensureNode that also reports whether it inserted.
func ensureNodeCounted(ctx context.Context, pool *pgxpool.Pool, level, name string, parentID *string) (string, bool, error) {
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
	err = pool.QueryRow(ctx,
		`INSERT INTO territories (name, level, parent_id) VALUES ($1,$2,$3) RETURNING id::text`,
		name, level, parentID).Scan(&id)
	if err != nil {
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

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
