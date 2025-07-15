-- name: CreateConnection :one
INSERT INTO user_financial_connections (
    user_id,
    provider_name,
    access_token_encrypted,
    item_id,
    institution_id,
    institution_name,
    status,
    last_sync_at,
    expires_at
) VALUES (
    sqlc.arg(user_id),
    sqlc.arg(provider_name),
    sqlc.arg(access_token_encrypted),
    sqlc.arg(item_id),
    sqlc.arg(institution_id),
    sqlc.arg(institution_name),
    sqlc.arg(status),
    sqlc.arg(last_sync_at),
    sqlc.arg(expires_at)
) RETURNING *;

-- name: GetConnectionByID :one
SELECT * FROM user_financial_connections
WHERE id = $1 LIMIT 1;

-- name: GetConnectionsByUserID :many
SELECT * FROM user_financial_connections
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetConnectionByProviderItemID :one
SELECT * FROM user_financial_connections
WHERE user_id = $1
  AND provider_name = $2
  AND item_id = $3
LIMIT 1;

-- name: UpdateConnection :one
UPDATE user_financial_connections
SET
    access_token_encrypted = COALESCE(sqlc.narg('access_token_encrypted'), access_token_encrypted),
    item_id = COALESCE(sqlc.narg('item_id'), item_id),
    institution_id = COALESCE(sqlc.narg('institution_id'), institution_id),
    institution_name = COALESCE(sqlc.narg('institution_name'), institution_name),
    status = COALESCE(sqlc.narg('status'), status),
    last_sync_at = sqlc.narg('last_sync_at'), -- Use sqlc.narg for nullable timestamp
    expires_at = sqlc.narg('expires_at'),   -- Use sqlc.narg for nullable timestamp
    updated_at = NOW()
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteConnection :exec
DELETE FROM user_financial_connections
WHERE id = $1 AND user_id = $2;

-- name: SetConnectionSyncStatus :one
UPDATE user_financial_connections
SET
    status = $2,
    last_sync_at = $3,
    updated_at = NOW()
WHERE id = $1 AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: SetConnectionErrorStatus :one
UPDATE user_financial_connections
SET
    status = $2, -- Should be an error status
    updated_at = NOW()
WHERE id = $1 AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: ListConnections :many
SELECT * FROM user_financial_connections
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
