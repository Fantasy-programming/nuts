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

-- name: UpdateAccount :one
UPDATE accounts
SET
    name = coalesce(sqlc.narg('name'), name),
    type = coalesce(sqlc.narg('type'), type),
    balance = coalesce(sqlc.narg('balance'), balance),
    currency = coalesce(sqlc.narg('currency'), currency),
    color = coalesce(sqlc.narg('color'), color),
    meta = coalesce(sqlc.narg('meta'), meta),
    updated_by = sqlc.arg('updated_by')
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdateAccountBalance :exec
UPDATE accounts
SET balance = balance + $2
WHERE id = $1;


-- name: DeleteAccount :exec
UPDATE accounts
SET
    deleted_at = current_timestamp
WHERE id = sqlc.arg('id')
RETURNING *;
