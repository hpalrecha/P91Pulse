-- 0004_remove_tenant — this product is sold as single-tenant software: every
-- customer gets their own separate deployment/database, so there is no
-- multi-tenant concept to model. Isolation is physical (separate DB per
-- customer), not a column. Also drops the now-unused single users.brand_id
-- column, superseded by the user_brands many-to-many (0003).

-- roles: drop tenant scoping, make code globally unique, rename the seeded
-- "Tenant Admin" role now that tenancy is gone.
ALTER TABLE roles DROP COLUMN tenant_id CASCADE;
ALTER TABLE roles ADD CONSTRAINT roles_code_key UNIQUE (code);
UPDATE roles SET name = 'Admin' WHERE code = 'admin';

-- brands: drop tenant scoping, make code globally unique.
ALTER TABLE brands DROP COLUMN tenant_id CASCADE;
ALTER TABLE brands ADD CONSTRAINT brands_code_key UNIQUE (code);

-- territories: drop tenant scoping.
ALTER TABLE territories DROP COLUMN tenant_id CASCADE;

-- users: drop tenant scoping and the unused single brand_id column, then
-- recreate uniqueness globally (safe: this DB has only ever had one tenant).
ALTER TABLE users DROP COLUMN tenant_id CASCADE;
ALTER TABLE users DROP COLUMN brand_id;
CREATE UNIQUE INDEX uq_users_email ON users(lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX uq_users_phone ON users(phone);
CREATE UNIQUE INDEX uq_users_username ON users(lower(username)) WHERE username IS NOT NULL;

-- tenants: no longer referenced by anything — drop it.
DROP TABLE tenants;
