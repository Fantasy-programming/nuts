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
    mfa_enabled,
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

-- name: HasPasswordAuth :one
SELECT
    password IS NOT NULL
FROM users
WHERE id = $1;

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
    avatar_url = coalesce(sqlc.narg('avatar_url'), avatar_url)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdatePassword :exec
UPDATE users
SET
    password = $1
WHERE id = sqlc.arg('id');

-- name: StoreMFASecret :exec
UPDATE users
SET
    mfa_secret = $1,
    mfa_enabled = FALSE,
    mfa_verified_at = NULL
WHERE id = $2;

-- name: GetMFASecret :one
SELECT mfa_secret
FROM users
WHERE id = $1;

-- name: EnableMFA :exec
UPDATE users
SET
    mfa_enabled = TRUE,
    mfa_verified_at = now()
WHERE id = $1 AND mfa_secret IS NOT NULL;

-- name: DisableMFA :exec
UPDATE users
SET
    mfa_enabled = FALSE,
    mfa_secret = NULL,
    mfa_verified_at = NULL
WHERE id = $1;

-- name: IsMFAEnabled :one
SELECT mfa_enabled
FROM users
WHERE id = $1;

-- name: AddLinkedAccount :exec
INSERT INTO linked_accounts (
    user_id,
    provider,
    provider_user_id,
    email
) VALUES (
    $1, $2, $3, $4
) ON CONFLICT (
    user_id,
    provider
) DO UPDATE SET provider_user_id = $3, email = $4;

-- name: GetLinkedAccounts :many
SELECT
    provider_user_id AS id,
    provider,
    created_at
FROM linked_accounts
WHERE user_id = $1;

-- name: DeleteLinkedAccount :exec
DELETE FROM linked_accounts
WHERE user_id = $1 AND provider = $2;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
