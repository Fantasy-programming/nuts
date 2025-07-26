-- name: CreateRecurringTransaction :one
INSERT INTO recurring_transactions (
    user_id,
    account_id,
    category_id,
    destination_account_id,
    amount,
    type,
    description,
    details,
    frequency,
    frequency_interval,
    frequency_data,
    start_date,
    end_date,
    next_due_date,
    auto_post,
    is_paused,
    max_occurrences,
    template_name,
    tags
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
) RETURNING *;

-- name: GetRecurringTransactionById :one
SELECT * FROM recurring_transactions
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: ListRecurringTransactions :many
SELECT * FROM recurring_transactions
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY next_due_date ASC;

-- name: ListRecurringTransactionsByAccount :many
SELECT * FROM recurring_transactions
WHERE user_id = $1 AND account_id = $2 AND deleted_at IS NULL
ORDER BY next_due_date ASC;

-- name: GetDueRecurringTransactions :many
SELECT * FROM recurring_transactions
WHERE deleted_at IS NULL 
    AND is_paused = FALSE
    AND next_due_date <= $1
    AND (max_occurrences IS NULL OR occurrences_count < max_occurrences)
    AND (end_date IS NULL OR next_due_date <= end_date)
ORDER BY next_due_date ASC;

-- name: UpdateRecurringTransaction :one
UPDATE recurring_transactions
SET
    account_id = COALESCE(sqlc.narg('account_id'), account_id),
    category_id = COALESCE(sqlc.narg('category_id'), category_id),
    destination_account_id = COALESCE(sqlc.narg('destination_account_id'), destination_account_id),
    amount = COALESCE(sqlc.narg('amount'), amount),
    type = COALESCE(sqlc.narg('type'), type),
    description = COALESCE(sqlc.narg('description'), description),
    details = COALESCE(sqlc.narg('details'), details),
    frequency = COALESCE(sqlc.narg('frequency'), frequency),
    frequency_interval = COALESCE(sqlc.narg('frequency_interval'), frequency_interval),
    frequency_data = COALESCE(sqlc.narg('frequency_data'), frequency_data),
    start_date = COALESCE(sqlc.narg('start_date'), start_date),
    end_date = COALESCE(sqlc.narg('end_date'), end_date),
    next_due_date = COALESCE(sqlc.narg('next_due_date'), next_due_date),
    auto_post = COALESCE(sqlc.narg('auto_post'), auto_post),
    is_paused = COALESCE(sqlc.narg('is_paused'), is_paused),
    max_occurrences = COALESCE(sqlc.narg('max_occurrences'), max_occurrences),
    template_name = COALESCE(sqlc.narg('template_name'), template_name),
    tags = COALESCE(sqlc.narg('tags'), tags),
    updated_at = current_timestamp
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: UpdateRecurringTransactionAfterGeneration :exec
UPDATE recurring_transactions
SET
    last_generated_date = $2,
    next_due_date = $3,
    occurrences_count = occurrences_count + 1,
    updated_at = current_timestamp
WHERE id = $1;

-- name: PauseRecurringTransaction :one
UPDATE recurring_transactions
SET is_paused = $2, updated_at = current_timestamp
WHERE id = $1 AND user_id = $3 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteRecurringTransaction :exec
UPDATE recurring_transactions
SET deleted_at = current_timestamp
WHERE id = $1 AND user_id = $2;

-- name: GetRecurringTransactionStats :one
SELECT
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_paused = FALSE) as active_count,
    COUNT(*) FILTER (WHERE is_paused = TRUE) as paused_count,
    COUNT(*) FILTER (WHERE next_due_date <= current_timestamp AND is_paused = FALSE) as due_count
FROM recurring_transactions
WHERE user_id = $1 AND deleted_at IS NULL;

-- name: GetUpcomingRecurringTransactions :many
SELECT * FROM recurring_transactions
WHERE user_id = $1 
    AND deleted_at IS NULL
    AND is_paused = FALSE
    AND next_due_date BETWEEN $2 AND $3
    AND (max_occurrences IS NULL OR occurrences_count < max_occurrences)
    AND (end_date IS NULL OR next_due_date <= end_date)
ORDER BY next_due_date ASC;

-- name: GetRecurringTransactionInstances :many
SELECT 
    t.*,
    rt.template_name,
    rt.frequency
FROM transactions t
JOIN recurring_transactions rt ON t.recurring_transaction_id = rt.id
WHERE rt.user_id = $1 AND rt.id = $2 AND t.deleted_at IS NULL
ORDER BY t.transaction_datetime DESC;

-- name: ListRecurringTransactionsWithFilters :many
SELECT * FROM recurring_transactions
WHERE user_id = $1 
    AND deleted_at IS NULL
    AND (sqlc.narg('account_id')::uuid IS NULL OR account_id = sqlc.narg('account_id'))
    AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id'))
    AND (sqlc.narg('frequency')::text IS NULL OR frequency = sqlc.narg('frequency'))
    AND (sqlc.narg('is_paused')::boolean IS NULL OR is_paused = sqlc.narg('is_paused'))
    AND (sqlc.narg('auto_post')::boolean IS NULL OR auto_post = sqlc.narg('auto_post'))
    AND (sqlc.narg('template_name')::text IS NULL OR template_name ILIKE '%' || sqlc.narg('template_name') || '%')
ORDER BY next_due_date ASC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountRecurringTransactionsWithFilters :one
SELECT COUNT(*) FROM recurring_transactions
WHERE user_id = $1 
    AND deleted_at IS NULL
    AND (sqlc.narg('account_id')::uuid IS NULL OR account_id = sqlc.narg('account_id'))
    AND (sqlc.narg('category_id')::uuid IS NULL OR category_id = sqlc.narg('category_id'))
    AND (sqlc.narg('frequency')::text IS NULL OR frequency = sqlc.narg('frequency'))
    AND (sqlc.narg('is_paused')::boolean IS NULL OR is_paused = sqlc.narg('is_paused'))
    AND (sqlc.narg('auto_post')::boolean IS NULL OR auto_post = sqlc.narg('auto_post'))
    AND (sqlc.narg('template_name')::text IS NULL OR template_name ILIKE '%' || sqlc.narg('template_name') || '%');

-- name: GetActiveRecurringTransactions :many
SELECT * FROM recurring_transactions
WHERE deleted_at IS NULL 
    AND is_paused = FALSE
    AND (max_occurrences IS NULL OR occurrences_count < max_occurrences)
    AND (end_date IS NULL OR $1 <= end_date)
ORDER BY next_due_date ASC;

-- name: UpdateRecurringTransactionNextDueDate :one
UPDATE recurring_transactions
SET
    next_due_date = $2,
    updated_at = current_timestamp
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: GetTransactionByRecurringAndDate :one
SELECT * FROM transactions
WHERE recurring_transaction_id = $1
    AND DATE(transaction_datetime) = DATE($2)
    AND deleted_at IS NULL
LIMIT 1;
