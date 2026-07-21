// Command bootstrap provisions the brand catalog and a login-ready admin user.
// Safe to run repeatedly; existing rows are reused.
//
// Usage:
//
//	go run ./cmd/bootstrap -email admin@p91.local -password 'Admin@12345' -phone 9000000001 -name 'P91 Admin'
package main

import (
	"context"
	"flag"
	"log"
	"strings"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/config"
	"github.com/p91/pulse/internal/db"
	"github.com/p91/pulse/internal/db/sqlc"
)

func main() {
	email := flag.String("email", "admin@p91.local", "admin email")
	password := flag.String("password", "Admin@12345", "admin password")
	phone := flag.String("phone", "9000000001", "admin phone (10-digit, required)")
	name := flag.String("name", "P91 Admin", "admin display name")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()
	q := sqlc.New(pool)

	// 1) Brands
	existing, _ := q.ListBrands(ctx)
	have := map[string]bool{}
	for _, b := range existing {
		have[b.Code] = true
	}
	brands := []struct{ code, name, scope string }{
		{"STEK", "STEK", "national"},
		{"P91CC", "P91 Car Care", "city"},
		{"P91INDIA", "P91 India", "national"},
		{"JS", "JustSigns", "national"},
	}
	for _, b := range brands {
		if have[b.code] {
			continue
		}
		scope := b.scope
		if _, err := q.CreateBrand(ctx, sqlc.CreateBrandParams{
			Name: b.name, Code: b.code, Scope: scope,
		}); err != nil {
			log.Printf("brand %s: %v", b.code, err)
		}
	}
	log.Printf("brands ready")

	// 2) Admin user
	if _, err := q.GetUserForLogin(ctx, *email); err == nil {
		log.Printf("admin user already exists: %s", *email)
		return
	}
	adminRole, err := q.GetRoleByCode(ctx, "admin")
	if err != nil {
		log.Fatalf("admin role missing (run migrations first): %v", err)
	}
	hash, err := auth.HashPassword(*password)
	if err != nil {
		log.Fatalf("hash: %v", err)
	}
	em := strings.ToLower(*email)
	uname := "admin"
	user, err := q.CreateUser(ctx, sqlc.CreateUserParams{
		RoleID:       adminRole.ID,
		Name:         *name,
		Email:        &em,
		Phone:        *phone,
		Username:     &uname,
		PasswordHash: &hash,
		Status:       "approved",
		IsActive:     true,
	})
	if err != nil {
		log.Fatalf("create admin: %v", err)
	}
	log.Printf("admin user created: %s / %s (id=%s)", *email, *password, user.ID)
	log.Printf("bootstrap complete")
}
