# VAS (SetuPPF) → Pulse Integration Plan

> How the "show VAS" toggle in Pulse User Management provisions a user into the Pulse VAS portal
> (SetuPPFPortal), and how that person then reaches VAS. Everything in §1–§2 is verified against
> code at the cited file:line (2026-07-21). Repos:
> - **Pulse (Go)** — `D:\p91\p91\p91web\P91pulse` (chi + JWT cookie, React FE in `web/`)
> - **VAS** — `D:\p91\p91\p91web\SetuPPFPortal` (Express + Drizzle, JWT bearer)
> - **Stage TS reference** — `D:\p91\p91\p91web\p91pulse_stage\artifacts\api-server` (logic we port to Go)

---

## 0. TL;DR

The integration surface **already exists on both ends** — it just isn't connected in the Go backend:

| Piece | Status |
|---|---|
| VAS inbound webhook `POST /api/webhooks/pulse/user-access` | **Live code** — `SetuPPFPortal/server/routes.ts:8991` |
| Pulse FE toggle ("PPF Setu Access" switch, right of the Role column) | **Already rendered** — `P91pulse/web/src/pages/erp/admin/user-management/index.tsx:597,625` |
| Pulse Go route `PATCH /api/users/{id}/ppf-setu-access` | **Wired but inert** — stores metadata only, no webhook (`internal/httpapi/erp_users_handler.go:370-396`) |
| "Open VAS" button on detailer/distributor dashboards | **Already rendered** — plain link to `https://pulsevas.p91india.com/` (`web/src/pages/erp/detailer/dashboard.tsx:97`) |
| Session handoff (SSO) | **Does not exist** anywhere; VAS has no SSO endpoint |

The work = port the stage webhook sender to Go (§3), decide the installer mapping (§6 Q1), and keep
the plain-link handoff for now (§4).

---

## 1. Current mechanics, verified from code

### 1.1 VAS inbound webhook — the provisioning contract

**Endpoint:** `POST /api/webhooks/pulse/user-access` — `SetuPPFPortal/server/routes.ts:8991`
(no auth middleware; protected only by the HMAC signature).

**Signature:** header `x-pulse-signature` = hex HMAC-SHA256 of `JSON.stringify(req.body)` using
`PULSE_WEBHOOK_SECRET` (`routes.ts:8997-9004`; verify logic with `crypto.timingSafeEqual` at
`server/services/pulseWebhookService.ts:53-83`).

> ⚠️ **Fail-open:** if `PULSE_WEBHOOK_SECRET` is unset on the VAS server, signature verification is
> **skipped entirely** (`routes.ts:9001` gate + log at `:9014-9016`; also
> `pulseWebhookService.ts:44-47`). Anyone who can reach the URL can then create partners and
> PARTNER_ADMIN accounts. See §5 safety notes.

> ⚠️ **Signature is over the re-serialized body**, not raw bytes: VAS computes HMAC over
> `JSON.stringify(req.body)` (`routes.ts:9003`). The Go sender must produce JSON whose
> parse→stringify round-trip is byte-identical (see §3.4).

**Replay protection: none.** The only timestamp handling is a console *warning* when
`payload.timestamp` is >5 minutes old (`pulseWebhookService.ts:845-855`). Requests are never
rejected for staleness, and there is no nonce/idempotency key.

**Payload contract** (`PulseWebhookPayload`, `pulseWebhookService.ts:7-38`):

```jsonc
{
  "action": "activate" | "deactivate",          // required
  "user": {
    "name": "…",                 // PARTNER-level: business name (required, :827-829). STAFF: person name
    "username": "…",             // optional, ignored by VAS
    "contactPersonName": "…",    // optional → partner contact + PARTNER_ADMIN user name
    "email": "…",                // REQUIRED always (:814-816) — VAS keys users on email
    "phone": "…",  "mobile": "…",// either accepted (:159, :326)
    "role": "STUDIO" | "INSTALLER",  // PARTNER-level partner type (required, :831-837)
    "partnerId": "…",            // Pulse-side id, accepted but NOT used (:17)
    "address": "…", "city": "…", "state": "…", "pincode": "…", "gstin": "…", "pan": "…", // optional partner fields
    // ---- STAFF-level extension (all optional unless noted) ----
    "userLevel": "PARTNER" | "STAFF",              // "STAFF" switches to the staff path (:106-111)
    "setuRole": "PARTNER_STAFF" | "DETAILING_PARTNER", // required for STAFF activate (:818-824)
    "setuPartnerId": "…",        // AUDIT-ONLY invite tag — never auto-assigns (:27, :434-446)
    "invitedByUserId": "…", "invitedByName": "…", "invitedByRole": "…",
    "territory": { "state": "…", "city": "…", "postalCode": "…" }
  },
  "timestamp": "ISO-8601"        // only warned on, never enforced
}
```

**Response:** `{ success, message, userId?, partnerId?, pendingAssignment? }` — HTTP 200 on success,
400 on `success:false`, 401 on bad signature, 500 on exception (`routes.ts:9025-9036`).

### 1.2 What VAS creates — partner-level payloads (`userLevel` absent or `"PARTNER"`)

`processWebhook` (`pulseWebhookService.ts:88-141`) always calls `ensurePartner` first (`:115`):

1. **Partner lookup** by `displayName === user.name` **OR** `email === user.email` across all
   partners (`:151-155`). Match → update partner contact fields (`:180-190`). No match → **create
   `partners` row** (`type` = payload `role` (STUDIO/INSTALLER), `active: true`,
   `canViewJobCardPrice: false`) + audit log `CREATED_BY_PULSE` (`:192-221`).
2. For a **new** partner, immediately create a **`PARTNER_ADMIN` user**: username = email local
   part, name = `contactPersonName` or derived from email, random 16-char temp password (nanoid,
   bcrypt-hashed), `isActive: true`, linked `partnerId` (`createPartnerAdminUser`, `:246-307`).
   Sends the **welcome email** with a 24-hour password-reset link pointing at
   `${PRODUCTION_URL}/reset-password?token=…` (`sendWelcomeEmail`, `:728-800`) and partner-application
   notification emails to configured admins (`:640-716`).
3. `action: "activate"` with an **existing** user: reactivates (`isActive: true`) and force-sets
   `role: 'PARTNER_ADMIN'` + `partnerId` (`activateUser`, `:328-367`). Already-active → success
   `"User already active"` (idempotent).
4. `action: "deactivate"`: sets the **user** `isActive: false` (`deactivateUser`, `:588-635`). The
   *partner* row stays active. Unknown email → `success:false, "User not found"` (HTTP 400).

> ⚠️ **Quirk:** `ensurePartner` runs *before* the action branch (`:115-130`), so a `deactivate` for
> a never-provisioned name/email still **creates** a partner + PARTNER_ADMIN + welcome email. The
> Pulse sender must therefore never fire `deactivate` for users it never activated (stage already
> guards this — see §3.2 step 3).

### 1.3 What VAS creates — staff-level payloads (`userLevel: "STAFF"`)

`handleStaffActivate` (`pulseWebhookService.ts:422-535`):

- Creates the user with `role = setuRole` (`PARTNER_STAFF` or `DETAILING_PARTNER`),
  **`partnerId: null`** — the `setuPartnerId` invite tag is stored in `pulseMetadata` as
  `requestedSetuPartnerId` and is *audit-only, never auto-assigns* (`:434-446, :489-504`). Response
  carries `pendingAssignment: true`.
- Existing email: refuses to repurpose non-partner-scoped roles (`:450-457`); otherwise idempotently
  reactivates + refreshes role/phone/pulseMetadata without touching working-partner assignments
  (`:462-485`).
- Welcome email with reset link is sent for new users (`:506-509`).
- `handleStaffDeactivate` (`:540-583`): `isActive: false` by email; idempotent.

**Pending-users queue:** unassigned staff surface at
`GET /api/admin/pulse-pending-users` (SUPER_ADMIN/ADMIN, `routes.ts:9044-9063`), and an admin
assigns one-or-more working partners via
`POST /api/admin/pulse-pending-users/:userId/assign` (`routes.ts:9066+`, many-to-many
`partnerStaffAssignments`). UI: sidebar "Users" → `/pulse-pending-users`
(`client/src/components/layout/Sidebar.tsx:45`, page `client/src/pages/pulse-pending-users.tsx`).
Staff→partner scope is resolved **fresh per request**, never baked into the JWT
(`server/auth.ts:40-43, :169-179`).

### 1.4 Outbound from VAS — the staff-invite loop (context)

`server/services/pulseApiService.ts` signs requests with the **same** `PULSE_WEBHOOK_SECRET`
(header `x-setu-signature`, HMAC-SHA256 hex over the JSON body, `:49-51`) and POSTs
`{PULSE_API_URL}/api/integrations/setu/staff-invite` (`:76-84`) with
`{ setuPartnerId?, setuPartnerName?, userRole: 'PARTNER_STAFF'|'DETAILING_PARTNER', email?, setuInviter*, timestamp }`,
expecting `{ success, token?, registrationLink?, expiresAt?, emailSent? }` back. Call sites:
`routes.ts:5729` (staff-initiated "Invite Installer", role locked to `PARTNER_STAFF`) and
`routes.ts:5772` (PARTNER_ADMIN partner-tagged invite).

> **Gap:** no `/api/integrations/setu/staff-invite` receiver exists in the Go backend (or anywhere
> in `p91web` — only the stage-era `DESIGN.md` describes it). Until Pulse implements it, the VAS
> "Invite Installer" / "Pulse invite" buttons will get a 404/timeout against this Pulse. Optional
> step in §5.

### 1.5 How VAS logins/JWTs work

- **Login:** `POST /api/auth/login` (`server/routes.ts:141`), body `{ email, password, oemId? }` —
  email *or username* accepted (`server/auth.ts:66-70`). Response `{ user, token }`.
- **Token:** HS256 JWT signed with VAS `JWT_SECRET`, **expiry 7 days** (`auth.ts:28`,
  `jwt.sign(authUser, …, { expiresIn: '7d' })` at `:218`). Claims = the whole `AuthUser`
  (`auth.ts:30-51`): `id, username, email, phone, role, oemId, dealershipId, showroomId, partnerId,
  allowedStates, name, emailVerified, phoneVerified, profileCompleted, allowedOemIds`.
  Staff `partnerIds` are deliberately **not** in the token (`:40-43`).
- **Client storage:** localStorage `auth_token` + `auth_user` (`client/src/lib/auth.ts:40-41`),
  sent as `Authorization: Bearer …`.
- **Password lifecycle:** webhook-provisioned users never receive a password — they set one via the
  welcome-email reset link (24 h validity, §1.2), then log in at `${PRODUCTION_URL}/login`.
- **No SSO/token-mint endpoint exists.** Also: `server/index.ts` mounts **no helmet, no CSP, no
  CORS, no X-Frame-Options** — relevant to §4(c).

---

## 2. User-type mapping

### 2.1 Pulse role → VAS entity

Pulse role codes (`P91pulse/internal/db/migrations/0002_seed_rbac.up.sql:21-32`):
`platform_super_admin, admin, nsm, rsm, asm, salesperson, distributor, detailer, installer, sales_partner`.
VAS roles (`SetuPPFPortal/shared/schema.ts:21-32`): `SUPER_ADMIN, ADMIN, MANAGER, OEM_ADMIN,
DEALERSHIP_ADMIN, SHOWROOM_MANAGER, SALES_PERSON, PARTNER_ADMIN, PARTNER_STAFF, DETAILING_PARTNER`;
partner types `STUDIO | INSTALLER` (`schema.ts:34`).

| Pulse role | Webhook payload kind | VAS result | Notes |
|---|---|---|---|
| **detailer** | Partner-level, `role: "STUDIO"` | `partners` row (type STUDIO) + **PARTNER_ADMIN** user linked to it | The mainline case. Stage FE defaulted partner type to STUDIO (`user-management/index.tsx:471`). |
| **installer** (independent business) | Partner-level, `role: "INSTALLER"` | `partners` row (type INSTALLER) + **PARTNER_ADMIN** user | What the current Pulse FE/stage toggle sends when admin picks "Installer". |
| **installer** (individual under a studio/partner) | Staff-level: `userLevel:"STAFF"`, `setuRole:"PARTNER_STAFF"` | Unassigned **PARTNER_STAFF** user → VAS admin assigns working partner(s) from Pending Users | The path the VAS invite loop was built for (§1.4). **PO must pick the default — §6 Q1.** |
| (freelance detailing partner via invite) | Staff-level, `setuRole:"DETAILING_PARTNER"` | Unassigned **DETAILING_PARTNER** user, pending assignment | Only reachable via invite flow today; not proposed for the toggle. |
| distributor / sales roles / admin | — | not mapped | Toggle should be hidden for these unless PO says otherwise (§6 Q2). Nothing in VAS forbids it — the stage UI showed the toggle on every row. |

Precision note (from `pulseWebhookService.ts`): **partner-level `role` selects the partner *type*,
never the user role** — every partner-level activate produces a `PARTNER_ADMIN` user (`:280, :343,
:381`). Only staff-level payloads can produce `PARTNER_STAFF` / `DETAILING_PARTNER` users.

### 2.2 Which VAS tabs each role sees

VAS routes have no per-role guards (`client/src/App.tsx:108-233` — every page is just
login-protected); visibility is enforced in the sidebar role lists
(`client/src/components/layout/Sidebar.tsx:39-70`) and per-endpoint `requireRole` on the API.

| VAS role | Sidebar tabs (Sidebar.tsx line) |
|---|---|
| **PARTNER_ADMIN** (detailer / installer business) | Dashboard (:40), Work Orders (:41), Job Cards (:42), Knowledge Hub (:43), Staff Management (:46), Payouts & Earnings (:48), Settings (:69) |
| **PARTNER_STAFF** (installer staff) | Dashboard (:40), Job Cards (:42), Knowledge Hub (:43), Invite Installer (:47), Settings (:69) |
| **DETAILING_PARTNER** | Dashboard (:40), Job Cards (:42), Knowledge Hub (:43), Invite Installer (:47), Settings (:69) |

So "all the VAS tabs relevant to that person open" is automatic: it falls out of the role VAS
assigns during provisioning. Pulse controls *which payload kind* it sends; VAS does the rest.

---

## 3. The toggle: what `PATCH /api/users/:id/ppf-setu-access` must do in Go

### 3.1 What exists today

- **Route (already wired):** `internal/httpapi/server.go:90` —
  `PATCH /api/users/{id}/ppf-setu-access`, guarded by `requirePerm("users_rbac","edit")`.
- **Handler (inert):** `handlePpfSetuAccess` (`internal/httpapi/erp_users_handler.go:372-396`)
  merges `ppfSetuAccess` / `ppfSetuPartnerType` / `partnerId` into `users.metadata` jsonb and
  returns `{success:true}`. The comment at `:370-371` marks the webhook as the pending step.
- **Read side:** `ppfSetuAccess` is surfaced on every user row from `metadata`
  (`erp_users_handler.go:64-75`), so the FE switch state already round-trips.
- **FE (already built, matches the requested UX):** the User Management table has a
  **"PPF Setu Access" column immediately to the right of the Role column**
  (`web/src/pages/erp/admin/user-management/index.tsx:594-600` header; row cells `:620-651`):
  a `Switch` (`:625-634`) plus a STUDIO/INSTALLER `Select` (`:635-649`); toggle handler
  `handlePpfSetuAccessToggle` (`:470-489`) → mutation `PATCH /api/users/{id}/ppf-setu-access` with
  `{ ppfSetuAccess, ppfSetuPartnerType, partnerId }` (`:279-285`). The user-detail page repeats the
  control (`web/src/pages/erp/admin/users-detail.tsx:300-357`). The detailer and distributor
  dashboards show the "Access Pulse VAS Portal" card when `user.ppfSetuAccess`
  (`detailer/dashboard.tsx:82-110`, `distributor/dashboard.tsx:157`).

### 3.2 Target behavior (port of stage `routes.ts:786-862` + `ppf-setu-webhook.ts`)

Reference implementations:
`p91pulse_stage/artifacts/api-server/src/routes.ts:786-862` (route) and
`p91pulse_stage/artifacts/api-server/src/services/ppf-setu-webhook.ts` (sender).

1. **Parse** `{ ppfSetuAccess: bool, ppfSetuPartnerType?: "STUDIO"|"INSTALLER", partnerId?: string }`.
   When enabling and neither the body nor stored metadata has a partner type → 400
   (stage `routes.ts:802-804`).
2. **Load the user** (name, username, email, phone, metadata). **Require a non-empty email when
   enabling** — VAS rejects payloads without `user.email` (§1.1), and Pulse users are phone-first
   (email nullable, phone mandatory — `erp_users_handler.go:64-69, :166-170`). Return 400
   `"user needs an email before VAS access can be granted"` rather than letting VAS 400.
3. **Only call the webhook when the flag actually changes**, and for `deactivate` only if the user
   was previously activated (stage guard `routes.ts:807-811`) — this avoids the §1.2
   deactivate-creates-partner quirk.
4. **Build the payload** exactly as stage did (`ppf-setu-webhook.ts:74-85`):
   ```jsonc
   {
     "action": "activate" | "deactivate",
     "user": {
       "name": <metadata.businessName || user.name>,   // see note below
       "username": <user.username || "">,
       "phone": <user.phone>,
       "email": <user.email>,
       "role": <ppfSetuPartnerType>,                    // "STUDIO" | "INSTALLER"
       "partnerId": <body.partnerId || metadata.ppfSetuPartnerId || "pulse-user-" + user.id>
     },
     "timestamp": time.Now().UTC().Format(time.RFC3339)
   }
   ```
   *Name note:* stage sent the person's `name`, which VAS uses as the **partner business name** and
   as the dedupe key (§1.2). Prefer `metadata.businessName` when present (it is one of the profile
   `metadataKeys`, `erp_users_handler.go:141-146`) and pass the person's name as
   `contactPersonName` — this keeps VAS partner records and dedupe sane.
   *(Staff-level variant, if the PO picks it for installers — §6 Q1: add `userLevel:"STAFF"`,
   `setuRole:"PARTNER_STAFF"`, optional `territory` from metadata state/city/postalCode; VAS then
   ignores `role`/business-name semantics.)*
5. **Sign & send:** `X-Pulse-Signature: hex(hmac_sha256(PULSE_WEBHOOK_SECRET, body))` over the
   **exact bytes** posted; `Content-Type: application/json`; POST to `PPF_SETU_WEBHOOK_URL`; 10 s
   timeout; **1 retry after 5 s** (stage `ppf-setu-webhook.ts:29-30, :126-165`).
6. **On webhook failure:** return 502/500 with the VAS error and **do not flip the flag** (stage
   `routes.ts:821-826`). On success: merge into metadata `ppfSetuAccess`, `ppfSetuPartnerType`,
   `ppfSetuPartnerId`, and `ppfSetuUserId` (from response `userId`, stage `routes.ts:835-837`).
7. **Log every attempt** — stage persisted request/response/success to a `ppf_setu_webhook_logs`
   table (`ppf-setu-webhook.ts:57-65, :93-117`); add an equivalent migration (or at minimum reuse
   `writeAudit` with the response embedded). Also `writeAudit(…, "user.vas_access", …)`.
8. **Idempotency:** VAS activate/deactivate are idempotent by email ("User already active" /
   "already inactive" both return success). Treat VAS `400 {"message":"User not found"}` on
   deactivate as success for our purposes (the end state matches) — or rely on step 3 to never
   send it.

### 3.3 Env vars (names fixed by existing code — do not invent new ones)

| Var | Side | Meaning / precedent |
|---|---|---|
| `PPF_SETU_WEBHOOK_URL` | Pulse Go | Full webhook URL. Stage + P91Elite used `https://pulsevas.p91india.com/api/webhooks/pulse/user-access` (`p91pulse_stage/.env:40`, `P91Elite/.env:12`). |
| `PULSE_WEBHOOK_SECRET` | **Both** | Shared HMAC secret. Already set to the same value in `SetuPPFPortal/.env:8`, `p91pulse_stage/.env:41`, `P91Elite/.env:9` (do not copy the value into docs/code; rotate for prod). |
| `PPF_SETU_PORTAL_URL` | Pulse (new, recommended) | Base URL for the FE "Open VAS" button — currently hardcoded `https://pulsevas.p91india.com/` at `detailer/dashboard.tsx:97`. Expose via `/api/erp/me` or a Vite env. |
| (`PULSE_API_URL`) | VAS | Only needed if/when Pulse implements the staff-invite receiver (§1.4). |

Add to `internal/config/config.go` (`Config` struct at `:14-22`, loader `:27-55`): `PPFSetuWebhookURL`,
`PulseWebhookSecret`, `PPFSetuPortalURL`. Do **not** fail boot when unset — degrade like stage
(warn + toggle returns a clear "integration not configured" error, `ppf-setu-webhook.ts:36-38, :53-71`).

### 3.4 Go/JS JSON canonicalization (the one real footgun)

VAS verifies the HMAC against `JSON.stringify(req.body)` — i.e. Express parses our bytes and
re-stringifies (§1.1). For the signature to survive the round-trip, the Go sender must:

- Marshal the payload **once** and both sign and send those same bytes.
- Use `json.Encoder` with `SetEscapeHTML(false)` (Go escapes `<>&` by default; `JSON.stringify` does not).
- Keep struct field order matching the emitted key order (JS preserves insertion order on re-stringify).
- Avoid floats/omitempty surprises: emit only strings in this payload (the stage payload is all strings).
- Strip the trailing newline `json.Encoder` appends (or use `json.Marshal` + a custom escaper).

Test with a known-secret fixture against a local VAS before pointing at prod.

---

## 4. Session handoff — how the person actually reaches VAS, ranked

There are **two separate accounts** (Pulse row, VAS user keyed by the same email). Provisioning
(§3) creates the VAS account; handoff is how the human gets into it.

### (a) Plain link + separate VAS credentials — **recommended now** ✅
What already exists: the welcome email (§1.2) has the person set a VAS password (24 h reset link),
then Pulse's dashboard/user-row button `window.open('https://pulsevas.p91india.com/')` lands them on
the VAS login. **Zero VAS changes, zero new attack surface**, and the credentials story matches what
the VAS side already emails users. Cost: one extra login, two passwords.

### (b) SSO token handoff — phase 2, needs one small VAS endpoint
Nothing exists today (no token-mint endpoint; VAS JWTs are only minted by `/api/auth/login`).
Minimal design reusing the already-shared secret:

1. **New VAS endpoint** `POST /api/integrations/pulse/sso-token`: verifies `x-pulse-signature`
   (same HMAC pattern as §1.1, but **reject** stale `timestamp` > 60 s and require the secret to be
   configured — fail closed), body `{ email, timestamp }`; looks up the active user by email and
   returns `{ token }` built exactly like `authService.login` does (`server/auth.ts:200-223`),
   ideally with a short custom expiry (e.g. a 5-min single-use handoff token the SPA exchanges, or
   accept the 7 d token for v1).
2. **Pulse Go** `POST /api/users/{id}/vas-sso` (perm-guarded; or self-service `GET /api/me/vas-sso`
   for the dashboard button): server-side call to VAS, returns `{ redirectUrl:
   "https://pulsevas.p91india.com/sso#token=…" }` (URL fragment, so the token never hits VAS server
   logs).
3. **New VAS SPA route `/sso`**: reads `#token`, stores it as localStorage `auth_token`
   (`client/src/lib/auth.ts:40` keys), fetches `/api/auth/me` to populate `auth_user`, then
   navigates to `/dashboard`.

This gives true "click → VAS opens logged-in" with ~1 endpoint + 1 tiny page on VAS. Defer until
(a) is proven and the PO confirms VAS repo changes are in scope (§6 Q3).

### (c) iframe embedding of VAS tabs inside Pulse — **not recommended** ❌
VAS's server sets **no `X-Frame-Options` / CSP `frame-ancestors` / helmet at all**
(`server/index.ts:1-80` — only `express.json` + a logger), so framing is *technically* possible
today. But: VAS auth lives in localStorage on its own origin (third-party storage partitioning in
modern browsers makes the embedded session brittle), the user would still log in inside the frame
absent (b), you'd render VAS's full chrome (its own sidebar) inside Pulse's, and the missing frame
protections are a security hole to be *fixed*, not relied upon. Only revisit as (b) + dedicated
frameable views, which is real VAS product work.

---

## 5. Implementation checklist

**Pulse Go backend (`D:\p91\p91\p91web\P91pulse`)**
1. `internal/config/config.go` — add `PPFSetuWebhookURL`, `PulseWebhookSecret`, `PPFSetuPortalURL`
   (optional-with-warning, §3.3).
2. New `internal/vas/client.go` — `Client.SendUserAccess(ctx, action, payload)` implementing
   §3.2 steps 4–5 and §3.4 (HMAC over exact bytes, `X-Pulse-Signature`, 10 s timeout, 1 retry/5 s),
   returning the parsed `{success,message,userId,partnerId}`.
3. Migration `000X_ppf_setu_webhook_logs` (user_id, action, request jsonb, response_status,
   response jsonb, success, error, created_at) mirroring stage's log table (§3.2 step 7).
4. Rewrite `handlePpfSetuAccess` (`internal/httpapi/erp_users_handler.go:372`) per §3.2. Keep the
   route path and the `requirePerm("users_rbac","edit")` guard (`server.go:90`) unchanged — the FE
   already calls it.
5. *(Optional, closes the VAS→Pulse loop)* `POST /api/integrations/setu/staff-invite` receiver
   verifying `x-setu-signature`, returning `{success, registrationLink, expiresAt}` (§1.4). Without
   it, VAS's "Invite Installer" buttons fail against this backend.

**Pulse FE (`P91pulse/web`)**
6. The switch + partner-type select already sit right of the Role column
   (`user-management/index.tsx:594-651`) — the requested "show VAS next to the designation" UX is
   done. Remaining polish: surface the PATCH error body in the toast (it will now carry VAS
   errors), and optionally relabel the column "VAS Access".
7. Add an **"Open VAS"** affordance on the row when `user.ppfSetuAccess` (small external-link icon
   button → `window.open(PPF_SETU_PORTAL_URL)`), matching the dashboard card
   (`detailer/dashboard.tsx:94-102`); replace the hardcoded URL there with the configured one.
8. Show a hint under the switch when the user has no email ("email required for VAS") and disable
   enabling, mirroring the §3.2 step 2 backend check.

**Ops / safety**
9. **Fail-closed check:** before going live, confirm the VAS deployment actually has
   `PULSE_WEBHOOK_SECRET` set — if unset, VAS skips signature verification on an unauthenticated,
   account-creating endpoint (§1.1). Consider a VAS patch to *reject* (not warn) when unset.
10. Rotate the shared secret for production (the current value is committed in three `.env` files:
    `SetuPPFPortal/.env:8`, `p91pulse_stage/.env:41`, `P91Elite/.env:9`).
11. Remember there is **no replay protection** on the webhook (§1.1) — acceptable for
    activate/deactivate idempotent semantics, but recommend VAS enforce the 5-minute timestamp
    window it already computes (`pulseWebhookService.ts:845-855`).
12. Partner dedupe is by business name OR email (§1.2) — ensure Pulse sends a stable business name
    (`metadata.businessName`) or renames on the Pulse side will spawn duplicate VAS partners.
13. Disabling VAS access deactivates only the PARTNER_ADMIN **user**; the partner and any staff
    remain active in VAS (§1.2 step 4) — see §6 Q4.

---

## 6. Open questions for the product owner

1. **Installer mapping:** when the toggle is turned on for a Pulse `installer`, should VAS get a
   partner-level `INSTALLER` (own business + PARTNER_ADMIN login — what the current UI's
   Studio/Installer dropdown implies) or a staff-level `PARTNER_STAFF` (individual who must then be
   assigned to a partner by a VAS admin from the Pending Users queue)? The code supports both;
   they are very different onboarding experiences.
2. **Toggle visibility:** show the VAS switch only on `detailer`/`installer` rows, or on all roles
   (stage showed it everywhere, incl. distributors)? If distributors qualify, as which partner type?
3. **Handoff ambition:** is separate VAS login (option a) acceptable for launch, and is the VAS
   repo open for the small SSO endpoint (option b) afterwards?
4. **Deactivate semantics:** when VAS access is toggled off for a detailer, should their VAS
   *partner* (and its staff) be deactivated too, or only their login (current behavior)?
5. **Email source of truth:** many Pulse users are phone-only. Is it acceptable to hard-require an
   email before enabling VAS (the webhook needs it, and VAS's welcome/reset flow is email-only)?
