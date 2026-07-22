// Package config loads runtime configuration from the environment.
// A local .env file is loaded first (development convenience); real deployments
// inject the same variables through the platform's secret manager.
package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	Port          string
	Env           string
	JWTSecret     string
	JWTAccessTTL  time.Duration
	JWTRefreshTTL time.Duration
	CORSOrigin    string

	// VAS (SetuPPF) integration — empty base URL disables the VAS features.
	VASBaseURL string // VAS API base (e.g. http://localhost:5000)
	VASWebURL  string // VAS website for the central-login redirect of VAS-native users
	VASSecret  string // shared HMAC secret (PULSE_WEBHOOK_SECRET), same on both apps
}

// Load reads configuration from the process environment, loading a .env file
// first when present. It fails fast on missing required values so the service
// never boots half-configured.
func Load() (*Config, error) {
	// Best-effort: .env is optional in production where env is injected directly.
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        getOr("PORT", "8080"),
		Env:         getOr("ENV", "development"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		CORSOrigin:  getOr("CORS_ORIGIN", "http://localhost:5173"),
		VASBaseURL:  os.Getenv("PPF_SETU_BASE_URL"),
		VASWebURL:   getOr("PPF_SETU_WEB_URL", "https://pulsevas.p91india.com"),
		VASSecret:   os.Getenv("PULSE_WEBHOOK_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	var err error
	if cfg.JWTAccessTTL, err = parseDur("JWT_ACCESS_TTL", "15m"); err != nil {
		return nil, err
	}
	if cfg.JWTRefreshTTL, err = parseDur("JWT_REFRESH_TTL", "720h"); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) IsProduction() bool { return c.Env == "production" }

func getOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDur(key, fallback string) (time.Duration, error) {
	v := getOr(key, fallback)
	d, err := time.ParseDuration(v)
	if err != nil {
		return 0, fmt.Errorf("invalid duration for %s: %w", key, err)
	}
	return d, nil
}
