-- 0008_erp_customers — mirror of the ERP Customer doctype (the platform's
-- user base: detailers/distributors/installers as CUSTOMERS, per dashboard
-- goal 1.1). End User / P91 Car Care groups are B2C consumers and are
-- filtered out at sync time, not here.
CREATE TABLE erp_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_name      text NOT NULL,             -- ERP docname
  customer_name text NOT NULL DEFAULT '',
  customer_group text,
  territory     text,
  mobile        text,
  email         text,
  disabled      boolean NOT NULL DEFAULT false,
  erp_source    text NOT NULL DEFAULT 'p91',
  erp_modified  text,
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL, -- provisioned login
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (erp_source, erp_name)
);
CREATE TRIGGER trg_erp_customers_updated BEFORE UPDATE ON erp_customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
