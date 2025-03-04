-- name: CreateUser :one
INSERT INTO users (
    email,
    first_name,
    last_name,
    password
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetUserById :one
SELECT
    id,
    email,
    first_name,
    last_name,
    password,
    avatar_url,
    created_at,
    updated_at
FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT
    id,
    email,
    first_name,
    last_name,
    password,
    avatar_url,
    created_at,
    updated_at
FROM users
WHERE email = $1 LIMIT 1;

-- name: ListUsers :many
SELECT
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    password,
    created_at,
    updated_at
FROM users
ORDER BY id
LIMIT
    $1
    OFFSET $2;

-- name: UpdateUser :one
UPDATE users
SET
    email = coalesce(sqlc.narg('email'), email),
    first_name = coalesce(sqlc.narg('first_name'), first_name),
    last_name = coalesce(sqlc.narg('last_name'), last_name),
    avatar_url = coalesce(sqlc.narg('avatar_uri'), avatar_uri),
    updated_at = coalesce(sqlc.narg('updated_at'), updated_at)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
