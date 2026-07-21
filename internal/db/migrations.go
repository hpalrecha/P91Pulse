package db

import "embed"

// MigrationsFS embeds the SQL migration files so they ship inside the binary
// and can be applied without an external migrate CLI.
//
//go:embed migrations/*.sql
var MigrationsFS embed.FS
