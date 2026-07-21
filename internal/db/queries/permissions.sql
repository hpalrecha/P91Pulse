-- name: ListPermissions :many
SELECT * FROM permissions ORDER BY module, action;

-- name: ListRolePermissions :many
SELECT p.module, p.action
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = $1
ORDER BY p.module, p.action;

-- name: GetUserEffectivePermissions :many
-- Effective permissions = role-template grants (minus explicit revokes)
-- UNION explicit per-user extra grants. This is the enforced RBAC set.
SELECT p.module, p.action
FROM permissions p
WHERE p.id IN (
  SELECT rp.permission_id
  FROM users u
  JOIN role_permissions rp ON rp.role_id = u.role_id
  WHERE u.id = $1
    AND rp.permission_id NOT IN (
      SELECT permission_id FROM user_permission_overrides
      WHERE user_id = $1 AND granted = false
    )
  UNION
  SELECT permission_id FROM user_permission_overrides
  WHERE user_id = $1 AND granted = true
)
ORDER BY p.module, p.action;

-- name: ListUserOverrides :many
SELECT p.module, p.action, o.granted
FROM user_permission_overrides o
JOIN permissions p ON p.id = o.permission_id
WHERE o.user_id = $1
ORDER BY p.module, p.action;

-- name: UpsertUserOverride :exec
INSERT INTO user_permission_overrides (user_id, permission_id, granted)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = EXCLUDED.granted;

-- name: DeleteUserOverride :exec
DELETE FROM user_permission_overrides WHERE user_id = $1 AND permission_id = $2;

-- name: ClearUserOverrides :exec
DELETE FROM user_permission_overrides WHERE user_id = $1;

-- name: GetPermissionByModuleAction :one
SELECT * FROM permissions WHERE module = $1 AND action = $2;
