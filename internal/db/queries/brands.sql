-- name: ListBrands :many
SELECT * FROM brands ORDER BY name;

-- name: CreateBrand :one
INSERT INTO brands (name, code, scope)
VALUES ($1, $2, COALESCE(sqlc.narg('scope'), 'national'))
RETURNING *;

-- name: ListTerritories :many
SELECT * FROM territories ORDER BY level, name;

-- name: ClearUserBrands :exec
DELETE FROM user_brands WHERE user_id = $1;

-- name: AddUserBrand :exec
INSERT INTO user_brands (user_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: ListUserBrandIDs :many
SELECT brand_id FROM user_brands WHERE user_id = $1;
