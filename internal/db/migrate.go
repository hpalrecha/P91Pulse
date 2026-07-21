package db

import (
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

// Migrate applies all up migrations embedded in MigrationsFS against the given
// database URL. It is safe to run repeatedly; already-applied migrations are
// skipped.
func Migrate(databaseURL string) error {
	src, err := iofs.New(MigrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("open migrations: %w", err)
	}

	// golang-migrate's pgx/v5 driver expects a pgx5:// scheme.
	m, err := migrate.NewWithSourceInstance("iofs", src, toPgxURL(databaseURL))
	if err != nil {
		return fmt.Errorf("init migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("run migrations: %w", err)
	}
	return nil
}

// toPgxURL rewrites a postgres:// URL to the pgx5:// scheme the migrate driver
// registers itself under, leaving all query params (sslmode, channel_binding)
// intact.
func toPgxURL(url string) string {
	const (
		p1 = "postgresql://"
		p2 = "postgres://"
	)
	switch {
	case len(url) >= len(p1) && url[:len(p1)] == p1:
		return "pgx5://" + url[len(p1):]
	case len(url) >= len(p2) && url[:len(p2)] == p2:
		return "pgx5://" + url[len(p2):]
	default:
		return url
	}
}

// ensure the pgx driver package is referenced so its init() registers the driver.
var _ = pgx.Postgres{}
