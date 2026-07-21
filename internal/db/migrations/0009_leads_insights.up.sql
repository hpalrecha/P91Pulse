-- 0009_leads_insights — date + funnel support for the interactive leads panel.
--   * customers.erp_created = the ERP `creation` timestamp (the real "lead came
--     on" date; created_at is only our sync insert time).
--   * erp_customers gains the Lead/Opportunity back-links (conversion terminal).
--   * erp_sales_orders is a light Sales Order mirror for funnel counts/amounts.
ALTER TABLE customers ADD COLUMN erp_created timestamptz;
CREATE INDEX idx_customers_erp_created ON customers(erp_created);

ALTER TABLE erp_customers ADD COLUMN lead_name text;
ALTER TABLE erp_customers ADD COLUMN opportunity_name text;
CREATE INDEX idx_erp_customers_lead ON erp_customers(lead_name) WHERE lead_name IS NOT NULL;

CREATE TABLE erp_sales_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_name         text NOT NULL,
  customer         text,           -- ERP Customer docname
  grand_total      double precision,
  status           text,
  transaction_date text,
  erp_source       text NOT NULL DEFAULT 'p91',
  erp_modified     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (erp_source, erp_name)
);
CREATE INDEX idx_erp_so_customer ON erp_sales_orders(customer);
