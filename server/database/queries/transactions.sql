-- name: CreateTransaction :one
INSERT INTO transactions (
    amount,
    type,
    account_id,
    destination_account_id,
    category_id,
    description,
    transaction_datetime,
    details,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetTransactionById :one
SELECT *
FROM transactions
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
LIMIT 1;

-- name: ListTransactions :many
SELECT
    transactions.id,
    transactions.amount,
    transactions.type,
    transactions.destination_account_id,
    transactions.transaction_datetime,
    transactions.description,
    transactions.details,
    transactions.updated_at,
    sqlc.embed(categories),
    sqlc.embed(accounts)
FROM transactions
JOIN categories ON transactions.category_id = categories.id
JOIN accounts ON transactions.account_id = accounts.id
WHERE
    transactions.created_by = sqlc.arg('user_id')
    AND transactions.deleted_at IS NULL
    AND (sqlc.narg('type')::text IS NULL OR transactions.type = sqlc.narg('type'))
    AND (sqlc.narg('start_date')::timestamptz IS NULL OR transactions.transaction_datetime >= sqlc.narg('start_date')::timestamptz)
    AND (sqlc.narg('end_date')::timestamptz IS NULL OR transactions.transaction_datetime <= sqlc.narg('end_date')::timestamptz)
    AND (sqlc.narg('account_id')::uuid IS NULL OR transactions.account_id = sqlc.narg('account_id')::uuid)
ORDER BY transactions.transaction_datetime DESC
LIMIT CASE
    WHEN sqlc.narg('limit')::integer IS NULL THEN 50
    ELSE sqlc.narg('limit')::integer
END
OFFSET sqlc.arg('offset')::integer;


-- SELECT

-- FROM transactions
-- JOIN categories ON transactions.category_id = categories.id
-- JOIN accounts ON transactions.account_id = accounts.id
-- LEFT JOIN accounts ON transactions.destination_account_id = accounts.id
-- WHERE
--     transactions.created_by = sqlc.arg('user_id')
--     AND transactions.deleted_at IS NULL
-- ORDER BY transactions.transaction_datetime DESC;

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
    created_by = sqlc.arg('user_id')::uuid
    AND transaction_datetime BETWEEN sqlc.arg('start_date')::timestamptz AND sqlc.arg('end_date')::timestamptz
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
    count(*) AS total_count,
    sum(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    sum(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    sum(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) AS total_transfers
FROM transactions
WHERE
    created_by = sqlc.arg('user_id')
    AND transaction_datetime BETWEEN sqlc.arg('start_date')::timestamptz AND sqlc.arg('end_date')::timestamptz
    AND deleted_at IS NULL;

-- name: GetCategorySpending :many
SELECT
    c.name AS category_name,
    sum(t.amount) AS total_amount,
    count(*) AS transaction_count
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
