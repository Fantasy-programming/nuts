-- name: CreateAccount :one
INSERT INTO accounts (
    created_by,
    name,
    type,
    balance,
    currency,
    color,
    meta
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetAccountById :one
SELECT
    id,
    name,
    type,
    balance,
    currency,
    meta
FROM accounts
WHERE id = $1 LIMIT 1;

-- name: GetAccounts :many
SELECT
    id,
    name,
    type,
    balance,
    currency,
    meta
FROM accounts
WHERE created_by = sqlc.arg('user_id');
