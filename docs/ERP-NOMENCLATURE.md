# ERP ↔ Pulse Nomenclature & Data-Type Reference (short)

> Purpose: keep new-Pulse field names/types **ERP-sync-aligned** for field-level two-way sync.
> This is the condensed version. **Full field-by-field mapping lives in `D:\p91\docs\` and the
> legacy `p91pulse_stage` docs** — especially `ERP-MENTAL-MODEL.md` and
> `docs/data-flow/10-LEAD-LIFECYCLE-AND-PARTNER-FIELDS.md`. Verify against those before wiring sync.
> Built from legacy Go sync code (`backend-go/internal/{erp,syncer,store}`), 2026-07.

## ERPNext (Frappe) conventions we must mirror
- **Fieldnames:** `snake_case`, lowercase. **Custom fields** carry a `custom_` prefix
  (`custom_brand`, `custom_pincode`, `custom_lead_status`); core fields don't (`mobile_no`,
  `email_id`, `territory`, `party_name`).
- **Doctypes:** Title Case with spaces, used verbatim in the REST path — `Lead`, `Opportunity`,
  `Customer`, `Prospect`, `Territory`, `Warranty Registration`, `Sales Partner`,
  `Sales Partner Assigned Lead`.
- **Primary key = the `name` field** (a string). Transactional docs use a naming series
  (`CRM-LEAD-2025-04019`); masters use the title (partner/territory/customer name).
  ⚠️ `name` is unique only **within one ERP source** → always key on **`(erp_source, name)`**
  (P91 ERP and JustSigns ERP share the series).
- **Link field** = stores the target doc's `name` (FK-by-name). `party_name` (Dynamic Link) is the
  ~100%-populated join key back to the Lead/Customer — the dedup key the legacy sync *ignored*
  (root cause of the duplicate-row bug).
- **Timestamps:** every doc has `creation` + `modified` (Datetime). **`modified` is the sync
  cursor** (legacy carries it as text, filters `> cursor`, orders asc, per `(source, doctype)`).
- **Frappe fieldtypes:** Data, Small/Long Text, Select, Link, Dynamic Link, Check (0/1),
  Int, Float, Currency, Percent, Date, Datetime, Attach, Table (child).

## Doctype ↔ our concept
| Our entity | ERPNext doctype |
|---|---|
| User / partner | **Sales Partner** (+ **Customer** for GST/identity) — no ERP "User" mirror; matched by phone-last-10 / email |
| Territory | **Territory** (tree; `parent_territory`, `is_group`) |
| Brand | **Brand** (Link); referenced as `custom_brand` (free text on Pulse side today) |
| Sales-partner routing | **Sales Partner** master + **Sales Partner Assigned Lead** bridge |
| Lead / Customer / Opportunity | **Lead** / **Customer** / **Opportunity** |
| Warranty (installed) | **Warranty Registration**; claims = **Warranty Claim** |

## Slice-1 field mapping (condensed)
| Our column | ERPNext field | ERP type | Note |
|---|---|---|---|
| `users.phone` | `Sales Partner.custom_mobile_no` / `Lead.mobile_no` | Data | **last-10 match** is the natural key; phone is our REQUIRED field |
| `users.email` | `.custom_email` / `Lead.email_id` | Data | |
| `territories.name` | `Territory.name` | Data (PK) | tree node title |
| `territories.parent_id`→name | `Territory.parent_territory` | Link | |
| `territories.level`/`is_group` | `Territory.is_group` | Check | state = ancestor under "India" (ERP `state` field is ignored) |
| `brands.code`/`name` | `Brand` / `custom_brand` | Link | per-partner brand list is a Sales Partner child table |
| (sales partner routing) | `Sales Partner.custom_pincode[]` (child, Int) | Table | **pincode list = the routing key; NOT synced today → greenfield** |

## Modeling cautions carried into our schema
1. Key ERP rows on **`(erp_source, name)`** — never on `name` alone.
2. **Phone is the de-facto natural key** on Lead/partner → store canonical last-10 (we do). 
3. **Field-name drift for the same concept across doctypes** — e.g. `custom_car_model_name` (Lead)
   vs `custom_car_modelname` (Opportunity); `custom_vehicle_type` is Select on Lead, Data on
   Opportunity. Map **per doctype**, don't assume one name.
4. **`modified`** is the sync cursor (Datetime, carried as text).
5. **Sales Partner master (pincode/brand/lead_type routing) is NOT synced** in the legacy system —
   the biggest greenfield item when we build field-level two-way sync.

## Implication for our current schema
Our `sync`-facing tables (leads, etc., later) should add `erp_source` + `erp_name` columns and key on
the pair. Our Slice-1 tables (users/roles/brands/territories) are Pulse-native masters; the ERP
adapter will map to/from them per the table above when the connector is built (see DESIGN.md §S2/S4).
