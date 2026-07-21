# P91 Pulse

Next-generation operational platform for P91 India. See [DESIGN.md](./DESIGN.md) for the living
architecture/business spec.

**Stack:** Go (chi + pgx + sqlc) · PostgreSQL/Neon · React + Vite + TS (frontend, WIP) ·
REST · module × action RBAC · single-tenant (sold as one deployment per customer, not shared SaaS).

## Backend — Slice 1: Users + RBAC (working)

### Prerequisites
- Go 1.24+
- `sqlc` and `migrate` (dev only): the code embeds migrations, so `migrate` CLI is optional.
  - `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`

### Setup
```bash
cp .env.example .env      # then fill DATABASE_URL + JWT_SECRET (a real .env already exists locally)

go run ./cmd/migrate      # apply embedded migrations
go run ./cmd/bootstrap    # create the 4 brands + an admin login
go run ./cmd/server       # start API on :8080
```
Bootstrap prints the admin credentials (default `admin@p91.local` / `Admin@12345`, phone `9000000001`).

### Regenerate DB layer after changing SQL
```bash
sqlc generate             # regenerates internal/db/sqlc from queries + migrations
```

### Project layout
```
cmd/
  server/      REST API entrypoint
  migrate/     applies embedded migrations
  bootstrap/   seeds brands + admin
internal/
  config/      env loading
  db/          pgx pool, embedded migrations, sqlc queries + generated code
  auth/        Argon2id passwords, JWT
  rbac/        pure permission model (module x action) + Principal
  httpapi/     chi router, middleware (auth + permission guard + CORS), handlers
```

### API (Slice 1)
| Method | Path | Guard |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | authenticated |
| GET | `/api/me/permissions` | authenticated |
| GET | `/api/users` | `users_rbac:view` |
| POST | `/api/users` | `users_rbac:create` |
| GET | `/api/users/{id}` | `users_rbac:view` |
| PUT | `/api/users/{id}` | `users_rbac:edit` |
| DELETE | `/api/users/{id}` | `users_rbac:delete` |
| POST | `/api/users/{id}/status` | `users_rbac:edit` (approve/reject) |
| POST | `/api/users/{id}/active` | `users_rbac:edit` (enable/disable) |
| POST | `/api/users/{id}/password` | `users_rbac:edit` |
| GET | `/api/users/{id}/permissions` | `users_rbac:view` |
| PUT | `/api/users/{id}/permissions` | `users_rbac:edit` (override set) |
| GET | `/api/roles` · `/api/permissions` · `/api/brands` | `users_rbac:view` |

### Design guarantees demonstrated
- **Single-tenant by design:** no `tenant_id` anywhere — each customer gets their own deployment,
  so isolation is physical, not a column (see DESIGN.md "Multi-tenancy REMOVED").
- **Phone is always required** — enforced at the DB (`NOT NULL`, globally unique) and API layer.
- **Brand access is per-user, many-to-many** (`user_brands`) — a user may be granted some, all, or
  no brands.
- **RBAC enforced server-side:** `module × action` permissions from role templates ± per-user
  overrides, checked on every route.
- **Live permission changes:** effective permissions are loaded per request, so an override takes
  effect immediately — no re-login.
- **Surrogate keys:** UUID PKs; phone normalized to last-10 digits as an attribute, never identity.

## Frontend

`web/` — React + Vite + TS admin app (in progress; starts with the User Management tab).
