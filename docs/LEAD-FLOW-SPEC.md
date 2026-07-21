# Lead Management — Business Spec (owner walkthrough 2026-07-21)

> Source: product owner's verbal flow + live ERP reads (erp.plus91inc.in, verified 2026-07-21).
> This is the authoritative theory for the Lead Management tab in P91pulse.
> A Lucidchart with the full flow (esp. B2B) is to be provided — reconcile when received.

## 1. Core entities & the Users-vs-Sales-Partner distinction

| Concept | ERP home | Meaning |
|---|---|---|
| **Sales Partner** | `Sales Partner` doctype (105: 90 Detailer / 9 Distributor) | **ACTIVE** partner who *receives leads*. Distributor → owns a **pincode list** (`custom_pincode` child table). Detailer → has **lat/long** (`custom_lat_long`); serves a **5 km radius**. Also has `custom_brand` + `custom_lead_type` child tables. |
| **Customer (CAD/CDC)** | `Customer` doctype | **Users of the platform, NOT active lead receivers.** CAD = distributor-type user; CDC (and CWC/CAS family) = detailer-type user. They *may* be promoted to Sales Partner later (by NSM/admin) and then start receiving leads. |
| **B2C end user** | groups `End User`, `P91 Car Care`, `Individual` | The consumer. P91-CC brand is B2C-only. |

**Users tab ≠ Sales Partner tab** (two different tabs). Only Sales Partners get leads.
Detailer simplification (Pulse-side): precompute, for each detailer, the **set of pincodes covered
by the 5 km radius** around their lat/long, and store it — assignment then becomes pure
pincode-set matching for both partner types.

## 2. Assignment model (PULSE COMPUTES IT — decided)

Pulse itself runs the pincode→partner matching (same logic ERP uses; ERP's auto-assign also
exists — both can set it, Pulse is the operational surface).

A lead is **Assigned** when:
- its pincode ∈ some **distributor's** pincode list, OR
- it falls within **5 km** of a **detailer** (⇒ pincode ∈ detailer's precomputed pincode set).

The lead's **"Partner Assigned"** field (ERP: additional info section / `custom_lead_status`,
partner via `Sales Partner Assigned Lead` bridge) records the assigned Sales Partner.

A lead is **Unassigned** when: no territory, **no pincode** (most common — only 4.5k of 29k leads
have one), or pincode hits no partner's set. **Every unassigned lead goes to the salesperson.**

## 3. B2C lifecycle & the salesperson's job

**Salesperson's job = turn Unassigned into Assigned.** He enriches, on a call:
1. **Pincode** (the key prerequisite),
2. **Brand** (can change — e.g. lead came for P91 CC, no coverage → switch to P91 India and
   re-check coverage),
3. **Lead type** (B2C/B2B actor),
(phone is always present from the start).

**Lead table statuses** (worked by salesperson):
- `Lead` — raw, just arrived (always Not Assigned; verified 0 exceptions in ERP)
- `Open` — being worked
- `Replied` — talk done, waiting on next step
- `Interested` — needs a follow-up / ToDo
- `Do Not Contact` / not interested — closed
- → **`Opportunity`** — the moment the pincode is obtained the lead is promoted; it moves to the
  **Opportunity table** (a separate list).

**Opportunity table** (worked by detailers & distributors — and RSM/ASM):
- Assigned/Unassigned is a second layer *on top of* Opportunity status (ERP data confirms they are
  NOT lockstep: 5,853 of 6,409 Opportunities are still flag-Not-Assigned).
- If an Opportunity has a pincode but no partner match, the **salesperson** keeps working it
  (brand switch, etc.). **Only RSM and NSM can manually force-assign** a lead to a specific
  distributor/detailer (in addition to the auto-assignment).
- Assigned leads surface in the **distributor + ASM dashboards**. If they can't make it work →
  status **Lost** (in Opportunity) → it goes **back to the RSM**.

**Opportunity statuses:** `Open`, `Quotation` (quotation created), `Replied` (quotation sent to
the customer), `Lost`, `Converted`.

**Beyond Converted** (Quotation → Sales Order → Customer): OUT OF SCOPE for the tab's workflow,
EXCEPT:
- a **"Create Quotation" button** on an Opportunity (link out to ERP, or an in-Pulse form with
  ALL the ERP quotation fields, easy to read, syncing to ERP),
- show that a Quotation/Sales Order exists + the **Sales Order amount** — **visible to NSM and
  admin ONLY**. Lower roles can convert / create a sales order but never see totals/summaries.
- P91-CC salespersons additionally work opportunities end-to-end (quotation + convert) themselves.

## 4. Visibility & hierarchy (pincode-based)

| Role | Pincode coverage | Notes |
|---|---|---|
| **NSM** | ALL India | sees everything; all distributor (CAD) B2B leads go to NSM only |
| **RSM** | pincodes of his territory | can force-assign to partners; receives bounced (Lost) leads |
| **ASM** | **inherits all pincodes of his distributor** | assigned-to-distributor leads appear in his dashboard too |
| **Salesperson** | works the unassigned pool | enrichment + promotion Lead→Opportunity |
| **Distributor / Detailer (Sales Partner)** | own pincode set / 5 km set | work their assigned Opportunities |

Status can be changed by anyone whose queue the lead is in — the *status vocabulary* itself is the
tracking mechanism ("who worked this lead and where is it now").

## 4A. Lucidchart "Lead Management" — reconciled flow (read 2026-07-21)

> Doc: lucid.app/lucidchart/4d7eccd2-8cb7-46b7-8439-eaec1e5c0c3c. Confirms §2–§4 and pins these rules:

**Stage 1→2 (intake):** Users (End User/Detailers/Distributor/Installers/Others) → leads generator
→ middleware+analytics (spam/bot filter) → ERP as `LEAD` → **assignment decision**:
Assigned → role dashboards (Admin/RSM/NSM/ASM/Distributors/Detailers; dependency = 1. B2C vs B2B,
2. Brand, 3. Pincode) · Unassigned → lead DB (`status - lead,open`).

**Salesperson status decision (B2C, verbatim from chart):**
1. `OPEN` / 2. `NOT INTRESTED` / 3. `DO NOT CONTACT` → stays in the lead table;
4. `INTRESTED` → follow-up store ("called but follow-up needed", Tasks/ToDo);
5. `OPPORTUNITY` **with comments/remarks** → surfaces in the role dashboards.

**Stage 3 (pincode matching cases):**
- **Case 1 B2C:** PINCODE matched → `Detailer/Oppo` (= Assigned and Opportunity). Not matched →
  salesperson (= Unassigned and Opportunity) → asks customer about a similar brand/service →
  YES: set `Brand = P91/STEK/JS and same customer group` and re-match · NO: **Status = LOST with
  Reason**.
- **Case 2 B2B (any lead status):** PINCODE matched → split by actor:
  **CAD → NSM** · **Detailer → RSM and distributor** · **Installer → Detailer**.
  PINCODE not matched → **NSM**.
- Chart note: *"In any case the designated RSM and ASM are updated with the lead data in their
  dashboard according to the territory"* (visibility rule).

**ERP document pipeline (chart bottom strip):**
`leads → (B2B) Prospects → Opportunity → quotation → Sales Order → Customer`; **B2C skips
Prospects** (leads → Opportunity directly). Owner's note on the chart: the Opportunity→Quotation
link may in practice be Opportunity→**Sales Order** ("the list is not connected from opportunity
to quotation instead sales order is there") — verify in ERP.

**Onboarding note (chart, verbatim intent):** invite link to detailer/distributor → they fill the
form → shown to admin/**NSM only** → on accept, the lead becomes a Pulse **user** and an ERP
**Customer**.

**Legends:** Brands = P91 CC, P91 India, Stek, Just Sign. Lead data = user details, vehicle
details, business details, job opportunity.

## 5. B2B flow (verbal version — see §4A for the chart's routing table)

- B2B lead → becomes **Prospect** → when a **Sales Order is created from the Prospect** it becomes
  an **Opportunity** (that's the Prospect↔Opportunity relation) → can become a Customer.
- In the Prospect/Opportunity list the **customer group is tagged**: `CAD` = distributor,
  `CDC` = detailer (retailer).
- **Routing:** detailer-type B2B lead → goes to the **distributor** (whose pincodes cover it).
  Distributor-type (CAD) lead → goes to **NSM only** (not RSM).
- **Onboarding:** the distributor has permission (User Management) to convert a detailer lead into
  a platform user: he sends the **Pulse onboarding form** (exists in P91Elite & p91pulse_stage) →
  the filled form appears under **Webforms** for **NSM/admin approval** → on approve, the lead
  becomes a **user**, seated in the hierarchy under whoever originated it
  (distributor → detailer → installer).
- NSM/admin can further promote a user to **Sales Partner** (assign pincodes / lat-long) — from
  then on they receive leads.

## 6. Sync model (decided)

- **Pull** ERP → Pulse (leads/opportunities/partners) — Pulse works on the data during the day.
- **Writeback Pulse → ERP in a nightly batch** (single push at a decided time), not real-time.
- Everything done in Pulse must eventually sit in ERP (ERP remains the system of record).

## 7. Verified ERP facts backing this spec (2026-07-21 live reads)

- Leads 29,193: status Lead 7,205 · Open 5,255 · Replied 242 · Opportunity 6,409 · Prospect 2,958 ·
  Do Not Contact 2,713 · Interested 116 · Converted 793 · Quotation 6.
- `custom_lead_status`: Assigned 568 / Not Assigned 28,625. `status=Lead ∧ Assigned` = 0.
- `Lead.type`: End User 18,614 · Client 358 · Channel Partner 17 · blank 7,186.
- Only 4,528 leads have `custom_pincode`.
- Customers by group: CDC 953 · P91 Car Care 808 · CAD 19 · (End User/Individual few).
- Sales Partner: 90 Detailer / 9 Distributor; child tables `custom_pincode(pincodes)`,
  `custom_brand(brand)`, `custom_lead_type(lead_type)`; scalar `custom_lat_long`.
- Working ERP creds: `P91Elite/.env` (stage `.env` token is rotated/dead).

## 8. Open points (small)

1. Exact meaning of the acronyms CAD/CDC/CWC/CAS (cosmetic — mapping itself is confirmed).
2. Lucidchart for the B2B flow — reconcile §5 when provided.
3. Nightly writeback time & conflict policy (what if ERP changed the same lead during the day).
4. Salesperson pool: single pool vs per-brand split (P91-CC salespersons behave specially per §3).
5. Detailer 5km→pincode precompute: source of the pincode centroid dataset.
