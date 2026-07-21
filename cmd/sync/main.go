// Command sync runs the ERPNext -> Postgres sync (Leads, Opportunities,
// Sales Partners) once, or on a fixed interval with -once=false.
//
// Usage:
//
//	go run ./cmd/sync                          # full incremental sync, all doctypes
//	go run ./cmd/sync -doctype leads -limit 25 # limited test pull
//	go run ./cmd/sync -once=false              # loop every 5 minutes
//
// Config comes from the environment (.env is loaded when present):
// DATABASE_URL, ERPNEXT_BASE_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET.
package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/p91/pulse/internal/db"
	"github.com/p91/pulse/internal/erp"
	"github.com/p91/pulse/internal/syncer"
)

func main() {
	once := flag.Bool("once", true, "run one sync pass and exit (false = repeat every 5m)")
	limit := flag.Int("limit", 0, "max docs to fetch per doctype (0 = all)")
	doctype := flag.String("doctype", "all", "which pass to run: all | leads | opportunities | partners")
	flag.Parse()

	switch *doctype {
	case "all", "leads", "opportunities", "partners", "assigned", "customers":
	default:
		log.Fatalf("invalid -doctype %q (want all|leads|opportunities|partners|assigned|customers)", *doctype)
	}

	// Best-effort: .env is optional where env is injected directly.
	_ = godotenv.Load()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	pool, err := db.NewPool(ctx, dbURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	client, err := erp.NewClientFromEnv()
	if err != nil {
		log.Fatalf("erp: %v", err)
	}

	s := syncer.New(client, pool)

	runPass := func() {
		startAt := time.Now()
		if *doctype == "all" || *doctype == "leads" {
			if res, err := s.SyncLeads(ctx, *limit); err != nil {
				log.Printf("sync leads: %v (fetched=%d upserted=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync leads done: fetched=%d upserted=%d last_modified=%q",
					res.Fetched, res.Upserted, res.LastModified)
			}
		}
		if *doctype == "all" || *doctype == "opportunities" { // writes the erp_opportunities mirror (no longer merged into customers)
			if res, err := s.SyncOpportunities(ctx, *limit); err != nil {
				log.Printf("sync opportunities: %v (fetched=%d upserted=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync opportunities done: fetched=%d upserted=%d last_modified=%q",
					res.Fetched, res.Upserted, res.LastModified)
			}
		}
		if *doctype == "all" || *doctype == "partners" {
			if res, err := s.SyncSalesPartners(ctx, *limit); err != nil {
				log.Printf("sync sales partners: %v (fetched=%d upserted=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync sales partners done: fetched=%d upserted=%d last_modified=%q",
					res.Fetched, res.Upserted, res.LastModified)
			}
		}
		if *doctype == "all" || *doctype == "assigned" {
			if res, err := s.SyncAssignedLeads(ctx, *limit); err != nil {
				log.Printf("sync assigned leads: %v (fetched=%d updated=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync assigned leads done: fetched=%d updated=%d", res.Fetched, res.Upserted)
			}
		}
		if *doctype == "all" || *doctype == "customers" {
			if res, err := s.SyncCustomers(ctx, *limit); err != nil {
				log.Printf("sync customers: %v (fetched=%d upserted=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync customers done: fetched=%d upserted=%d", res.Fetched, res.Upserted)
			}
			if n, err := s.ProvisionUsers(ctx); err != nil {
				log.Printf("provision users: %v (created=%d)", err, n)
			} else {
				log.Printf("provision users: %d logins created", n)
			}
			if res, err := s.SyncSalesOrders(ctx, *limit); err != nil {
				log.Printf("sync sales orders: %v (fetched=%d upserted=%d)", err, res.Fetched, res.Upserted)
			} else {
				log.Printf("sync sales orders done: fetched=%d upserted=%d", res.Fetched, res.Upserted)
			}
		}
		// Always relink: attaches leads to partner logins created since last run.
		if n, err := s.LinkPartnerLeads(ctx); err != nil {
			log.Printf("link partner leads: %v", err)
		} else if n > 0 {
			log.Printf("link partner leads: %d rows linked", n)
		}
		log.Printf("sync pass finished in %s", time.Since(startAt).Round(time.Millisecond))
	}

	runPass()
	if *once {
		return
	}

	const interval = 5 * time.Minute
	log.Printf("looping: next sync in %s (Ctrl+C to stop)", interval)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			log.Println("sync stopped")
			return
		case <-ticker.C:
			runPass()
		}
	}
}
