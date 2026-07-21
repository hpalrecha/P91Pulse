// Command migrate applies embedded database migrations, then exits.
// Usage: go run ./cmd/migrate
package main

import (
	"log"

	"github.com/p91/pulse/internal/config"
	"github.com/p91/pulse/internal/db"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	if err := db.Migrate(cfg.DatabaseURL); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("migrations applied")
}
