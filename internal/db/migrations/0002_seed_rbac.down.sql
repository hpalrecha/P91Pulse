DELETE FROM role_permissions
  WHERE role_id IN (SELECT id FROM roles WHERE is_system AND tenant_id IS NULL);
DELETE FROM roles WHERE is_system AND tenant_id IS NULL;
DELETE FROM permissions;
