-- name: CreateTransaction :one
INSERT INTO transactions (
    amount,
    type,
    account_id,
    destination_account_id,
    category_id,
    description,
    transaction_datetime,
    transaction_currency,
    original_amount,
    details,
    provider_transaction_id,
    is_external,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;


-- name: BatchCreateTransaction :copyfrom
INSERT INTO transactions (
    amount,
    type,
    account_id,
    destination_account_id,
    category_id,
    description,
    transaction_datetime,
    transaction_currency,
    original_amount,
    details,
    provider_transaction_id,
    is_external,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
);

-- name: GetTransactionById :one
SELECT *
FROM transactions
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
LIMIT 1;

-- name: ListTransactions :many
SELECT
    t.id,
    t.amount,
    t.type,
    t.destination_account_id,
    t.transaction_datetime,
    t.description,
    t.details,
    t.updated_at,
    -- Embed the source account
    sqlc.embed(source_acct),
    -- Select destination account fields explicitly with aliases
    -- We use LEFT JOIN because destination_account_id can be NULL
    dest_acct.id AS destination_account_id_alias,
    dest_acct.name AS destination_account_name,
    dest_acct.type AS destination_account_type,
    dest_acct.currency AS destination_account_currency,
    -- Embed the category
    sqlc.embed(cat)
FROM
    transactions AS t
JOIN
    accounts AS source_acct ON t.account_id = source_acct.id
JOIN
    categories AS cat ON t.category_id = cat.id
LEFT JOIN
    accounts AS dest_acct ON t.destination_account_id = dest_acct.id
WHERE
    t.created_by = sqlc.arg('user_id')
    AND t.deleted_at IS NULL
    -- New and improved filters
    AND (sqlc.narg('type')::text IS NULL OR t.type = sqlc.narg('type'))
    AND (sqlc.narg('account_id')::uuid IS NULL OR t.account_id = sqlc.narg('account_id'))
    AND (sqlc.narg('start_date')::timestamptz IS NULL OR t.transaction_datetime >= sqlc.narg('start_date'))
    AND (sqlc.narg('end_date')::timestamptz IS NULL OR t.transaction_datetime <= sqlc.narg('end_date'))
    -- New search filter (case-insensitive)
    AND (sqlc.narg('search')::text IS NULL OR t.description ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY
    t.transaction_datetime DESC
LIMIT
    sqlc.arg('limit')
OFFSET
    sqlc.arg('offset');

-- name: CountTransactions :one
SELECT count(*)
FROM
    transactions AS t
WHERE
    t.created_by = sqlc.arg('user_id')
    AND t.deleted_at IS NULL
    AND (sqlc.narg('type')::text IS NULL OR t.type = sqlc.narg('type'))
    AND (sqlc.narg('account_id')::uuid IS NULL OR t.account_id = sqlc.narg('account_id'))
    AND (sqlc.narg('start_date')::timestamptz IS NULL OR t.transaction_datetime >= sqlc.narg('start_date'))
    AND (sqlc.narg('end_date')::timestamptz IS NULL OR t.transaction_datetime <= sqlc.narg('end_date'))
    AND (sqlc.narg('search')::text IS NULL OR t.description ILIKE '%' || sqlc.narg('search')::text || '%');


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
