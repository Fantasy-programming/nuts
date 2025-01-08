-- name: CreateTransaction :one
INSERT INTO transactions (
    amount,
    type,
    account_id,
    category_id,
    description,
    transaction_datetime,
    details,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: GetTransactionById :one
SELECT *
FROM transactions
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
LIMIT 1;

-- name: ListTransactions :many
SELECT *
FROM transactions
WHERE
    created_by = sqlc.arg('user_id')
    AND deleted_at IS NULL
ORDER BY transaction_datetime DESC;

-- name: ListTransactionsByAccount :many
SELECT *
FROM transactions
WHERE
    account_id = sqlc.arg('account_id')
    AND deleted_at IS NULL
ORDER BY transaction_datetime DESC;

-- name: ListTransactionsByCategory :many
SELECT *
FROM transactions
WHERE
    category_id = sqlc.arg('category_id')
    AND deleted_at IS NULL
ORDER BY transaction_datetime DESC;

-- name: ListTransactionsByDateRange :many
SELECT *
FROM transactions
WHERE
    created_by = sqlc.arg('user_id')
    AND transaction_datetime BETWEEN sqlc.arg('start_date') AND sqlc.arg('end_date')
    AND deleted_at IS NULL
ORDER BY transaction_datetime DESC;

-- name: UpdateTransaction :one
UPDATE transactions
SET
    amount = coalesce(sqlc.narg('amount'), amount),
    type = coalesce(sqlc.narg('type'), type),
    account_id = coalesce(sqlc.narg('account_id'), account_id),
    category_id = coalesce(sqlc.narg('category_id'), category_id),
    description = coalesce(sqlc.narg('description'), description),
    transaction_datetime = coalesce(sqlc.narg('transaction_datetime'), transaction_datetime),
    details = coalesce(sqlc.narg('details'), details),
    updated_by = sqlc.arg('updated_by')
WHERE 
    id = sqlc.arg('id')
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteTransaction :exec
UPDATE transactions
SET deleted_at = current_timestamp
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: GetTransactionStats :one
SELECT
    COUNT(*) as total_count,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) as total_transfers
FROM transactions
WHERE created_by = sqlc.arg('user_id')
AND transaction_datetime BETWEEN sqlc.arg('start_date') AND sqlc.arg('end_date')
AND deleted_at IS NULL;

-- name: GetCategorySpending :many
SELECT
    c.name as category_name,
    SUM(t.amount) as total_amount,
    COUNT(*) as transaction_count
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE
    t.created_by = sqlc.arg('user_id')
    AND t.type = 'expense'
    AND t.transaction_datetime BETWEEN sqlc.arg('start_date') AND sqlc.arg('end_date')
    AND t.deleted_at IS NULL
    AND c.deleted_at IS NULL
GROUP BY c.id, c.name
ORDER BY total_amount DESC;
