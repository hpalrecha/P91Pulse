-- 0010_lead_only — the Lead becomes the single operational record.
-- Opportunity is no longer merged into customers; it lives in its own light
-- mirror for the downstream funnel/linkage (docs/ERP-PIPELINE-MAP.md).
CREATE TABLE erp_opportunities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_name         text NOT NULL,
  party_name       text,            -- the Lead docname when opportunity_from='Lead'
  opportunity_from text,            -- Lead | Prospect | Customer
  status           text,            -- Open | Quotation | Converted | Lost | Closed | Replied
  opportunity_type text,            -- Sales | End User (coarse; NOT the lead's type)
  brand            text,
  erp_source       text NOT NULL DEFAULT 'p91',
  erp_modified     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (erp_source, erp_name)
);
CREATE INDEX idx_erp_opp_party ON erp_opportunities(party_name) WHERE party_name IS NOT NULL;
