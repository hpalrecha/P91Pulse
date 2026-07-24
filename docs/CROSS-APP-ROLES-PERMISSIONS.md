# P91 Cross-App — User Roles & Permissions Report

> Comparative audit of how **roles, permissions, user grouping, and resource
> assignment** work across the four P91 apps. Compiled 2026-07-24 by reading each
> app's live schema/migrations/middleware. Every claim is cited to `file:line`.
>
> Apps covered:
> 1. **Pulse91** (`p91pulse`) — lead CRM portal · Go + React · Postgres
> 2. **VAS / SetuPPFPortal** — install job-cards & payouts · Express/TS · Postgres (Drizzle)
> 3. **Dialer** (`dialer_dashboard` + `Dialer_mobile`) — calling pipeline · Fastify/TS + Expo · Postgres (Drizzle)
> 4. **Field Force** (`p91-field-force`) — field visits/attendance · Express/TS (+ partial Go) · Supabase/Postgres

---

## 0. TL;DR — the one-paragraph verdict

**Every app rolls its own role model; there is no shared identity, no shared role
table, and no common permission format.** Pulse91 is the *only* app with a true
**module × action RBAC catalog with per-user overrides** — a genuine engine. The
other three are **role-string allow-lists** (VAS, Field Force) or a **hybrid
role-default + JSON checkbox set** (Dialer). Role *names* overlap heavily
(`admin`, `nsm/rsm/asm`, `salesperson`, `distributor/detailer`) but the codes,
casing, and semantics differ per app, so they are **not interchangeable**. A
"Super Admin" tier exists as a first-class concept **only in Pulse91
(`platform_super_admin`) and VAS (`SUPER_ADMIN`)**; Dialer and Field Force top
out at `admin`.

---

## 1. Comparison matrix

| Dimension | **Pulse91** | **VAS (SetuPPFPortal)** | **Dialer** | **Field Force** |
|---|---|---|---|---|
| Stack | Go + chi, sqlc | Express + Drizzle | Fastify + Drizzle / Expo RN | Express (+Go) + Supabase |
| Role storage | `roles` table (system + custom), `roles.code` | `user_role` **pg enum** (fixed 10) | `users.role` **text** (4) + `flow_roles` table (4) | `users.role` **text** (5), enum in code only |
| # of roles | **10** | **10** | **4 coarse + 4 flow** | **5** |
| Permission model | **module×action catalog** (13×8) + role templates + **per-user overrides** | role-string `requireRole()` (used 132×), no catalog | **hybrid**: role defaults + per-user **JSON checkbox set** (tabs/actions/leadScope) | role-string `authorize()` allow-list, no catalog |
| Super-admin tier | ✅ `platform_super_admin` (platform tier) | ✅ `SUPER_ADMIN` (global bypass) | ❌ (`admin` is top) | ❌ (`admin` is top) |
| Grouping / hierarchy | tier (platform/internal/external) + `parent_user_id` tree + territory/coverage | 2-branch: OEM→dealership→showroom→salesperson **and** partner→staff (M:N) | flat `managerId` + **flow-graph** (SM→SP1→DETAILER→SP2) + brands M:N | `reporting_manager_id` self-FK chain (SP→ASM→RSM→NSM→Admin) + territory/pincode |
| Row-level data scope | SQL predicate per role (`leadScope()`) + coverage rollup | tenant filters + in-handler ownership re-checks | brand gate + flow visibility + ERP-assigned "mine" | app-code scope (`scope.ts`) + latent Postgres RLS |
| Enforcement point | `requirePerm(module,action)` middleware, **live per request** | `requireRole([...])` + `requireOEMAccess` middleware | `requirePermission(key)` / `requireManager` | `authorize(...roles)` middleware |
| Permissions change takes effect | **immediately** (loaded per request) | next request (role in token, staff sets re-fetched) | next request (effective perms recomputed) | next token (role in JWT) |
| Migrations style | numbered `.sql` (0001–0013), sqlc | Drizzle **push** (schema.ts authoritative); 2 seed SQL | Drizzle **push** + idempotent TS scripts | numbered `.sql` (Node 0001–0013, Go 0001–0007) |
| Source of truth for leads | ERPNext (mirrored) | own work_orders/job_cards | ERPNext (mirrored) + flow state | ERPNext (only reference stored) |

---

## 2. Pulse91 (`p91pulse`) — the RBAC reference model

**The only app with a real permission engine.** (See also `docs/LEAD-FLOW-SPEC.md`.)

- **Permission primitive** = `module:action` (`internal/rbac/rbac.go:9`). 13 modules ×
  8 actions seeded in `internal/db/migrations/0002_seed_rbac.up.sql:6-18`.
  - Modules: `users_rbac, leads, territories_brands, inventory, orders, warranty, claims, rewards, sales_partners, vas_jobcards, dashboards, integrations, audit`
  - Actions: `view, create, edit, delete, assign, approve, configure, export`
- **10 system roles** (`0002_seed_rbac.up.sql:21-32`), each with a `tier`
  (`platform` / `internal` / `external`):

  | Code | Name | Tier |
  |---|---|---|
  | `platform_super_admin` | Platform Super Admin | platform |
  | `admin` | Tenant Admin | internal |
  | `nsm` / `rsm` / `asm` | National / Regional / Area Sales Manager | internal |
  | `salesperson` | Salesperson | internal |
  | `distributor` / `detailer` / `installer` / `sales_partner` | (partners) | external |

- **Effective perms** = role-template grants − explicit revokes ∪ explicit grants,
  computed **live per request** (`internal/db/queries/permissions.sql:11-29`,
  wired in `internal/httpapi/middleware.go:35`). Per-user overrides live in
  `user_permission_overrides` (`0001_core.up.sql:127-132`).
- **`admin` is actually the most powerful role** — its seed grants *every*
  permission (`JOIN permissions p ON true`, `0002...up.sql:48-52`).
  `platform_super_admin` is deliberately narrower (container governance only:
  `users_rbac`, `territories_brands`/`integrations` view+configure, dashboards/audit
  view — `:36-45`). `IsPlatform()` keys on it (`rbac.go:40`).
- **Grouping**: tier axis + `users.parent_user_id` management tree
  (`0001_core.up.sql:104`) + row-level `user_territories` / `user_states` /
  `salesperson_coverage`.
- **Lead assignment & scope**: `leadScope()` returns a per-role SQL predicate
  (`internal/httpapi/erp_scope.go:16`); admin/`platform_super_admin`/nsm see all,
  others are scoped by assignment ∪ pincode-coverage ∪ downline. Auto-assign by
  pincode→Sales-Partner match (`matchPartner`, `erp_scope.go:211`), detailers win
  over distributors.
- **Lead statuses**: `Lead/Open → Replied/Interested → Opportunity/Quotation/Prospect
  → Converted/Lost/Do Not Contact`. Terminal states freeze the record
  (`is_frozen`, `erp_customers_handler.go:527-530`); every change writes
  `lead_history` + `audit_logs`.

---

## 3. VAS / SetuPPFPortal — string RBAC + two-branch tenancy

- **10 roles** — pg enum `user_role` (`shared/schema.ts:21-32`):
  `SUPER_ADMIN, ADMIN, MANAGER, OEM_ADMIN, DEALERSHIP_ADMIN, SHOWROOM_MANAGER,
  SALES_PERSON, PARTNER_ADMIN, PARTNER_STAFF, DETAILING_PARTNER`.
  (Note: `ADMIN`/`MANAGER`/`PARTNER_STAFF`/`DETAILING_PARTNER` exist in the enum
  but are **not** seeded by `migrations/0001_initial_seed.sql:97-115`.)
- **No permission catalog.** RBAC = `requireRole([...])` middleware, used **132×**
  across routes (`server/middleware.ts:51-63`). Extra guards: `requireOEMAccess`
  (`:65-109`), `hasStateAccess` for MANAGER (`:112-128`), `blockAdminDelete`
  (`:169-179`). Only two fine-grained toggles exist:
  `partners.canViewJobCardPrice` (`schema.ts:273`) and `users.showServicePrices`
  (`schema.ts:210`).
- `SUPER_ADMIN` **bypasses all tenant isolation** (`server/middleware/tenancy.ts:28-30`,
  `rbac.ts:43-45`) — this is the true god-mode role here.
- **Two-branch hierarchy** converging on `users` (nullable scope FKs `oemId`,
  `dealershipId`, `showroomId`, `partnerId`):
  - Customer side: `SUPER_ADMIN/ADMIN → MANAGER(state) → OEM_ADMIN → DEALERSHIP_ADMIN
    → SHOWROOM_MANAGER/SALES_PERSON` (`tenancy.ts:27-55`).
  - Partner side: `PARTNER_ADMIN` (scalar `partnerId`) + `PARTNER_STAFF`/`DETAILING_PARTNER`
    **many-to-many** via `partner_staff_assignments` (`schema.ts:295-307`), re-resolved
    per request (`middleware.ts:40-42`).
- **Assignment**: `work_orders.assignedPartnerId` + `job_cards.partnerId` /
  `assignedInstallerId`, routed by priority-ranked `allocations` (`schema.ts:344-354`).
- **Statuses** (imperative, no state-machine table):
  `work_order_status` 10 values (`schema.ts:36-47`), `job_card_status` **18 values**
  (`schema.ts:49-68`) incl. rework chaining via `reworkOfJobCardId`.
- **Migrations**: Drizzle `push` (schema.ts is DDL truth); only
  `0001_initial_seed.sql` (seed) + `0002_add_rework...sql` exist as SQL.

---

## 4. Dialer (`dialer_dashboard` + `Dialer_mobile`) — hybrid + flow engine

**Two orthogonal role systems.**

- **Coarse auth roles (4)** — `users.role` text (`schema.ts:29`):
  `admin | sales_manager | salesperson | detailer`. `admin`+`sales_manager` =
  "managers" (`auth/permissions.ts:46-51`, `isManager`).
- **Flow roles (4)** — `flow_roles` table (`schema.ts:468-472`), seeded
  `SM | SP1 | DETAILER | SP2` (`db/seed.ts:22-27`). Coarse→flow default map in
  `admin.ts:16-21`.
- **Permission model = hybrid**: role defaults (`permissions.ts:59-75`) merged with
  a **per-user JSON checkbox set** stored in `users.permissions jsonb`
  (`schema.ts:32-34`). Shape = `{ tabs{...bool}, actions{...bool}, leadScope:'all'|'assigned' }`
  (`permissions.ts:12-37`). Managers = all-true, override ignored; `detailer` =
  `leadScope:'assigned'`.
- **Enforcement**: `requireManager` + `requirePermission(key)` factory
  (`auth/session.ts:125-135`), e.g. `requirePermission('actions.moveStage')` on
  transitions (`leads.ts:423`). Mobile mirrors the same set verbatim
  (`Dialer_mobile/src/core/permissions.ts:12-17`).
- **Grouping**: flat `managerId` self-FK (informational) + brand gate (`user_brands`
  M:N) + the **flow graph** as the real team structure (`flow_role_members`,
  `flow_visibility`, `flow_assignment`).
- **Assignment = flow engine** (config-as-data): owner = `lead_flow_state.currentOwnerUserId`;
  auto-assigned on stage entry (`single`/`round_robin`), auto detailer handoff on
  `opportunity` (`flow/engine.ts:233-267`).
- **Stages**: `new_lead → qualifying → opportunity → at_detailer → follow_up →
  converted*/lost*/not_interested*` (`seed.ts:10-20`), each with an ERP status map.
- **Call dispositions** (`leads.ts:98-113`): `open, replied, interested,
  not_interested, opportunity, quotation, converted, lost_quotation, do_not_contact`
  (map to ERP `Lead.status`) + dialer-only `no_answer, busy, wrong_number, callback`.
- **Migrations**: Drizzle `push` + idempotent TS scripts in `apps/api/scripts/`
  (`add-admin-role.ts` is the key roles one — adds the `permissions` jsonb column
  and the `sales_manager` login).

---

## 5. Field Force (`p91-field-force`) — 5-role hierarchy + data scoping

- **5 roles** — enum in code, not DB (`backend/src/constants/roles.ts:8-14`):
  `admin | nsm | rsm | asm | salesperson`. Stored as plain `text`
  (`0001_init.sql:60`). `ROLE_RANK` 0–4 and `NATIONWIDE_ROLES = [admin, nsm]`
  (`roles.ts:21-30`). Role is derived from ERPNext designation on sync
  (`designationToRole`, `roles.ts:36-43`). Mirrored in Go (`go-backend/internal/constants/roles.go`).
- **No roles/permissions tables.** RBAC = `authorize(...allowedRoles)` allow-list
  (`middleware/permissions.middleware.ts:8-22`) + role-driven **data scoping** in
  `utils/scope.ts:28-51` (nationwide vs territory-subtree vs pincode).
  Admin is **oversight-only** — deliberately excluded from field-visit routes
  (`visit.routes.ts:20-23`).
- **Defense-in-depth RLS** exists in SQL but is latent (backend uses service-role
  key that bypasses it): helpers `get_user_role()`, recursive `is_subordinate()`
  and hierarchical policies in `0006_visit_execution_and_expenses.sql:44-187`.
- **Hierarchy**: `users.reporting_manager_id` self-FK (`0004_reporting_manager.sql:7`),
  expected chain `Salesperson → ASM → RSM → NSM → Admin` (`user.service.ts:10-15`),
  validated-but-not-enforced. Territory via nested-set `territories` + `user_territories`
  / `user_pincodes` (`0005_scope_tables.sql`).
- **Owned resources** (leads live in ERP, only referenced): `visits, plans,
  followups, attendance, expenses`, each `salesperson_id`-assigned. Statuses:
  visit `planned/in_progress/completed/cancelled/missed` (`domain.ts:5-11`);
  followup `pending/done/overdue/cancelled`; attendance `checked_in/checked_out/
  absent/on_leave`; expense `Submitted→Approved/Rejected` (manager approves subordinates).
- **Migrations**: numbered `.sql` — Node `0001`–`0013` + Go `0001`–`0007`. Roles
  touched by `0001_init.sql` (users), `0004_reporting_manager.sql` (hierarchy),
  `0005_scope_tables.sql` (scope), `0006...sql` (RLS + `is_subordinate`).

---

## 6. Cross-cutting observations

1. **No shared identity or SSO.** Each app has its own `users` table, its own hash,
   its own role vocabulary. A person who is "NSM" in Field Force is a *different
   record* from "nsm" in Pulse91. ERPNext is the only common anchor (all sync from
   employee/partner records).

2. **Role-name collisions with different meanings.**
   - `admin`: top-of-tenant in Pulse91/VAS/Dialer, but **oversight-only** in Field
     Force (blocked from field ops).
   - `nsm/rsm/asm`: first-class in Pulse91 **and** Field Force (same idea), absent
     in VAS/Dialer.
   - `detailer`: an *external partner* in Pulse91, a *flow role* + coarse role in
     Dialer, and a `DETAILING_PARTNER` in VAS — three different mechanisms.
   - `distributor`: exists only in Pulse91/VAS; Dialer/Field Force have no B2B
     distributor tier.

3. **Only Pulse91 has a real permission catalog.** If a unified permission story is
   ever wanted, Pulse91's `module × action + per-user override` model is the natural
   template — the other three would need adapters (VAS/FF role-string → module
   grants; Dialer JSON checkboxes → module grants).

4. **Super-admin is inconsistent.** Pulse91 `platform_super_admin` = *narrow*
   container governance (NOT all business data). VAS `SUPER_ADMIN` = *broad* global
   bypass. Dialer/Field Force have **no** super tier. → If a P91-wide "Super Admin"
   is desired, each app needs its own change; there is no single switch.

5. **Assignment philosophy splits three ways.**
   - *Pincode/territory match* → Pulse91 & Field Force (geographic).
   - *Config-as-data flow graph* → Dialer (pipeline routing, round-robin).
   - *Priority allocation to partners* → VAS (`allocations`).

6. **Lead ownership sits in ERPNext for 3 of 4 apps** (Pulse91, Dialer, Field
   Force mirror/reference it); only VAS owns its primary resource (job cards)
   locally.

7. **Two schema-management styles.** Pulse91 & Field Force use numbered SQL
   migrations (auditable history). VAS & Dialer use Drizzle `push` (schema file is
   truth; history lives in git + ad-hoc scripts) — role/permission changes there are
   harder to trace chronologically.

---

## 7. Where each app defines its roles (quick index)

| App | Authoritative role list | Enforcement entry point |
|---|---|---|
| Pulse91 | `internal/db/migrations/0002_seed_rbac.up.sql:21-32` | `internal/httpapi/middleware.go` `requirePerm()` |
| VAS | `shared/schema.ts:21-32` (`user_role` enum) | `server/middleware.ts:51-63` `requireRole()` |
| Dialer | `apps/api/src/db/schema.ts:29` + `db/seed.ts:22-27` (flow) | `apps/api/src/auth/session.ts:125-135` |
| Field Force | `backend/src/constants/roles.ts:8-14` | `backend/src/middleware/permissions.middleware.ts:8-22` |

---

*Point-in-time snapshot; verify `file:line` against current code before acting.*
