-- name: GetRoleByID :one
SELECT * FROM roles WHERE id = $1;

-- name: GetRoleByCode :one
SELECT * FROM roles WHERE code = $1;

-- name: ListRoles :many
SELECT * FROM roles ORDER BY tier, name;
