-- name: CreateTransactionRule :one
INSERT INTO transaction_rules (
    name,
    is_active,
    priority,
    conditions,
    actions,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetTransactionRuleById :one
SELECT * FROM transaction_rules
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListTransactionRules :many
SELECT * FROM transaction_rules
WHERE created_by = $1 AND deleted_at IS NULL
ORDER BY priority DESC, created_at DESC;

-- name: ListActiveTransactionRules :many
SELECT * FROM transaction_rules
WHERE created_by = $1 AND is_active = TRUE AND deleted_at IS NULL
ORDER BY priority DESC, created_at DESC;

-- name: UpdateTransactionRule :one
UPDATE transaction_rules
SET
    name = coalesce(sqlc.narg('name'), name),
    is_active = coalesce(sqlc.narg('is_active'), is_active),
    priority = coalesce(sqlc.narg('priority'), priority),
    conditions = coalesce(sqlc.narg('conditions'), conditions),
    actions = coalesce(sqlc.narg('actions'), actions),
    updated_by = $1,
    updated_at = current_timestamp
WHERE id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteTransactionRule :exec
UPDATE transaction_rules
SET deleted_at = current_timestamp
WHERE id = $1 AND created_by = $2;

-- name: ToggleTransactionRuleActive :one
UPDATE transaction_rules
SET
    is_active = NOT is_active,
    updated_by = $1,
    updated_at = current_timestamp
WHERE id = $2 AND created_by = $1 AND deleted_at IS NULL
RETURNING *;