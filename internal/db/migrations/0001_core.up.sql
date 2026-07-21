-- 0001_core — foundational multi-tenant schema for Slice 1 (Users + RBAC).
-- Design notes:
--   * Every business row carries tenant_id  => multi-tenant isolation from day one.
--   * Surrogate UUID primary keys everywhere => phone is an attribute, never identity.
--   * RBAC is module x action (permissions) granted via role templates (role_permissions)
--     with per-user overrides (user_permission_overrides).
--   * Isolation nesting: tenant -> brand -> territory -> users/leads/...

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- updated_at helper ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- tenants -------------------------------------------------------------------
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

-- brands (data-isolation boundary WITHIN a tenant) --------------------------
CREATE TABLE brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  code       text NOT NULL,
  scope      text NOT NULL DEFAULT 'national' CHECK (scope IN ('national','city')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_brands_tenant ON brands(tenant_id);
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- territories (geographic tree, optionally brand-scoped) --------------------
CREATE TABLE territories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id   uuid REFERENCES brands(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES territories(id) ON DELETE CASCADE,
  name       text NOT NULL,
  level      text NOT NULL DEFAULT 'area'
             CHECK (level IN ('national','region','area','city','pincode')),
  pincode    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_territories_tenant ON territories(tenant_id);
CREATE INDEX idx_territories_parent ON territories(parent_id);
CREATE INDEX idx_territories_pincode ON territories(pincode) WHERE pincode IS NOT NULL;
CREATE TRIGGER trg_territories_updated BEFORE UPDATE ON territories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- roles (system templates have tenant_id NULL; tenants may add custom roles) -
CREATE TABLE roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE,
  code       text NOT NULL,
  name       text NOT NULL,
  tier       text NOT NULL CHECK (tier IN ('platform','internal','external')),
  is_system  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- system role codes are globally unique; tenant role codes unique per tenant
CREATE UNIQUE INDEX uq_roles_system_code ON roles(code) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_roles_tenant_code ON roles(tenant_id, code) WHERE tenant_id IS NOT NULL;
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- permissions (the module x action catalog) --------------------------------
CREATE TABLE permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module      text NOT NULL,
  action      text NOT NULL,
  description text,
  UNIQUE (module, action)
);

-- role_permissions (role template grants) ----------------------------------
CREATE TABLE role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- users ---------------------------------------------------------------------
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id        uuid NOT NULL REFERENCES roles(id),
  brand_id       uuid REFERENCES brands(id) ON DELETE SET NULL,
  parent_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name           text NOT NULL,
  email          text,
  phone          text,                       -- normalized (last 10 digits); NOT identity
  username       text,
  password_hash  text,                        -- NULL until credentials are set
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_parent ON users(parent_user_id);
-- Uniqueness is per-tenant and only applies when the value is present.
CREATE UNIQUE INDEX uq_users_tenant_email ON users(tenant_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX uq_users_tenant_phone ON users(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX uq_users_tenant_username ON users(tenant_id, lower(username)) WHERE username IS NOT NULL;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_permission_overrides (grant beyond / revoke from the role template) ---
CREATE TABLE user_permission_overrides (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted       boolean NOT NULL,   -- true = extra grant, false = explicit revoke
  PRIMARY KEY (user_id, permission_id)
);

-- user_territories (row-level data scope) -----------------------------------
CREATE TABLE user_territories (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, territory_id)
);
