-- 0006_leads — the leads/customers data layer (ported from p91pulse_stage).
-- Design notes:
--   * `customers` is the operational lead record (Lead + Opportunity collapsed),
--     mirrored from ERPNext by the Go syncer and written back on lifecycle events.
--   * UUID PKs throughout (consistent with users/brands); ERP identity is carried
--     as (erp_source, erp_opportunity_id | erp_lead_id) with partial-unique indexes
--     so incremental upserts are idempotent.
--   * detailer_id / distributor_id reference users(id) — assignment resolves an ERP
--     partner (phone/email) to a Pulse user at sync time. ON DELETE SET NULL so a
--     user removal never deletes leads.

-- customers (the lead record) ----------------------------------------------
CREATE TABLE customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL DEFAULT 'Unknown',
  phone              text,
  email              text,
  city               text,
  territory          text,
  state              text,
  status             text NOT NULL DEFAULT 'new',
  brand              text,
  lead_source        text,
  lead_type          text,
  remarks            text,
  vehicle            text,
  vehicle_brand      text,
  vehicle_model      text,
  alternate_phone    text,
  loss_reason        text,
  lead_score         double precision,
  assignment_status  text NOT NULL DEFAULT 'Not Assigned',
  is_frozen          boolean NOT NULL DEFAULT false,
  call_status        text,
  disposition        text,
  prospect_name      text,
  customer_group     text,
  custom_pincode     text,
  detailer_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  distributor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by         text,
  assigned_to        text,
  erp_source         text,
  erp_opportunity_id text,
  erp_lead_id        text,
  erp_modified       text,
  external_id        text,
  external_source    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_customers_erp_opp ON customers(erp_source, erp_opportunity_id)
  WHERE erp_opportunity_id IS NOT NULL;
CREATE UNIQUE INDEX uq_customers_erp_lead ON customers(erp_source, erp_lead_id)
  WHERE erp_lead_id IS NOT NULL;
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_detailer ON customers(detailer_id);
CREATE INDEX idx_customers_distributor ON customers(distributor_id);
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_customers_updated ON customers(updated_at DESC);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- lead_history (status/assignment audit trail) ------------------------------
CREATE TABLE lead_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event       text NOT NULL,
  from_status text,
  to_status   text,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  note        text,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_history_customer ON lead_history(customer_id);

-- lead_comments -------------------------------------------------------------
CREATE TABLE lead_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  comment     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_comments_customer ON lead_comments(customer_id);

-- audit_logs (cross-entity action log) --------------------------------------
CREATE TABLE audit_logs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  action    text NOT NULL,
  entity    text,
  entity_id text,
  detail    jsonb,
  at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_at ON audit_logs(at DESC);

-- erp_sync_state (incremental cursor per source+doctype) --------------------
CREATE TABLE erp_sync_state (
  source        text NOT NULL,
  doctype       text NOT NULL,
  last_modified text,
  PRIMARY KEY (source, doctype)
);
