-- 0002_seed_rbac — permission catalog + system role templates.
-- This is the seed data that drives the RBAC engine. Editing a template here
-- (or later via the admin UI) changes what a role can do.

-- 1) Permission catalog: modules x actions -----------------------------------
INSERT INTO permissions (module, action, description)
SELECT m.module, a.action, a.action || ' on ' || m.module
FROM   (VALUES
          ('users_rbac'), ('leads'), ('territories_brands'), ('inventory'),
          ('orders'), ('warranty'), ('claims'), ('rewards'),
          ('sales_partners'), ('vas_jobcards'), ('dashboards'),
          ('integrations'), ('audit')
       ) AS m(module)
CROSS JOIN (VALUES
          ('view'), ('create'), ('edit'), ('delete'),
          ('assign'), ('approve'), ('configure'), ('export')
       ) AS a(action)
ON CONFLICT (module, action) DO NOTHING;

-- 2) System roles ------------------------------------------------------------
INSERT INTO roles (tenant_id, code, name, tier, is_system) VALUES
  (NULL, 'platform_super_admin', 'Platform Super Admin', 'platform', true),
  (NULL, 'admin',                'Tenant Admin',         'internal', true),
  (NULL, 'nsm',                  'National Sales Manager','internal', true),
  (NULL, 'rsm',                  'Regional Sales Manager','internal', true),
  (NULL, 'asm',                  'Area Sales Manager',    'internal', true),
  (NULL, 'salesperson',          'Salesperson',           'internal', true),
  (NULL, 'distributor',          'Distributor',           'external', true),
  (NULL, 'detailer',             'Detailer',              'external', true),
  (NULL, 'installer',            'Installer',             'external', true),
  (NULL, 'sales_partner',        'Sales Partner',         'external', true)
ON CONFLICT DO NOTHING;

-- Helper: grant a role a set of (module, action) pairs.
-- 2a) platform_super_admin — governs the CONTAINER, never business data.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON true
WHERE r.code = 'platform_super_admin' AND r.tenant_id IS NULL
  AND (
    p.module = 'users_rbac'
    OR (p.module IN ('territories_brands','integrations') AND p.action IN ('view','configure'))
    OR (p.module IN ('dashboards','audit') AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- 2b) admin (tenant admin) — everything within the tenant.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON true
WHERE r.code = 'admin' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

-- 2c) field / partner roles — baseline templates (refine in the UI later).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('leads','edit'),('leads','assign'),('leads','approve'),
         ('territories_brands','view'),('sales_partners','view'),('sales_partners','approve'),
         ('warranty','view'),('warranty','approve'),('claims','view'),('claims','approve'),
         ('orders','view'),('inventory','view'),('rewards','view'),('dashboards','view')
)
WHERE r.code = 'nsm' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('leads','edit'),('leads','assign'),
         ('territories_brands','view'),('sales_partners','view'),
         ('warranty','view'),('claims','view'),('orders','view'),
         ('inventory','view'),('dashboards','view')
)
WHERE r.code = 'rsm' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('territories_brands','view'),
         ('sales_partners','view'),('dashboards','view')
)
WHERE r.code = 'asm' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('leads','edit'),('dashboards','view')
)
WHERE r.code = 'salesperson' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('users_rbac','view'),('users_rbac','create'),('users_rbac','edit'),
         ('leads','view'),('leads','edit'),('leads','assign'),
         ('sales_partners','view'),('sales_partners','create'),('sales_partners','edit'),('sales_partners','assign'),
         ('orders','view'),('orders','create'),('inventory','view'),
         ('warranty','view'),('claims','view'),('claims','create'),('dashboards','view')
)
WHERE r.code = 'distributor' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('leads','edit'),
         ('warranty','view'),('warranty','create'),
         ('claims','view'),('claims','create'),
         ('orders','view'),('dashboards','view')
)
WHERE r.code = 'detailer' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('vas_jobcards','view'),('vas_jobcards','edit'),('dashboards','view')
)
WHERE r.code = 'installer' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON (p.module, p.action) IN (
  VALUES ('leads','view'),('leads','edit'),('dashboards','view')
)
WHERE r.code = 'sales_partner' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;
