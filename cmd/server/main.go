// Command server runs the P91 Pulse REST API.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/config"
	"github.com/p91/pulse/internal/db"
	"github.com/p91/pulse/internal/httpapi"
	"github.com/p91/pulse/internal/vas"
)

func main() {
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

	authMgr := auth.NewManager(cfg.JWTSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)
	vasGW := vas.New(cfg.VASBaseURL, cfg.VASWebURL, cfg.VASSecret)
	if vasGW.Enabled() {
		log.Printf("VAS gateway enabled → %s", cfg.VASBaseURL)
	}
	srv := httpapi.NewServer(pool, authMgr, cfg.CORSOrigin, vasGW)

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Router(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("P91 Pulse API listening on :%s (env=%s)", cfg.Port, cfg.Env)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	// Graceful shutdown.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Println("server stopped")
}
