# P91 Pulse — Living Design Document

> The single, evolving source of truth for the **P91 Pulse redevelopment**.
> Business-first. Updated as we discuss — new information integrates into the existing model
> rather than being appended as contradictions.
>
> **Stack (fixed):** React + Vite + TypeScript (frontend) · Golang (backend) ·
> PostgreSQL/Neon (db) · REST · modular backend · RBAC · event-driven sync where appropriate.
>
> **Working rule:** documentation / planning only right now — no code.

**Legend for every claim below:**
`[U]` stated by user (authoritative for the new build) ·
`[I]` inferred, needs confirmation ·
`[Q]` open question ·
`[!]` conflict / tension to resolve ·
`[L]` from legacy system (old behaviour — NOT auto-adopted).

_Last updated: 2026-07-14 · Session 1_

---

## Business Overview

`[U]` **Pulse is the central operational platform ("operating system") of P91's business** — not
merely a lead-management tool. It is the **mother tracking system for both leads and stock**.

`[U]` Pulse is described as **"a basic representation of ERP to a certain extent"** — it has an
**indirect connection** through which leads and users can *also* enter (i.e. Pulse is not the sole
point of origin; leads/users can flow in from outside).

`[!]` **Tension to resolve early (source-of-truth / ownership).** The workspace's legacy premise is
"ERPNext is the single source of truth." Here Pulse is framed as a partial representation of ERP
that *also* originates and tracks leads, users, and stock. Before we design anything that
synchronizes, we must pin down **which system masters which entity, and the direction each field
flows.** Sync bugs in the legacy system almost certainly trace back to this being unclear.
→ tracked in **Open Questions Q1**.

Scope of what Pulse manages (per the project brief): Users, Roles, Permissions, Leads, Territories,
Sales hierarchy, Inventory/Stock, Orders, Warranty, Claim Management, Rewards, Dashboards, ERP Sync,
VAS Integration, Dialer Integration. _(This document currently details Users/Roles/Permissions,
Hierarchy, Onboarding, Territories, and Lead distribution. Other modules to follow.)_

### Product positioning — internal platform **AND** a sellable SaaS product  `[U]` **major**

`[U]` "**This product we need to sell as a software solution also.**" Pulse is not only P91's internal
OS — it will be **licensed to other companies**. Therefore:

- `[U]` A **developer / platform super-admin** tier exists **above** the client's own admin. It
  **controls which tabs exist and what data flows into them** — i.e. modules and their data sources
  are **configurable per customer**, not hard-coded.
- `[I]` This implies **multi-tenancy**: each customer company is a **tenant** with its own users,
  data, branding, and enabled module/integration set. Tenant isolation becomes the **outermost**
  boundary — above brand, above territory.
- `[!]` **This reframes the ERP-vs-Pulse tension (Q15) decisively.** A product sold to *other*
  companies **cannot depend on P91's ERPNext** as its source of truth. Pulse must be **self-sufficient
  and own its own data + routing**, with ERPNext (and the marketing bot, and the dialer) reduced to
  **optional, per-tenant connectors**. → strong lean: **Pulse owns lead routing/assignment; ERP sync
  is an adapter, not the master.** Needs your explicit confirmation (Q15).

**Revised outer→inner isolation model (proposed):**
```
Tenant (customer company)         ← SaaS boundary; platform super-admin configures modules/data per tenant
  └─ Brand (STEK, P91CC, P91India, JS…)   ← data-isolation boundary WITHIN a tenant
       └─ Territory (geographic tree)      ← routing/visibility scope WITHIN a brand
            └─ Users / Leads / Stock / …
```

### Integration scope changes stated this session  `[U]`

- **Warranty MOVES into Pulse.** Warranty currently lives in SetuPPF (Pulse VAS); it will be **shifted
  to Pulse** and Pulse becomes the warranty owner. → **Q20**.
- **SetuPPF (Pulse VAS) integrates with Pulse** for **common tabs** with shared data flow (SetuPPF
  today runs on a *separate* Neon DB `setuppfportal_managed` and already has a `PULSE_API_URL`). We
  must decide which tabs are "common" and how data is shared (shared DB? API? events?). → **Q21**.
- **Dialer API integration** into Pulse (telephony/calling). → **Q22**.

---

## Stakeholders

| Stakeholder | Nature | Notes |
|---|---|---|
| **Admin** | Internal (P91) | Super-authority. Approves onboarding, controls every user's permissions. |
| **NSM** — National Sales Manager | Internal sales hierarchy | Top of the field-sales chain; verifies B2B assignments `[U]`. |
| **RSM** — Regional Sales Manager | Internal sales hierarchy | Regional layer. |
| **ASM** — Active Sales Manager | Internal sales hierarchy | Manages/supports distributors in their territory. |
| **Distributor** | External partner | Owns a sales team; receives B2B leads; manages detailers beneath. |
| **Detailer** | External partner | Receives leads (B2C directly); owns installers; the lead-bearing operator. |
| **Installer** | External / freelancer | Executes installs. **Does not receive leads directly.** Can be independent/freelance and can form groups. |
| **Sales Partner** | Converted user | A user promoted to sales-partner status; gets Pulse login + leads for their child territory. |

`[I]` Admin, NSM, RSM, ASM appear to be **internal P91 roles**; distributor, detailer, installer are
**external business partners** who must be onboarded/approved. Sales partner is a **status a user can
be converted into**, not a separate onboarding lane. → confirm in **Q7**.

---

## User Roles (the 7 + 1 groups)

`[U]` Defined user groups: **admin, NSM, RSM, ASM, distributor, detailer, installer** — plus
**sales partner** (introduced as a conversion/status).

Key role-specific rules stated:

- **Admin** `[U]`
  - Can access **any user's tabs**.
  - Can **grant / revoke permissions** per user (see Permissions section — the checkbox matrix).
  - Is the **approval authority** for onboarding forms (distributor / detailer / installer).

- **Distributor** `[U]`
  - Can **add his own sales team directly** (no external approval) and **assign them permissions at
    his own level, in his own dashboard**.
  - To add a **new detailer**, cannot add directly → must **send a form to the detailer**; the
    detailer must **become a Pulse user** (fills the form).
  - Receives **B2B leads**; has a hierarchy in which detailers sit.
  - Gets a **Sales Partner tab** (see Sales Partner section).

- **Detailer** `[U]`
  - Receives **B2C leads directly**.
  - To add an **installer**, the detailer must add him (because that is how work/leads reach the
    installer — via the detailer, not directly).

- **Installer** `[U]`
  - **Does not receive leads directly** — leads go to the detailer; the detailer holds installers.
  - Exists as a **separate user group** because installers can also be **freelancers who join
    independently**.
  - **Installers have groups:** a single person can join, and can also **bring/add more installers
    under him** (installer groups). `[Q]` see Q6.

- **Sales Partner** `[U]`
  - A user **converted into** a sales partner.
  - Gets a **Pulse login** and **leads for their child territory**.
  - Surfaced to the distributor (and at RSM level) via a **Sales Partner tab** showing: how many
    users converted to sales partners, and how many leads are reaching those sales partners.

### The legacy roles you asked me to explain (keep / drop / rename → Q16c)

`[L]` When I flagged the role mismatch, you asked *"what roles are you talking about and at what
level?"* Here is each **legacy** role that is **not** in your stated list, with its apparent level:

| Legacy role | What it appears to be | Level | My recommendation |
|---|---|---|---|
| `salesperson` | An **individual field sales rep** working under an RSM (lived in the `/erp/sales` zone with NSM/RSM). It is the *IC layer of the internal sales chain* — **not** the same as ASM (ASM manages distributors; salesperson chases leads). | Below RSM, internal | **Likely keep** — you may still need an IC sales role. Confirm whether ASM *replaces* it or *coexists*. |
| `end_user` | The **B2C customer/lead as a login** (baseline P91Elite role). | External / customer | **Likely drop** as a *staff* role. If customers never log in, delete it; if they do (warranty tracking?), model separately from staff. |
| `manager` | A **generic manager** role, level undefined in the docs. | Unclear | **Clarify or drop** — ambiguous roles cause RBAC drift. |
| `sales_executive` | Back-office **sales support** staff. | Internal office | Decide as a group (below). |
| `inventory_executive` | **Stock/inventory** desk. | Internal office | ← |
| `operations_executive` | **Operations** desk. | Internal office | ← |
| `accounts_executive` | **Accounts/finance** desk. | Internal office | ← |
| `support_executive` | **Customer support** desk. | Internal office | ← |

`[I]` The five `*_executive` roles look like **internal back-office/functional staff** (not part of
the field-sales hierarchy) — office users with **module-scoped** access (accounts sees finance,
inventory sees stock, etc.). This is exactly the kind of thing the **RBAC matrix** should express as
*roles × modules*, rather than as separate hard-coded enum values. → ties to **Q17**.

---

## Hierarchy

`[I]` Working model of the sales / ownership chain (to be confirmed):

```
Platform super-admin (developer)  ── configures tabs/modules/data per TENANT (SaaS layer)
  │
  ▼
Tenant Admin  (client's super-authority; controls their users' permissions)
  │
  ▼
NSM ──► RSM ──► ASM ──► Distributor ──► Detailer ──► Installer (individual)
                                                          └► Installer Group (installer + sub-installers)
```

`[U]` **ASM confirmed & placed:** ASM is a **new** role (not in legacy). An ASM is **assigned to a
distributor**, and the ASM's job is to **manage and support the distributor(s) in their respective
territories.** → ASM sits **above Distributor, below RSM.** `[Q]` One ASM ↔ many distributors, or one
ASM per distributor? ("assigned to a distributor" reads 1:1, but "distributors ... territories" reads
1:many — confirm.) (Q16b)

`[U]` Two independent-but-related facts about the chain:

1. **Add-your-own-hierarchy rule.** "Any user can add the people below them in the hierarchy" — RSM,
   ASM, distributor, detailer each add their downstream users. `[!]` **But** with a critical
   distinction (below) between *directly adding* vs *form + approval*.

2. **Direct-add vs form-based-add distinction** `[U]`:
   - **Direct add** (no external approval): a distributor adding his **own sales team**.
   - **Form + become-a-Pulse-user + admin approval**: adding a **detailer** or **installer** — because
     these are independent entities that get their **own login and receive leads/work**.

   `[I]` The dividing line appears to be: *"does this new user get their own Pulse login and receive
   leads/work independently?"* If yes → form + approval. If no (internal to the parent's account) →
   direct add. → confirm in **Q3**.

`[Q]` Open hierarchy questions:
- Exact placement of **ASM** relative to distributor (Q4).
- Where **Sales Partner** attaches in the tree (under distributor? under RSM? both?) (Q7).
- Is "distributor's **sales team**" the *same thing* as a "**sales partner**", or two different
  concepts? (They are described with different mechanics — sales team = direct add; sales partner =
  conversion with its own login + child-territory leads.) (Q7).

---

## Business Flow

### Flow A — Onboarding an external partner (distributor / detailer / installer)

```
Applicant fills partner form (distributor | detailer | installer)
        │
        ▼
Form routed to ADMIN  [U]
        │
        ▼
Admin approves ──► applicant becomes a PULSE USER  [U]
```

`[U]` "Whenever they fill the form of distributor, detailer, or installer, the form will come to the
admin, and the admin will allow them to become a part of Pulse."

`[!]` **Overlap to reconcile:** a distributor also "**sends a form to the detailer**" to add one.
So is the onboarding form initiated by the *applicant* themselves, or *pushed by a parent* (e.g.
distributor invites detailer)? Possibly **both paths exist** (self-apply vs invite), converging on
admin approval. → **Q2**.

### Flow B — B2C lead distribution

```
Lead arrives with { territory, pincode, type = B2C }
        │
        ▼
Routed DIRECTLY to the DETAILER for that territory/pincode  [U]
        │
        ▼
Visible to: NSM + RSM of that territory, the Distributor, the Detailer  [U]
```

`[Q]` Which detailer, if a pincode/territory has more than one? Deterministic routing rule not yet
defined (Q5). `[Q]` Is ASM also in the visibility set? (Q4)

### Flow C — B2B lead distribution

```
Lead arrives with { territory, pincode, type = B2B }
        │
        ▼
Routed to the DISTRIBUTOR (whose hierarchy contains the detailer)  [U]
        │
        ▼
Distributor CONTACTS the detailer first  [U]
        │
        ▼
Distributor sends to NSM for VERIFICATION  [U]
        │
        ▼
(verified) ──► assignment proceeds to detailer
```

`[Q]` What exactly does the NSM verify — the detailer's suitability, the lead itself, or the
assignment? And is this verification per-lead or a one-time detailer approval? (Q8)

### Flow D — Sales Partner conversion

```
A user is converted into a SALES PARTNER  [U]
        │
        ▼
Gets Pulse login + receives leads for their CHILD TERRITORY  [U]
        │
        ▼
Distributor (and RSM level) see a SALES PARTNER tab:
   • # users converted to sales partner
   • # leads reaching those sales partners  [U]
```

---

## Database Entities (first-pass, conceptual — not final schema)

| Entity | Purpose | Key attributes (provisional) | Status |
|---|---|---|---|
| **User** | Every actor with a login | id, name, contact, role, parent_user_id (hierarchy), territory_id, status (pending/active), is_sales_partner | `[U]`/`[I]` |
| **Role** | The 8 role types | id, code (admin/nsm/rsm/asm/distributor/detailer/installer/sales_partner) | `[U]` |
| **Permission grant** | The checkbox matrix | user_id, tab_or_form, action(view/add/edit/delete/assign/approve…), granted(bool) | `[U]`/`[Q]` cols TBD |
| **Territory** | Geographic hierarchy | id, name, parent_territory_id, level | `[I]` |
| **Pincode** | Postal routing key | pincode, territory_id | `[I]` |
| **Lead** | Core operational object | id, type(B2C/B2B), territory_id, pincode, status, assigned_user_id, source | `[U]`/`[I]` |
| **PartnerApplication** | Onboarding form | id, applicant, requested_role, invited_by_user_id?, status, approved_by(admin) | `[U]`/`[I]` |
| **InstallerGroup** | Installer + sub-installers | id, lead_installer_id, member_installer_ids | `[U]`/`[Q]` |
| **SalesPartner link** | Conversion + child territory | user_id, converted_by, child_territory_id | `[U]`/`[I]` |
| **Stock / Inventory** | Stock tracking | _undetailed yet_ | `[U]` (mentioned only) |

`[I]` **Hierarchy modelling note:** the sales chain is a classic self-referential tree on `User`
(`parent_user_id`), *constrained by role* (an RSM's parent is an NSM, etc.). We'll need to decide
whether the hierarchy is **pure user-tree**, **territory-driven**, or **both** (a user owns a
territory node, and leads route by territory rather than by explicit parent links). This choice
strongly affects lead routing and visibility. → **Q5 / Q9**.

---

## Relationships

- `User (parent) 1 ── * User (child)` — self-referential sales hierarchy `[I]`.
- `User * ── 1 Role` `[U]`.
- `User * ── 1 Territory` (a user owns/serves a territory) `[I]`.
- `Territory 1 ── * Pincode` `[I]`.
- `Territory 1 ── * Lead` and `Pincode 1 ── * Lead` `[U]`.
- `Detailer 1 ── * Installer`; `Installer` may belong to an `InstallerGroup` `[U]`.
- `Distributor 1 ── * Detailer` (established via form + approval) `[U]`.
- `Lead * ── 1 assigned User` (detailer for B2C; distributor→detailer for B2B) `[U]`.
- `User 1 ── * PartnerApplication` (as applicant and/or as inviter) `[U]`/`[Q]`.
- `Lead * ── * User (visibility)` — a lead is *visible* to a set of hierarchy roles beyond its
  single assignee (NSM, RSM, distributor for B2C) `[U]`. → visibility is **separate from
  assignment**; important for RBAC design.

---

## Permissions (RBAC)

`[U]` **Model:** a **matrix of checkboxes** — rows = **tabs / forms**, columns = **permissions** —
that the admin uses to grant or deny what each user can and cannot do. Admin can open **any user's**
tabs and set this.

`[U]` Delegated permissioning: a **distributor can assign permissions to his own sales team at his
own level, within his own dashboard** — i.e. permission-granting is **not admin-only**; parents can
permission their directly-added subordinates (scoped to their own subtree).

Design questions this raises (to resolve, not assume):
- `[Q]` **Columns/actions:** what is the exact set? (view, add/create, edit, delete, assign,
  approve, export…?) (Q10)
- `[Q]` **Per-user vs per-role:** is every user permissioned individually, or is there a **role
  default template** with **per-user overrides**? Pure per-user at scale is an admin burden and a
  common source of drift. Strong recommendation to design **role-template + override**, but this is
  yours to confirm. (Q11)
- `[Q]` **Delegation bounds:** when a distributor grants permissions to his sales team, is he limited
  to a **subset of his own permissions** (can't grant what he doesn't have)? (standard safe rule) (Q12)
- `[!]` **Visibility ≠ permission.** Lead *visibility* up the hierarchy (NSM/RSM/distributor seeing a
  B2C lead) is a **data-scope** rule, distinct from the tab/form permission matrix. We should model
  these as two layers: (1) **what data you can see** (hierarchy/territory scope) and (2) **what
  actions you can do on a tab/form** (permission matrix). (Q13)

---

## Validation Rules

_(Provisional — to be expanded.)_
- `[I]` A detailer/installer cannot be **active** until **admin approval** of their PartnerApplication.
- `[I]` A B2B lead cannot reach a detailer until **NSM verification** completes.
- `[I]` A delegated permission grant cannot exceed the granter's own permissions (pending Q12).
- `[Q]` A pincode must resolve to **exactly one** routing target for deterministic assignment (pending Q5).

---

## Edge Cases (raised, to be answered)

1. `[Q]` **Pincode with multiple detailers** — how is the single assignee chosen? (Q5)
2. `[Q]` **Pincode / territory with no detailer** — where does an unroutable lead go? (holding queue? distributor? admin?)
3. `[Q]` **Installer freelancer with no detailer parent** — how does an independent installer exist in the tree, and can he ever receive work? (Q6)
4. `[Q]` **Detailer belongs to which distributor for a B2B lead** if the detailer serves areas under more than one distributor?
5. `[Q]` **Frozen leads** (converted/lost, locked from edits) — is this concept carried into the new system? (legacy has it)
6. `[Q]` **A user converted to sales partner** — do they keep their original role too (dual role), or is sales-partner an overlay status?

---

## APIs

_Not yet designed — deferred until entities and flows are confirmed. Will follow REST + modular
boundaries once the RBAC + lead-routing model is locked._

---

## Open Questions (the blocking list)

| # | Question | Why it blocks design |
|---|---|---|
| **Q1** | **Ownership map:** for each entity (leads, users, stock, orders…), which system *masters* it — Pulse or ERP — and which way does each field sync? | Every sync design + the "Pulse as OS vs ERP as truth" tension depends on this. |
| **Q2** | Onboarding form: **self-apply** by the partner, **invite-pushed** by a parent (distributor→detailer), or both? Both converge on admin approval? | Defines PartnerApplication entity + flow. |
| **Q3** | The **direct-add vs form-add** dividing line — is it "gets own login + receives leads"? | Determines which additions need approval. |
| **Q4** | Where does **ASM** sit, and is ASM in the B2C lead **visibility** set? | Completes the hierarchy + visibility rules. |
| **Q5** | **Lead routing determinism:** how is the single detailer chosen for a pincode/territory? Is routing by **user-tree** or by **territory ownership**? | The heart of lead distribution; can't build routing without it. |
| **Q6** | **Installer groups:** how does a group form, and since installers don't get leads, what does a group *receive/execute* (jobs via detailer? via VAS)? | Defines InstallerGroup + its link to work. |
| **Q7** | Is **"sales team"** (direct-add under distributor) the same as **"sales partner"** (conversion + login + child-territory leads), or two distinct concepts? Where does sales partner attach in the tree? | Prevents conflating two different entities. |
| **Q8** | **B2B NSM verification:** what is verified (detailer / lead / assignment), and is it per-lead or one-time? | Defines the B2B flow + status machine. |
| **Q9** | Is the hierarchy a **pure user-tree**, **territory-driven**, or **both**? | Shapes User/Territory schema + all scoping. |
| **Q10** | Exact **permission actions** (matrix columns). | RBAC schema. |
| **Q11** | RBAC: **per-user** grants, or **role-template + per-user override**? | Scalability + maintainability of permissions. |
| **Q12** | Can a parent grant only a **subset** of their own permissions when permissioning subordinates? | Delegation safety rule. |
| **Q13** | Confirm **two-layer** model: data-visibility scope (hierarchy/territory) vs action permissions (tab/form matrix)? | Core RBAC architecture. |
| ~~Q14~~ | **RESOLVED:** Yes — multi-brand, and **`brand` sits above territory** as the isolation boundary. Brands have different geographic footprints: **P91CC = Bengaluru now, expanding to more cities**; **STEK, P91India, JS = all-India**. (Now nested *inside* Tenant per the SaaS model.) | — |
| ~~Q15~~ | **CLARIFIED:** routing logic is **shared/identical** in ERP & Pulse; **two-way sync** desired; **phone-as-PK dropped** (→ surrogate UUID, S1). Remaining forks: **Q15b** (who authoritatively *computes* assignment) + the **sync-model** choice (S2) asked below. | See S1–S4. |
| **Q15b** | Confirm **Pulse computes the assignment** and ERP receives the result (vs both computing independently → divergence). | Prevents routing drift between systems (S3). |
| ~~Q16~~ | **RESOLVED (ASM):** ASM is **new**, sits **above Distributor / below RSM**, assigned to distributor(s) to manage & support them. Remaining: **Q16b** (ASM↔distributor cardinality) and the legacy-roles decision → **Q16c** below. | — |
| **Q16b** | ASM ↔ Distributor cardinality: 1:1 or 1:many? | Territory + hierarchy schema. |
| **Q16c** | The **legacy roles you asked me about** — `salesperson`, `end_user`, `manager`, and 5 `*_executive` roles — keep, drop, or rename each? (I describe each + its level below.) | Locks the final role enum. |
| ~~Q17~~ | **RESOLVED:** **module × action** (max flexibility "for any user, any level, and data"). Confirms the **two-layer** model (Q13): (1) **permission** = {module × action} grants; (2) **data-scope** = tenant/brand/territory/hierarchy row-level visibility. Design as **role templates + per-user overrides** (Q11) so it scales. | — |
| ~~Q18~~ | **ADOPTED BY RECOMMENDATION (correct me if wrong):** **single-tenant live (P91), built multi-tenant-ready** — every table carries `company_id`/`tenant_id` from day one, only P91's rows exist now, adding a customer later = config not rewrite. P91 India = one tenant with 4 brands. | Lowest-risk path; no wasted work. |
| **Q19** | **Per-tenant configurability:** what exactly can the platform super-admin toggle per tenant — modules/tabs, integrations (ERP/dialer/marketing), roles, branding? | Defines the config/feature-flag layer. |
| **Q20** | **Warranty (now a BUILD, not a port — see V2):** confirm Pulse becomes the unified warranty **master** covering registration → certificate → claims, consolidating SetuPPF + legacy-Pulse + STEK-India. Does Pulse now **issue certificates itself**, or still trigger STEK India? Does the job-card `WARRANTY_REGISTRATION` step in SetuPPF call into Pulse? | Defines the warranty module + VAS integration. |
| **Q21** | **SetuPPF "common tabs" (undefined today — V5):** which tabs are shared (Users? Warranty? Dashboard?), and how — shared DB, API, or events? | VAS integration architecture. |
| **Q22** | **Dialer (greenfield — V6):** which dialer/provider, and what integration — click-to-call, call logging onto leads, dispositions, recordings? | Dialer integration scope. |
| **Q23** | **Org-model reconciliation (V1):** do Pulse and SetuPPF become **one unified org model**, or **two models with a mapping** at the shared installer/detailer identities? How do OEM/Dealership/Showroom relate to Brand/Territory/Distributor? | Whether the two systems share a schema or federate. |

---

## Future Improvements

_(Parking lot — not now.)_
- Role-template permission presets to reduce admin load (ties to Q11).
- Audit log of permission changes and lead re-assignments (enterprise expectation).
- Deterministic territory→routing engine as an isolated, testable module.

---

## Role × Responsibility Matrix (first cut)

`[U-rec]` The governance artifact you asked for. **Assumptions flagged** — correct any line and I'll
revise. Roles split into **Platform**, **Internal (P91 staff)**, and **External partners**.

**Role-set decisions (Q16c) — CONFIRMED by user:**
(a) **Salesperson KEPT** but is a **distinct, brand-dependent** role — **required for P91CC**
(converts lead → opportunity **using the dialer**); **may not apply to STEK/P91India/JS** (TBD per
brand). → Roles/workflows are **enabled per brand**, reinforcing the tenant→brand config layer. `[U]`
(b) **`end_user` DROPPED** as a staff role now — customers get **no staff login** (may revisit in
future). `[U]`
(c) **Back-office desks** (Accounts / Inventory / Operations / Support) = **permission templates**,
not hard-coded enum roles. `[U]`
(d) **`manager` DROPPED** (ambiguous). `[U]`
(e) **Sales team ≠ Sales Partner** — two different things (Q7 resolved). `[U]`

| Role | Tier | Primary responsibility (accountable for) | Key powers |
|---|---|---|---|
| **Platform Super-Admin (Developer)** | Platform | The SaaS itself: onboard tenants, enable/disable **modules & integrations per tenant**, platform config. **Not involved in a tenant's business data.** | Tenant CRUD; per-tenant module/integration toggles; global config. |
| **Tenant Admin** | Internal | Everything inside their company: users, permissions, partner-onboarding approval, brands, territories. | Full CRUD within tenant; approve/reject partner applications; grant permissions; configure brands/territories. |
| **NSM** | Internal | National sales performance; **verify B2B assignments**; owns the RSM layer. | View all leads/territories (brand-scoped); manage RSMs; B2B verify; receives unassigned-territory alerts. |
| **RSM** | Internal | Regional performance; owns ASMs + distributors in region. | View/manage region; assign within region; regional dashboards. |
| **ASM** | Internal | **Manage & support the distributor(s)** in their territories. | View assigned distributors' performance; assist onboarding/assignment; area dashboards. |
| **Salesperson** `[U]` **brand-dependent** | Internal | Convert **lead → opportunity** (P91CC, via **dialer**). Enabled per-brand; may be absent for STEK/P91India/JS. | View/update assigned leads; dialer call + disposition; move lead→opportunity; no team management. |
| **Back-office desks** `[Q-c]` (Accounts / Inventory / Ops / Support) | Internal | Their function only (finance / stock / operations / support). | **Module-scoped** access via role template; typically no lead-assignment powers. |
| **Distributor** | External | Own detailer network; **receive B2B leads**; run own sales team; sales-partner growth. | Manage detailers (form+approval); add sales team directly; permission own team; sales-partner tab; scoped inventory/orders. |
| **Detailer** | External | **Receive B2C leads**; convert; manage installers; warranty registration + claims. | View/work own leads; manage installers; raise warranty/claims. |
| **Installer** (& **Group lead**) | External | **Execute installs** (VAS job cards). **Receives no leads.** Group lead manages sub-installers. | Job-card execution in VAS; group lead adds/manages sub-installers. |
| **Sales Partner** | External (converted) | Sell in a **child territory**; own Pulse login. | Receive leads for child territory; limited CRM view. |

`[!]` **Sales team vs Sales Partner (still Q7):** a distributor's directly-added **sales team** and a
**sales partner** are treated as *different* here (team = internal-to-distributor login; sales partner
= converted user with own child-territory leads). Confirm they're distinct.

### Module × Action permission grid (skeleton — the enforced layer)
`[I]` Columns = actions; rows = modules. Cells to be filled per role-template. Legend: **V**iew ·
**C**reate · **E**dit · **D**elete · **A**ssign · **P**approve · **X**=configure/export.

| Module ↓ / Action → | V | C | E | D | A | P | X |
|---|---|---|---|---|---|---|---|
| Users & RBAC | | | | | | | |
| Leads | | | | | | | |
| Territories & Brands | | | | | | | |
| Inventory / Stock | | | | | | | |
| Orders | | | | | | | |
| Warranty | | | | | | | |
| Claims | | | | | | | |
| Rewards | | | | | | | |
| Sales Partners | | | | | | | |
| VAS / Job Cards | | | | | | | |
| Dashboards | | | | | | | |
| Integrations / Config (ERP, Dialer) | | | | | | | |
| Audit Log | | | | | | | |

**Filled — top roles (admin-first, per your "start from the top" path):**

`[I]` Legend: ✔ = allowed. Blank = denied. Data-scope column = which rows this role sees.

| Module | Platform Super-Admin | Tenant Admin | Data scope |
|---|---|---|---|
| Users & RBAC | ✔ V C E D · X (per-tenant module/integration toggles) | ✔ V C E D A P (within tenant) | Platform: all tenants · Admin: own tenant |
| Leads | — *(no business data)* | ✔ V C E D A P | Admin: whole tenant, all brands |
| Territories & Brands | ✔ X *(provision per tenant)* | ✔ V C E X | own tenant |
| Inventory / Stock | — | ✔ V C E D | own tenant |
| Orders | — | ✔ V C E D P | own tenant |
| Warranty | — | ✔ V C E D P | own tenant |
| Claims | — | ✔ V C E D P | own tenant |
| Rewards | — | ✔ V C E D P | own tenant |
| Sales Partners | — | ✔ V C E D A P | own tenant |
| VAS / Job Cards | — | ✔ V (read) A | own tenant |
| Dashboards | ✔ (platform health) | ✔ V (all) | per tier |
| Integrations / Config (ERP, Dialer) | ✔ X *(enable/disable per tenant)* | ✔ X *(configure within tenant)* | per tier |
| Audit Log | ✔ V (platform) | ✔ V (tenant) | per tier |

`[!]` **Key distinction:** the **Platform Super-Admin governs the *container*** (tenants, which
modules/integrations exist, provisioning) but **does not touch a tenant's business data** (leads,
orders, warranty). The **Tenant Admin owns all business data** within their company. This separation
is what makes the SaaS safe to sell — the vendor can't see customers' operational data.

`[I]` Remaining role grids (NSM → RSM → ASM → Salesperson → Distributor → Detailer → Installer →
Sales Partner + back-office templates) get filled the same way as we spec each module. They are
**mostly data-scope narrowing** of the same actions, plus a few role-specific powers (e.g. NSM = B2B
verify/approve; Distributor = manage-detailers + permission-own-team).

---

## Synchronization & Data Ownership

`[U]` **Stated intent (Session 1):** ERP and Pulse are **not different in lead routing** — "ERP also
follows the same logic we are doing," just done better. **Phone-number-as-primary-key feels wrong**
and must change. **Data sync is two-way** — "data from ERP to Pulse and Pulse to ERP will happen at
every table and field of ERP."

### S1 — Identity keys: replace phone-as-PK with a stable surrogate  `[U]` ✅ agreed
`[U]` Phone-as-primary-key is wrong. **Decision:** every entity gets a **surrogate UUID primary
key**; phone becomes a **normalized, indexed attribute** (last-10-digit form), **not** identity.
This directly fixes the legacy **Lead↔Opportunity duplication** (~7,675 unlinked rows) that came from
joining people on phone / `party_name`. `[I]` We'll define a proper **person/contact identity** the
Lead, Opportunity and Customer records all point to.

### S2 — "Two-way sync" done SAFELY = table-level two-way, **field-level single-owner**  `[U-rec]` **ADOPTED BY RECOMMENDATION (correct me if wrong)**
`[!]` **This is the exact area that caused your current "data synchronization issues,"** so I'm
challenging the literal "every field both ways." Syncing the **same field in both directions** creates
update loops, race conditions and conflict-resolution guesswork — the classic sync-bug generator.

**The good news:** you can still get **full two-way sync at the table level** without that danger —
by giving **each field a single owning system** and flowing it **one direction only**:
- e.g. **Pulse owns** assignment/routing, lead status, disposition → flow **Pulse → ERP**.
- **ERP owns** accounting, invoices, official customer master → flow **ERP → Pulse**.
- Net effect: data moves **both** ERP→Pulse *and* Pulse→ERP (your goal), but **no single field is
  written by both sides**, so there are no conflicts or loops.

This requires a **field-ownership map** (per table, per field: who masters it, which way it flows) —
which is also the artifact that finally kills the ambiguity behind the legacy sync bugs. → decision
in the question below.

### S3 — Routing engine: shared logic, single authoritative computer  `[U]`/`[Q]`
`[U]` Routing logic (territory/pincode → detailer/distributor) is the **same** in ERP and Pulse.
`[!]` But if **both** systems compute assignment independently they *will* diverge. **Recommendation:**
implement routing **once** as a Pulse module (the operational OS), and **sync the computed
assignment** to ERP — rather than both computing it. `[Q]` Confirm Pulse is the **authoritative
computer** of the assignment (ERP receives the result), or state otherwise. (Q15b)

### S4 — Reconciling with the SaaS goal  `[I]`
Full ERP mirroring and "sell as SaaS" coexist cleanly if **ERP sync is a per-tenant connector**: for
**P91's tenant** the connector does comprehensive field-mapped two-way sync; for a **new customer
without ERPNext**, the connector is simply **off** and Pulse runs self-sufficiently. Pulse's own
schema stays the master; the ERP adapter maps to/from it.

---

## VAS / SetuPPF Integration (Pulse VAS)

`[L]` From a full read of the SetuPPF docs. SetuPPF is the **install job-cards & payouts** portal —
a *different* system from the lead CRM, with its **own org hierarchy and its own database**.

### V1 — SetuPPF has a DIFFERENT org hierarchy than Pulse  `[!]` **must reconcile**
```
Pulse (lead side):    Brand → Territory → NSM → RSM → ASM → Distributor → Detailer → Installer
SetuPPF (install):    OEM  → Dealership → Showroom → Partner(studio) → PartnerStaff / DetailingPartner
```
- **Distributor / ASM / RSM / NSM have NO equivalent** in SetuPPF; **OEM / Dealership / Showroom
  have no equivalent** in Pulse.
- The **only shared identities** are **installer (= `PARTNER_STAFF`)** and **detailer
  (= `DETAILING_PARTNER`)**. → We must decide the **unified org model** (one shared model vs two
  models with a mapping). → **Q23**.

### V2 — "Shift warranty into Pulse" is a BUILD, not a port  `[!]` **expectation correction**
In SetuPPF, **warranty is barely a feature**: there is **no warranty table, no certificate/PDF, no
warranty-card.** It is only (a) a job-card status `WARRANTY_REGISTRATION`, (b) an admin action
`apply-warranty {warrantyReferenceNumber}` (stores just a reference string), and (c)
`request-e-warranty` which **emails "STEK India"** — the **external vendor that actually issues
certificates.** So warranty today is scattered across **three places**:
- **SetuPPF** — a status + reference number at the tail of the job-card lifecycle.
- **Pulse (legacy)** — a `warranty_registrations` table + Warranty **Claim** sync with ERP (Dir B/C).
- **STEK India (external)** — the actual **certificate issuance.**
→ Moving warranty "into Pulse" means **building a proper unified warranty domain** (registration →
certificate → claims lifecycle) and consolidating those three, **not** lifting a module. → **Q20**
(expanded).

### V3 — Pulse is ALREADY the identity source of truth for SetuPPF  `[L]` (confirms SaaS direction)
A bidirectional **HMAC-signed** handshake already exists:
- **Pulse → SetuPPF:** `POST /api/webhooks/pulse/user-access` (activate/deactivate a partner/installer).
- **SetuPPF → Pulse:** `POST {PULSE_API_URL}/api/integrations/setu/staff-invite` (request a signup link).
- Closed loop: SetuPPF requests invite → person registers/approved **in Pulse** → Pulse webhooks back
  → lands in SetuPPF's **"Pending Pulse Users"** queue → admin assigns to a partner.
→ This **validates "Pulse owns users/identity"** and the whole SaaS-connector model. `[!]` Security
note for the rebuild: today if `PULSE_WEBHOOK_SECRET` is unset, **signature checks are skipped
(wide open)** — the new integration must fail-closed.

### V4 — What stays in SetuPPF vs moves to Pulse (proposed)
| Concern | Proposed owner | Note |
|---|---|---|
| Users / identity / onboarding | **Pulse** | Already true via webhook (V3). |
| **Warranty** (registration, cert, claims) | **Pulse** | Being consolidated (V2). `[U]` |
| Job cards / install execution (18-state lifecycle, photos, batch, rework) | **SetuPPF** | Operational VAS core; not mentioned as moving. |
| Payouts / commissions / OEM royalty (pricing & commission snapshots) | **SetuPPF** | VAS financial engine; not mentioned as moving. |
| "Common tabs" (shared data both sides show) | **shared** | Which tabs? Not defined yet — no such mechanism exists today. → **Q21**. |

### V5 — "Common tabs" is undefined — no such mechanism exists today  `[L]`
The SetuPPF docs have **no "common tabs" concept**; the only shared surface is user-identity sync.
So which tabs are common, and *how* they share data (shared DB vs API vs events), is **ours to
design** (SetuPPF runs on a separate Neon DB today). → **Q21**.

### V6 — Dialer is greenfield  `[L]`
SetuPPF has **no dialer/telephony** at all (only WhatsApp, SES email, SMS OTP). So dialer integration
is **entirely new** — nothing to reuse. → **Q22**.

---

## Legacy Reconciliation (what the OLD system actually does)

`[L]` These facts come from a full read of the legacy `p91pulse_stage` / `P91Elite` docs. They are
**not auto-adopted** — they exist to sharpen our decisions and expose where your description of the
NEW system diverges from legacy reality.

### R1 — Assignment ownership was deliberately moved OUT of Pulse, into ERP  `[!]` **major fork**
In the legacy system, the "pick a distributor/detailer and save" assignment UX **exists in code but
is disabled** (`{false && …}`); the team "pulled assignment out of Pulse's write path in favor of
ERP as source of truth." Today ERP masters the **Sales Partner** doctype and does **pincode-based
auto-assignment** (via a Server Script that is *currently disabled*), and Pulse only **displays** the
resulting assignment read-only.
→ **Your description has Pulse doing the routing** (B2C→detailer, B2B→distributor→NSM-verify). So the
new build appears to **reclaim lead routing INTO Pulse.** This is the single biggest architectural
decision. → **Q15**.

### R2 — `brand` is the real data-isolation boundary — and you didn't mention it  `[!]`
Legacy "golden rule #2": the business runs **4 brands** (STEK, P91 Car Care, …) and **`brand` is the
actual data-isolation boundary** — a missing brand filter *bleeds data across brands*. Your Session-1
walkthrough never mentioned brand. → **Q14** (this is a load-bearing omission, not a detail).

### R3 — The role set doesn't match  `[!]`
- Legacy enum: `admin, distributor, detailer, installer, end_user` **+** `national_sales_manager,
  regional_sales_manager, salesperson, sales_partner, manager` **+** executive roles
  (`sales_executive, inventory_executive, operations_executive, accounts_executive,
  support_executive`).
- **You said:** admin, NSM, RSM, **ASM**, distributor, detailer, installer, sales partner.
- Deltas: **ASM does not exist in legacy** (legacy has `salesperson` at that layer instead).
  Legacy also has **`end_user`, `manager`, and 5 executive roles** you didn't mention. → **Q16**.

### R4 — The RBAC checkbox matrix already exists in legacy — but is a fake  `[L]`
Legacy has exactly the grid you described: a **"User Permissions" checkbox grid** whose columns are
**modules** (`Leads / Inventory / Warranty / Rewards / Users`), saved as opaque JSON. **But it is
client-side-only and never enforced**; the admin RBAC-matrix tab is a **static placeholder**. Real
enforcement lives ad-hoc in server middleware and inline JSX role checks.
→ Two lessons: (a) the columns were **modules, not CRUD actions** — so we must decide the matrix's
real axes; (b) the #1 thing to get right in the rebuild is that **the matrix must actually be
enforced server-side.** → **Q10 / Q17**.

### R5 — Onboarding: the "distributor sends a form to the detailer" = an invite-token flow  `[L]`
Legacy already implements **distributor invite-token generation/redemption** for detailer signup
(`?invite=` token, expiry/usage tracking), a **self-signup wizard** (detailer & installer share one
form via a `userType` toggle; phone is the primary key), and **admin approve/reject/hold** of
applications. This matches your Flow A well and answers much of **Q2** — likely **both** self-apply
and invite paths exist, both converging on admin approval.

### R6 — Hierarchy in legacy is BOTH user-tree AND territory  `[L]`
Legacy uses `users.manager_id` (a self-referential user tree) **and** a `user_territories`
user↔state mapping (reused as the RSM↔state map), with a territory **fallback** branch in
`getCustomersInHierarchy`. So legacy's answer to "user-tree or territory?" is **"both, somewhat
awkwardly."** Useful prior for **Q9** — we should make this deliberate, not accidental.

### R7 — B2C/B2B are genuinely different pipelines in ERP  `[L]`
Legacy: **B2B = Lead→Prospect→Customer**; **B2C = Lead→Opportunity→Customer** (skips Prospect). Real
volumes: STEK's business is its **B2B detailer network** (only 2 of 1,176 STEK B2C leads ever
converted); **P91 Car Care is the actual B2C engine.** This broadly aligns with your "B2C→detailer,
B2B→distributor" split and is worth keeping in mind for lifecycle design.

### R8 — Known legacy data hazards to design AWAY in the rebuild  `[L]`
- **Lead↔Opportunity duplication:** one person becomes **two unlinked `customers` rows** (~7,675
  such pairs) because the syncer never joins on `party_name`. UI hides it with display-only dedupe.
- **Status-vocabulary mismatch:** the Go mapper emits `followedup` but the UI filters for
  `contacted` → a permanently-zero stat and invisible rows. A canonical 8-stage status set was
  *proposed but never implemented.*
- **Frozen leads exist** (`is_frozen`, field-level `locked`/`freezeIfSet`; phone always locked).
- **Unmatched partner assignments are silently dropped** (no queue/retry).
These are concrete "don't repeat this" items for the new design.

---

## Build Status

**Slice 1 — Users + RBAC (backend): DONE & verified against Neon (2026-07-14).**
- Go modular monolith: `chi + pgx + sqlc`, Argon2id passwords, JWT auth, embedded migrations.
- Schema live on Neon `p91pulse`: tenants, brands, territories, roles, permissions (module×action),
  role_permissions, users, user_permission_overrides, user_territories.
- Seeded: tenant **P91 India**; brands **STEK/P91INDIA/JS = national, P91CC = city**; **10 system
  roles**; **104 permissions** (13 modules × 8 actions); role templates per §Role×Responsibility.
- Verified end-to-end via API: login→JWT, `/auth/me` (admin=104 perms), user CRUD, approve/reject,
  enable/disable, password reset, and the **override flow** (distributor 403 on delete → granted
  override → 200, no re-login). See `README.md` for endpoints + run commands.

**Next:** Slice 1 frontend — the Admin **User Management** tab (React+Vite+TS), porting the legacy
UX (filterable table, create/edit dialog, row actions) onto the new API, rebuilt clean/typed.

---

## Multi-tenancy REMOVED (2026-07-15, corrects Q18)

`[U]` **Correction to Q18 / the SaaS discussion:** Pulse is sold as **single-tenant software** —
every customer that buys it gets their **own separate deployment and database**. It is *not* a
shared multi-tenant SaaS where multiple companies log into one portal. Isolation is **physical**
(separate DB per customer), not a `tenant_id` column.

**What changed:**
- Dropped the `tenants` table and every `tenant_id` column (`brands`, `territories`, `roles`,
  `users`) via migration `0004_remove_tenant`. Applied surgically (ALTER, not a DB wipe) — **all
  existing test data survived** (verified: 3 users, brand assignments, phone numbers all intact
  post-migration).
- Uniqueness (email/phone/username) is now **global**, not per-tenant.
- Roles are globally unique by `code`; the seeded `admin` role renamed **"Tenant Admin" → "Admin"**.
- JWT claims, `rbac.Principal`, and every API response **no longer carry `tenant_id`**.
- The **Platform Super Admin** role and its "governs the container, not business data" framing (see
  the Role×Responsibility matrix) still stands conceptually — it's now the role that would exist
  *within* a single deployment if P91 ever needs an internal ops/config layer — but multi-tenant
  provisioning is no longer a real capability it has. Revisit if this role is still needed.
- The Tenant→Brand→Territory isolation model is now simply **Brand→Territory**.

**Why:** simpler schema, no risk of a missed tenant-filter bug (a whole class of bug that can no
longer happen), no unused abstraction. If a future need for shared hosting arises, that's a
deliberate scoped addition then — not paid for now.

---

## Decisions locked in Slice-1 build (2026-07-15)

- **Phone is ALWAYS required** `[U]` (golden rule) — DB `NOT NULL`, API rejects create without a
  valid 10-digit phone, normalized to last-10. Existing phone-less rows backfilled with unique
  placeholders.
- **Brand access is per-user many-to-many** `[U]` — new `user_brands` table. A distributor (or any
  user) may be granted **some, all, or no** brands; the User Management UI assigns them via
  checkboxes and shows them as badges. Replaces the single `brand_id` notion of "the user's brand".
- **`salesperson` is brand-dependent** (P91CC dialer flow) — already noted; reinforced by per-brand
  access model.
- **Permission editor hides `users_rbac`, `territories_brands`, `vas_jobcards`** `[U]` — their flow
  isn't defined yet, so they're excluded from the admin permission grid. (They remain in the backend
  catalog for route gating; not exposed for per-user editing.)
- **Tenant Admin is not assignable** from the Create-User dialog `[U]` (nor Platform Super Admin).
- **Status → an "Approved" toggle** on create `[U]` (approved/pending), mirroring p91_stage; the
  3-state status dropdown is gone from the form.
- **ERP nomenclature reference created** → `docs/ERP-NOMENCLATURE.md` (short; full mapping in
  `D:\p91\docs\` + legacy `ERP-MENTAL-MODEL.md`). Key rule for future sync tables: key ERP rows on
  `(erp_source, name)`, mirror `snake_case`/`custom_` fieldnames, `modified` = cursor.

---

## Change Log

- **2026-07-14 (Session 1, cont. 2):** Major update from your answers: (1) **multi-brand confirmed**,
  brand above territory, with per-brand geography (P91CC=Bengaluru→expanding; STEK/P91India/JS=all
  India) — **Q14 resolved**. (2) **Product will be sold as SaaS** → added Tenant layer + platform
  super-admin + multi-tenancy; reframes ERP-vs-Pulse decisively toward *Pulse owns its data/routing*
  (**Q15** still needs explicit yes). (3) **ASM placed** above Distributor/below RSM — **Q16 (ASM)
  resolved**; added Q16b/Q16c. (4) Documented the legacy roles you asked about. (5) New scope:
  **warranty shifts into Pulse**, **SetuPPF common-tab integration**, **dialer integration** →
  Q20/Q21/Q22.
- **2026-07-14 (Session 1, cont. 5):** User asked to continue on recommendations. **ADOPTED (subject
  to correction):** Q18 = single-tenant-live / multi-tenant-ready; S2 = table-level two-way,
  field-level single-owner sync. Next deliverable: role × responsibility + permission matrix — blocked
  only on the final role-set (Q16c).
- **2026-07-14 (Session 1, cont. 4):** ERP-sync answers → new **Synchronization & Data Ownership**
  section (S1–S4). **Q17 RESOLVED** (module × action + data-scope, role-templates+overrides).
  **Q15 clarified** (shared routing, two-way sync, phone-as-PK dropped → surrogate UUID); flagged the
  **bidirectional-every-field risk** and proposed **table-level two-way / field-level single-owner**
  (S2) + Pulse as authoritative assignment computer (Q15b). Q18 re-explained to user as a choice.
- **2026-07-14 (Session 1, cont. 3):** Folded in SetuPPF (Pulse VAS) extraction → new section
  **V1–V6**. Key findings: SetuPPF has a **different org hierarchy** (OEM→Dealership→Showroom→Partner)
  that must reconcile with Pulse's (Q23); **warranty is barely built in SetuPPF** so moving it to
  Pulse is a **build, not a port** (Q20 expanded); **Pulse is already the identity source of truth**
  for SetuPPF via an HMAC webhook handshake (confirms SaaS direction); **"common tabs" and dialer are
  both greenfield.** Added Q23.
- **2026-07-14 (Session 1):** Initial model from the business walkthrough — user groups, hierarchy,
  onboarding, B2C/B2B lead distribution, sales-partner concept, and the RBAC checkbox-matrix. 13 open
  questions raised.
- **2026-07-14 (Session 1, cont.):** Reconciled against a full read of the legacy
  `p91pulse_stage` / `P91Elite` docs → added **Legacy Reconciliation R1–R8** and four new blocking
  questions **Q14 (multi-brand), Q15 (assignment ownership), Q16 (role-set delta), Q17 (RBAC matrix
  axes)**. Key findings: legacy deliberately moved assignment INTO ERP (you're reclaiming it);
  `brand` is legacy's real isolation boundary (unmentioned so far); the RBAC checkbox matrix exists
  but was never enforced; ASM is a new role vs legacy's `salesperson`.
