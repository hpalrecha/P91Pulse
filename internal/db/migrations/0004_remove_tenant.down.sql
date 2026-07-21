-- Best-effort revert: recreate the tenant scaffold and backfill every existing
-- row onto a single default tenant (this DB only ever had one).

CREATE TABLE tenants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO tenants (name, slug) VALUES ('P91 India', 'p91');

ALTER TABLE roles ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_code_key;
CREATE UNIQUE INDEX uq_roles_system_code ON roles(code) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_roles_tenant_code ON roles(tenant_id, code) WHERE tenant_id IS NOT NULL;
UPDATE roles SET name = 'Tenant Admin' WHERE code = 'admin';

ALTER TABLE brands ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE brands SET tenant_id = (SELECT id FROM tenants WHERE slug = 'p91');
ALTER TABLE brands ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_code_key;
ALTER TABLE brands ADD CONSTRAINT brands_tenant_id_code_key UNIQUE (tenant_id, code);
CREATE INDEX idx_brands_tenant ON brands(tenant_id);

ALTER TABLE territories ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE territories SET tenant_id = (SELECT id FROM tenants WHERE slug = 'p91');
ALTER TABLE territories ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_territories_tenant ON territories(tenant_id);

ALTER TABLE users ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE slug = 'p91');
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;
DROP INDEX IF EXISTS uq_users_email;
DROP INDEX IF EXISTS uq_users_phone;
DROP INDEX IF EXISTS uq_users_username;
CREATE UNIQUE INDEX uq_users_tenant_email ON users(tenant_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX uq_users_tenant_phone ON users(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX uq_users_tenant_username ON users(tenant_id, lower(username)) WHERE username IS NOT NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id);
