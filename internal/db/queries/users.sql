-- name: GetUserByID :one
SELECT sqlc.embed(users), r.code AS role_code, r.name AS role_name, r.tier AS role_tier
FROM users
JOIN roles r ON r.id = users.role_id
WHERE users.id = $1;

-- name: GetUserForLogin :one
-- Login by email or username (case-insensitive).
SELECT sqlc.embed(users), r.code AS role_code, r.tier AS role_tier
FROM users
JOIN roles r ON r.id = users.role_id
WHERE (lower(users.email) = lower($1) OR lower(users.username) = lower($1))
LIMIT 1;

-- name: ListUsers :many
SELECT sqlc.embed(users),
       r.code AS role_code, r.name AS role_name, r.tier AS role_tier,
       COALESCE(array_agg(b.code ORDER BY b.code) FILTER (WHERE b.code IS NOT NULL), '{}')::text[] AS brand_codes
FROM users
JOIN roles r ON r.id = users.role_id
LEFT JOIN user_brands ub ON ub.user_id = users.id
LEFT JOIN brands b ON b.id = ub.brand_id
WHERE (sqlc.narg('role_code')::text IS NULL OR r.code = sqlc.narg('role_code'))
  AND (sqlc.narg('status')::text IS NULL OR users.status = sqlc.narg('status'))
  AND (sqlc.narg('search')::text IS NULL
       OR users.name ILIKE '%' || sqlc.narg('search') || '%'
       OR users.email ILIKE '%' || sqlc.narg('search') || '%'
       OR users.username ILIKE '%' || sqlc.narg('search') || '%'
       OR users.phone ILIKE '%' || sqlc.narg('search') || '%')
GROUP BY users.id, r.code, r.name, r.tier
ORDER BY users.created_at DESC;

-- name: CreateUser :one
INSERT INTO users (
  role_id, parent_user_id,
  name, email, phone, username, password_hash, status, is_active
) VALUES (
  $1, sqlc.narg('parent_user_id'),
  $2, sqlc.narg('email'), $3, sqlc.narg('username'),
  sqlc.narg('password_hash'),
  COALESCE(sqlc.narg('status'), 'pending'),
  COALESCE(sqlc.narg('is_active'), true)
)
RETURNING *;

-- name: UpdateUser :one
UPDATE users SET
  name           = COALESCE(sqlc.narg('name'), name),
  email          = COALESCE(sqlc.narg('email'), email),
  phone          = COALESCE(sqlc.narg('phone'), phone),
  username       = COALESCE(sqlc.narg('username'), username),
  role_id        = COALESCE(sqlc.narg('role_id'), role_id),
  parent_user_id = COALESCE(sqlc.narg('parent_user_id'), parent_user_id)
WHERE id = $1
RETURNING *;

-- name: SetUserStatus :exec
UPDATE users SET status = $2 WHERE id = $1;

-- name: SetUserActive :exec
UPDATE users SET is_active = $2 WHERE id = $1;

-- name: SetUserPassword :exec
UPDATE users SET password_hash = $2 WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: CountUsers :one
SELECT count(*) FROM users;
