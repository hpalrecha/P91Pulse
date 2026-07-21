# ERP Pipeline Map — Lead → Sales Order/Customer (verified live 2026-07-21)

> Read-only probe of erp.plus91inc.in (P91 ERP only; JustSigns ERP excluded — not set up).
> This is the relation map behind the Lucidchart flow (`leads →(B2B) Prospects → Opportunity →
> Quotation → Sales Order → Customer`; B2C skips Prospect). Counts are point-in-time.

## Doctypes & live counts

| Doctype | Count | Company |
|---|---:|---|
| Lead | 29,205 | all "Plus Nine One Inc" (single company; brand is the real split) |
| Prospect | 3,089 | |
| Opportunity | 9,491 | |
| Quotation | 1,070 | |
| Sales Order | 2,110 | |
| Customer | 1,806 | |

## The links (verified field-by-field)

```
Lead (29,205)
  ▲ party_name (Dynamic Link)          ← THE dedup key
Opportunity (9,491) — opportunity_from: Lead 9,311 · Prospect 76 · Customer 104
  · party_name = CRM-LEAD-xxxxx docname when from='Lead' (set on ALL 9,491)
  · custom_lead_id (Link→Lead) only on 1,612 — SPARSE, do not rely on it
  ▲ opportunity (Link→Opportunity, header field; set on 229)
Quotation (1,070) — quotation_to: Lead 213 · Customer 854 (party_name dynamic)
  ▲ items.prevdoc_docname (→Quotation)
Sales Order (2,110) — header customer→Customer (no direct lead link)
Customer (1,806) — lead_name→Lead (789) · opportunity_name→Opportunity (764) ·
  prospect_name/custom_from_prospect→Prospect (4)
Prospect (3,089) — customer_group tags the B2B actor: CDC 1,375 · CWC 666 · CSC 237 ·
  Car Dealership 222 · CAS 146 · CAD 24 · Installers 5 · blank 397
  · child tables: leads (Prospect Lead), opportunities (Prospect Opportunity), notes
```

## Consequences for Pulse (the fixes)

1. **A "lead" is ONE logical record.** A Lead that became an Opportunity is the SAME person:
   merge by `Opportunity.party_name → Lead.name` when `opportunity_from='Lead'` (9,311 of 9,491).
   Storing them as two rows inflated Pulse totals (38k vs ERP's 29,205). Fixed in the syncer:
   the Opportunity pass upserts keyed on `(erp_source, erp_lead_id=party_name)` so the
   Opportunity data lands ON the Lead row (sets erp_opportunity_id + status on it).
   Only the 180 non-Lead-origin opportunities remain standalone rows.
2. **Status on the merged row** = the furthest stage: once an Opportunity exists, its status
   (Open/Quotation/Converted/Lost/Replied/Closed) is the lead's current status.
3. **Customer.lead_name / opportunity_name** are the conversion terminals — usable later to
   stamp converted leads with their Customer + Sales Order totals (admin/NSM-only view).
4. **Quotation→Sales Order** ride `Quotation.opportunity` + `SO items.prevdoc_docname`; sparse
   (229/1,070 quotations carry the opportunity link) — expect gaps when surfacing SO amounts.
5. Lead count delta vs the ERP list view (29,205 API vs ~28,631 in the UI list): the UI list
   applies its own saved filters; `disabled=1` is 0, so the delta is view-side, not data-side.
