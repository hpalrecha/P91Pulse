-- 0007_b2c_flow — Sales Partner mirror + assignment engine + tab support tables.
-- Per docs/LEAD-FLOW-SPEC.md:
--   * sales_partners mirrors the ERP `Sales Partner` doctype (the ACTIVE lead
--     receivers) incl. its pincode/brand child tables. Pulse computes the
--     pincode→partner match itself, so the pincode set is first-class here.
--   * Detailers' 5km radius is represented as pincode rows too (ERP already
--     stores explicit pincodes per detailer; a radius→pincode precompute can
--     append rows later without schema change).
--   * user_states powers RSM/ASM territory visibility (roles that aren't in ERP).
--   * users.metadata carries the per-role profile fields the ported UI edits.

-- sales_partners (ERP Sales Partner mirror) ---------------------------------
CREATE TABLE sales_partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  partner_type    text,               -- 'Detailer' | 'Distributor'
  lat_long        text,
  email           text,
  mobile          text,
  commission_rate double precision,
  territory       text,
  erp_source      text NOT NULL DEFAULT 'p91',
  erp_modified    text,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL, -- resolved Pulse login
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (erp_source, name)
);
CREATE TRIGGER trg_sales_partners_updated BEFORE UPDATE ON sales_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sales_partner_pincodes (
  partner_id uuid NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
  pincode    text NOT NULL,
  PRIMARY KEY (partner_id, pincode)
);
CREATE INDEX idx_sp_pincodes_pincode ON sales_partner_pincodes(pincode);

CREATE TABLE sales_partner_brands (
  partner_id uuid NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
  brand      text NOT NULL,
  PRIMARY KEY (partner_id, brand)
);

CREATE TABLE sales_partner_lead_types (
  partner_id uuid NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
  lead_type  text NOT NULL,
  PRIMARY KEY (partner_id, lead_type)
);

-- user_states (RSM/ASM territory visibility; '*' = all India) ---------------
CREATE TABLE user_states (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state   text NOT NULL,
  PRIMARY KEY (user_id, state)
);

-- vehicle catalog (create-lead dialog) --------------------------------------
CREATE TABLE vehicle_brands (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  vehicle_type text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE vehicle_models (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);

-- per-role profile blob the ported User Management UI reads/writes ----------
ALTER TABLE users ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
