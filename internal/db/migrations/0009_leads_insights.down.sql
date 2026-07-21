DROP TABLE IF EXISTS erp_sales_orders;
ALTER TABLE erp_customers DROP COLUMN IF EXISTS opportunity_name;
ALTER TABLE erp_customers DROP COLUMN IF EXISTS lead_name;
ALTER TABLE customers DROP COLUMN IF EXISTS erp_created;
