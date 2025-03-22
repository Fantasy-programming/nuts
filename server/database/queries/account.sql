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
    meta,
    color,
    created_by,
    updated_at
FROM accounts
WHERE id = $1 LIMIT 1;

-- name: GetAccounts :many
SELECT
    id,
    name,
    type,
    balance,
    currency,
    color,
    meta,
    updated_at
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


-- name: GetAllAccountsBalanceTimeline :many
WITH months AS (
    -- Generate a full year of months
    SELECT generate_series(
        date_trunc('month', now()) - INTERVAL '11 months',
        date_trunc('month', now()),
        INTERVAL '1 month'
    ) AS month
),

monthly_transactions AS (
    -- Aggregate transactions per month per account
    SELECT
        account_id,
        date_trunc('month', transaction_datetime) AS month,
        sum(
            CASE
                WHEN type = 'income' THEN amount
                WHEN type = 'expense' THEN -amount
                ELSE 0
            END
        ) AS monthly_net
    FROM transactions
    WHERE transaction_datetime >= now() - INTERVAL '1 year'
    GROUP BY account_id, month
),

account_initial_balance AS (
    -- Get the initial balance of all accounts
    SELECT
        id AS account_id,
        balance AS initial_balance
    FROM accounts
),

combined AS (
    -- Left join generated months with transactions for all accounts
    SELECT
        months.month,
        coalesce(monthly_transactions.account_id, account_initial_balance.account_id) AS account_id,
        coalesce(monthly_transactions.monthly_net, 0) AS monthly_net
    FROM months
    CROSS JOIN account_initial_balance
    LEFT JOIN monthly_transactions ON months.month = monthly_transactions.month 
        AND account_initial_balance.account_id = monthly_transactions.account_id
),

running_balance AS (
    -- Compute cumulative balance for all accounts
    SELECT
        combined.account_id,
        combined.month,
        account_initial_balance.initial_balance
        +
        sum(combined.monthly_net) OVER (
            PARTITION BY combined.account_id
            ORDER BY combined.month ROWS BETWEEN UNBOUNDED PRECEDING
            AND CURRENT ROW
        ) AS balance
    FROM combined
    INNER JOIN account_initial_balance
        ON combined.account_id = account_initial_balance.account_id
)

SELECT
    account_id,
    month::TIMESTAMPTZ,
    balance
FROM running_balance
ORDER BY account_id, month;



-- name: GetAccountBalanceTimeline :one
WITH months AS (
    -- Generate a full year of months
    SELECT generate_series(
        date_trunc('month', now()) - INTERVAL '11 months',
        date_trunc('month', now()),
        INTERVAL '1 month'
    ) AS month
),

monthly_transactions AS (
    -- Aggregate transactions per month
    SELECT
        t.account_id,
        date_trunc('month', t.transaction_datetime) AS month,
        sum(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                ELSE 0
            END
        ) AS monthly_net
    FROM transactions t
    WHERE
        t.account_id = $1
        AND t.transaction_datetime >= now() - INTERVAL '1 year'
    GROUP BY t.account_id, month
),

account_initial_balance AS (
    -- Get the initial balance of the account
    SELECT
        a.id AS account_id,
        a.balance AS initial_balance
    FROM accounts a
    WHERE a.id = $1
),

combined AS (
    -- Left join generated months with transactions
    SELECT
        m.month,
        coalesce(mt.account_id, aib.account_id) AS account_id,
        coalesce(mt.monthly_net, 0) AS monthly_net
    FROM months m
    LEFT JOIN monthly_transactions mt ON m.month = mt.month
    CROSS JOIN account_initial_balance aib
),

running_balance AS (
    -- Compute cumulative balance including the initial balance
    SELECT
        c.month,
        aib.initial_balance
        +
        sum(c.monthly_net) OVER (
            ORDER BY c.month ROWS BETWEEN UNBOUNDED PRECEDING
            AND CURRENT ROW
        ) AS balance
    FROM combined c
    INNER JOIN account_initial_balance aib
        ON c.account_id = aib.account_id
)

SELECT
    month,
    balance
FROM running_balance;


-- name: GetAccountsWithTrend :many
WITH months AS (
    -- Generate months within the given period
    SELECT generate_series(
        date_trunc('month', $1::TIMESTAMPTZ),
        date_trunc('month', $2::TIMESTAMPTZ),
        INTERVAL '1 month'
    ) AS month
),

monthly_transactions AS (
    -- Aggregate transactions per month
    SELECT
        account_id,
        date_trunc('month', transaction_datetime) AS month,
        sum(
            CASE
                WHEN type = 'income' THEN amount
                WHEN type = 'expense' THEN -amount
                ELSE 0
            END
        ) AS monthly_net
    FROM transactions
    WHERE transaction_datetime BETWEEN $1 AND $2
    GROUP BY account_id, month
),

account_initial_balance AS (
    -- Get the initial balance + account info
    SELECT
        id AS account_id,
        name,
        type,
        balance AS initial_balance,
        currency,
        color,
        meta,
        created_by,
        created_at,
        updated_at,
        deleted_at
    FROM accounts
    WHERE (deleted_at IS NULL OR deleted_at > $2)
),

combined AS (
    -- Join months with transactions, ensuring all months are included
    SELECT
        months.month,
        coalesce(
            monthly_transactions.account_id,
            account_initial_balance.account_id
        ) AS account_id,
        coalesce(
            monthly_transactions.monthly_net,
            0
        ) AS monthly_net
    FROM months
    LEFT JOIN monthly_transactions ON months.month = monthly_transactions.month
    CROSS JOIN account_initial_balance
    -- Ignore months before the account was created
    WHERE months.month >= account_initial_balance.created_at
),

running_balance AS (
    -- Compute cumulative balance including initial balance
    SELECT
        combined.month,
        account_initial_balance.account_id,
        account_initial_balance.name,
        account_initial_balance.type,
        account_initial_balance.currency,
        account_initial_balance.color,
        account_initial_balance.meta,
        account_initial_balance.created_by,
        account_initial_balance.created_at,
        account_initial_balance.updated_at,
        account_initial_balance.deleted_at,
        account_initial_balance.initial_balance
        +
        sum(combined.monthly_net) OVER (
            PARTITION BY combined.account_id
            ORDER BY combined.month
        ) AS balance
    FROM combined
    INNER JOIN account_initial_balance ON
        combined.account_id = account_initial_balance.account_id
),

account_trend AS (
    -- Calculate trend percentage
    SELECT
        rb.account_id,
        rb.name,
        rb.type,
        rb.currency,
        rb.color,
        rb.meta,
        rb.created_by,
        rb.created_at,
        rb.updated_at,
        rb.deleted_at,
        CASE
            WHEN (
                SELECT balance FROM running_balance
                WHERE account_id = rb.account_id
                ORDER BY month ASC LIMIT 1
            ) = 0
                THEN NULL -- Avoid division by zero
            ELSE (
                (
                    SELECT balance FROM running_balance
                    WHERE account_id = rb.account_id
                    ORDER BY month DESC LIMIT 1
                )
                -
                (
                    SELECT balance FROM running_balance 
                    WHERE account_id = rb.account_id
                    ORDER BY month ASC LIMIT 1
                )
            ) / (
                SELECT balance FROM running_balance
                WHERE account_id = rb.account_id
                ORDER BY month ASC LIMIT 1
            ) * 100
        END AS trend
    FROM running_balance rb
    LIMIT 1
),

latest_transactions AS (
    -- Fetch the last 3 transactions for each account
    SELECT
        transactions.account_id,
        jsonb_agg(
            jsonb_build_object(
                'id', transactions.id,
                'amount', transactions.amount,
                'type', transactions.type,
                'transaction_datetime', transactions.transaction_datetime,
                'description', transactions.description
            )
            ORDER BY transactions.transaction_datetime DESC
        ) AS transactions
    FROM transactions
    WHERE transactions.account_id IN (SELECT account_id FROM account_trend)
    GROUP BY transactions.account_id
)

-- Final query joining trend with last 3 transactions
SELECT
    at.account_id,
    at.name,
    at.type,
    at.currency,
    at.color,
    at.meta,
    at.created_by,
    at.created_at,
    at.updated_at,
    at.deleted_at,
    at.trend,
    coalesce(lt.transactions, '[]'::JSONB) AS transactions
FROM account_trend at
LEFT JOIN latest_transactions lt ON at.account_id = lt.account_id;
