-- name: CreateAccount :one
INSERT INTO accounts (
    created_by,
    name,
    type,
    subtype,
    balance,
    currency,
    color,
    meta,
    connection_id,
    is_external,
    provider_account_id,
    provider_name
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;


-- name: BatchCreateAccount :copyfrom
INSERT INTO accounts (
    created_by,
    name,
    type,
    subtype,
    balance,
    currency,
    color,
    meta,
    connection_id,
    is_external,
    provider_account_id,
    provider_name
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
);


-- name: GetAccountById :one
SELECT
    id,
    name,
    type,
    subtype,
    balance,
    currency,
    meta,
    color,
    created_by,
    updated_at,
    connection_id
FROM accounts
WHERE
    id = $1
    AND deleted_at IS NULL
LIMIT 1;

-- name: GetAccounts :many
SELECT
    id,
    name,
    type,
    subtype,
    balance,
    currency,
    color,
    meta,
    updated_at,
    connection_id
FROM accounts
WHERE
    created_by = sqlc.arg('user_id')
    AND deleted_at IS NULL;

-- name: UpdateAccount :one
UPDATE accounts
SET
    name = coalesce(sqlc.narg('name'), name),
    type = coalesce(sqlc.narg('type'), type),
    subtype = coalesce(sqlc.narg('subtype'), subtype),
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

-- name: GetAccountsBalanceTimeline :many
WITH
-- =================================================================
-- Step 1: Define the reporting period and the user's base currency
-- =================================================================
period AS (
    SELECT
        date_trunc('month', now()) - INTERVAL '11 months' AS start_month,
        date_trunc('month', now()) AS end_month
),
user_base_currency AS (
    SELECT COALESCE((SELECT currency FROM preferences WHERE user_id = $2 LIMIT 1), 'USD') AS base_currency
),
-- =================================================================
-- Step 2: Unify and convert all transaction "movements" for the SPECIFIC account.
-- =================================================================
transactions_converted AS (
    SELECT
        m.account_id,
        m.transaction_datetime,
        (m.amount * COALESCE(er.rate, 1.0))::DECIMAL AS converted_amount
    FROM (
        SELECT t.account_id, t.transaction_datetime, t.amount, t.transaction_currency FROM transactions t
        WHERE t.created_by = $2 AND t.deleted_at IS NULL AND t.type IN ('income', 'expense') AND t.account_id = $1
        UNION ALL
        SELECT t.account_id, t.transaction_datetime, -t.amount, t.transaction_currency FROM transactions t
        WHERE t.created_by = $2 AND t.deleted_at IS NULL AND t.type = 'transfer' AND t.account_id = $1
        UNION ALL
        SELECT t.destination_account_id, t.transaction_datetime, t.amount, t.transaction_currency FROM transactions t
        WHERE t.created_by = $2 AND t.deleted_at IS NULL AND t.type = 'transfer' AND t.destination_account_id = $1
    ) m
    LEFT JOIN LATERAL (
        SELECT rate FROM exchange_rates er
        WHERE er.from_currency = m.transaction_currency AND er.to_currency = (SELECT base_currency FROM user_base_currency)
          AND er.effective_date <= m.transaction_datetime::DATE
        ORDER BY er.effective_date DESC
        LIMIT 1
    ) er ON TRUE
),
-- =================================================================
-- Step 3: Pre-calculate daily net changes for the specific account.
-- =================================================================
daily_deltas AS (
    SELECT
        date_trunc('day', transaction_datetime)::DATE AS date,
        SUM(converted_amount) AS delta
    FROM transactions_converted
    GROUP BY date_trunc('day', transaction_datetime)
),
-- =================================================================
-- Step 4: Get the authoritative "anchor" balance for the specific account.
-- =================================================================
account_anchor_balance AS (
    SELECT
        a.id AS account_id,
        a.type,
        a.created_at,
        CASE
            WHEN a.is_external THEN (a.balance * COALESCE(er.rate, 1.0))::DECIMAL
            ELSE COALESCE((SELECT SUM(tc.converted_amount) FROM transactions_converted tc), 0)
        END AS anchor_balance,
        CASE
            WHEN a.is_external THEN a.updated_at
            ELSE NOW()
        END AS anchor_date
    FROM accounts a
    LEFT JOIN LATERAL (
        SELECT rate FROM exchange_rates er
        WHERE er.from_currency = a.currency AND er.to_currency = (SELECT base_currency FROM user_base_currency)
          AND er.effective_date <= a.updated_at::DATE
        ORDER BY er.effective_date DESC
        LIMIT 1
    ) er ON TRUE
    WHERE a.id = $1 AND a.created_by = $2 AND a.deleted_at IS NULL
),
-- =================================================================
-- Step 5: Generate the daily balance timeseries for the account.
-- =================================================================
balance_timeseries AS (
    SELECT
        d.date,
        a.type,
        (
            a.anchor_balance -
            COALESCE((
                SELECT SUM(delta) FROM daily_deltas dd
                WHERE dd.date > (SELECT end_month FROM period)::DATE
                  AND dd.date <= a.anchor_date::DATE
            ), 0)
        )
        -
        COALESCE((
            SELECT SUM(delta) FROM daily_deltas dd
            WHERE dd.date > d.date
              AND dd.date <= (SELECT end_month FROM period)::DATE
        ), 0) AS daily_balance
    FROM
        generate_series(
            (SELECT start_month FROM period)::DATE,
            (SELECT end_month FROM period)::DATE + interval '1 month' - interval '1 day',
            '1 day'::interval
        ) AS d(date)
    CROSS JOIN account_anchor_balance a
    WHERE d.date >= date_trunc('day', a.created_at)
),
-- =================================================================
-- Final Step: Select the balance from the LAST DAY of each month.
-- =================================================================
monthly_balances AS (
    SELECT DISTINCT ON (date_trunc('month', date))
        date_trunc('month', date)::TIMESTAMPTZ AS month,
        daily_balance,
        type
    FROM balance_timeseries
    ORDER BY date_trunc('month', date), date DESC
)
SELECT
    mb.month,
    (CASE WHEN mb.type IN ('credit', 'loan') THEN mb.daily_balance * -1 ELSE mb.daily_balance END)::DECIMAL AS balance
FROM monthly_balances mb
ORDER BY mb.month;



-- name: GetAccountBalanceTimeline :many
-- Changed to :many as it returns multiple rows (one per month)
WITH relevant_period AS (
    SELECT
        date_trunc('month', now()) - INTERVAL '11 months' AS start_month,
        date_trunc('month', now()) AS end_month,
        now() - INTERVAL '1 year' AS start_boundary
),
months AS (
    -- Generate months for the relevant period
    SELECT generate_series(
        (SELECT start_month FROM relevant_period),
        (SELECT end_month FROM relevant_period),
        INTERVAL '1 month'
    ) AS month
),
account_info AS (
    -- Get account creation date
    SELECT created_at
    FROM accounts
    WHERE accounts.id = $1
),
initial_balance AS (
     -- Calculate balance for the specific account just BEFORE the start_month
    SELECT
        COALESCE(sum(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = $1 THEN -t.amount -- Source
                WHEN t.type = 'transfer' AND t.destination_account_id = $1 THEN t.amount -- Destination
                ELSE 0
            END
        ), 0)::DECIMAL AS balance_before_period
    FROM transactions t
    WHERE t.account_id = $1 OR t.destination_account_id = $1 -- Consider transfers in/out
      AND t.transaction_datetime < (SELECT start_month FROM relevant_period)
      -- Assuming created_by check is handled by ensuring $1 belongs to the user in app logic
),
monthly_transactions AS (
    -- Aggregate transactions per month for the specific account WITHIN the period
    SELECT
        date_trunc('month', t.transaction_datetime) AS month,
        sum(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = $1 THEN -t.amount -- Source
                WHEN t.type = 'transfer' AND t.destination_account_id = $1 THEN t.amount -- Destination
                ELSE 0
            END
        ) AS monthly_net
    FROM transactions t
    WHERE (t.account_id = $1 OR t.destination_account_id = $1) -- Consider transfers in/out
      AND t.transaction_datetime >= (SELECT start_month FROM relevant_period)
      AND t.transaction_datetime < ( (SELECT end_month FROM relevant_period) + INTERVAL '1 month')
    GROUP BY month
),
combined AS (
    -- Combine months, initial balance, and monthly nets
    SELECT
        m.month,
        COALESCE(ib.balance_before_period, 0) AS initial_balance,
        COALESCE(mt.monthly_net, 0) AS monthly_net
    FROM months m
    CROSS JOIN initial_balance ib
    LEFT JOIN monthly_transactions mt ON m.month = mt.month
    JOIN account_info ai ON m.month >= date_trunc('month', ai.created_at) -- Filter months before account creation
),
running_balance AS (
    -- Compute cumulative balance including the initial balance
    SELECT
        c.month,
        c.initial_balance + sum(c.monthly_net) OVER (
            ORDER BY c.month
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS balance
    FROM combined c
)
SELECT
    month::TIMESTAMPTZ,
    balance::DECIMAL
FROM running_balance
ORDER BY month;


-- name: GetAccountsWithTrend :many
WITH period AS (
    SELECT
        $1::TIMESTAMPTZ AS start_date,
        $2::TIMESTAMPTZ AS end_date
),

date_series AS (
    SELECT generate_series(
        (SELECT start_date FROM period),
        (SELECT end_date FROM period),
        '1 day'
    )::DATE AS date
),

account_info AS (
    -- Get account info, including creation date
    SELECT
        id AS account_id,
        name,
        type,
        subtype,
        currency,
        color,
        meta,
        created_by,
        created_at,
        updated_at,
        deleted_at
    FROM accounts
    WHERE accounts.created_by = sqlc.arg('user_id')
    -- Include accounts active at any point during the period
    AND created_at <= (SELECT end_date FROM period)
    AND (deleted_at IS NULL OR deleted_at > (SELECT start_date FROM period))
),

balance_calc AS (
    -- Calculate balance at the start and end of the period for each account
    SELECT
        ai.account_id,
        -- Balance just BEFORE start_date
        coalesce(sum(
            CASE
                WHEN t.transaction_datetime < (SELECT start_date FROM period) THEN
                    CASE
                        WHEN t.type = 'income' THEN t.amount
                        WHEN t.type = 'expense' THEN -t.amount
                        WHEN t.type = 'transfer' AND t.account_id = t.account_id THEN -t.amount
                        WHEN t.type = 'transfer' AND t.account_id = t.destination_account_id THEN t.amount
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0)::DECIMAL AS start_balance,
        -- Balance AT end_date (inclusive)
        coalesce(sum(
            CASE
                WHEN t.transaction_datetime <= (SELECT end_date FROM period)
                    THEN
                        CASE
                            WHEN t.type = 'income' THEN t.amount
                            WHEN t.type = 'expense' THEN -t.amount
                            WHEN t.type = 'transfer' AND t.account_id = t.account_id THEN -t.amount
                            WHEN t.type = 'transfer' AND t.account_id = t.destination_account_id THEN t.amount
                            ELSE 0
                        END
                ELSE 0
            END
        ), 0)::DECIMAL AS end_balance
    FROM transactions t
    JOIN account_info ai ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
    WHERE t.created_by = sqlc.arg('user_id')
      AND t.transaction_datetime <= (SELECT end_date FROM period)
      -- Filter transactions related to the accounts active in the period
    GROUP BY ai.account_id
),

account_trend AS (
    -- Calculate trend percentage based on actual start/end balances
    SELECT
        ai.account_id,
        ai.name,
        ai.type,
        ai.subtype,
        coalesce(bc.end_balance, 0) AS balance, -- Current balance is the end_balance
        ai.currency,
        ai.color,
        ai.meta,
        ai.updated_at,
        CASE
            -- Avoid division by zero if start_balance is 0
            WHEN coalesce(bc.start_balance, 0) = 0 THEN
                CASE
                    -- If end balance is also 0, trend is 0
                    WHEN coalesce(bc.end_balance, 0) = 0 THEN 0
                    -- If start is 0 but end is positive/negative, trend is infinite (represent as 100% or specific value?)
                    -- Let's return 100% if end > start (0), -100% if end < start (0). Or null? Let's use 100/-100 for simplicity.
                    WHEN coalesce(bc.end_balance, 0) > 0 THEN 100.0
                    ELSE -100.0 -- or potentially 0 or NULL depending on desired behaviour
                END
            -- Normal trend calculation
            ELSE
                ( (coalesce(bc.end_balance, 0) - bc.start_balance) / ABS(bc.start_balance) * 100.0 )
        END::DECIMAL AS trend
    FROM account_info ai
    LEFT JOIN balance_calc bc ON ai.account_id = bc.account_id
    -- Ensure we only consider the balance if the account existed at the start date for trend calculation
    -- If created within the period, trend starts from 0.
    WHERE ai.created_at <= (SELECT end_date FROM period) -- Redundant check, but safe
      AND (ai.deleted_at IS NULL OR ai.deleted_at > (SELECT start_date FROM period)) -- Ensure not deleted before period start
),

balance_timeseries AS (
    SELECT
        ai.account_id,
        ds.date,
        sum(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                ELSE 0
            END
        )::DECIMAL AS cumulative_balance
    FROM account_info ai
    CROSS JOIN date_series ds
    LEFT JOIN transactions t
        ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
       AND t.transaction_datetime <= ds.date + interval '1 day' - interval '1 second'
       AND t.created_by = sqlc.arg('user_id')
    GROUP BY ai.account_id, ds.date
),

aggregated_series AS (
    SELECT
        account_id,
        jsonb_agg(
            jsonb_build_object(
                'date', date,
                'balance', cumulative_balance
            ) ORDER BY date
        ) AS timeseries
    FROM balance_timeseries
    GROUP BY account_id
)
-- Final query joining trend with last 3 transactions
SELECT
    at.account_id as id,
    at.name,
    at.type,
    at.subtype,
    at.balance::DECIMAL as balance, -- Balance at the end_date
    at.currency,
    at.color,
    at.meta,
    at.updated_at,
    at.trend::DECIMAL as trend,
    coalesce(agg.timeseries, '[]'::JSONB)::JSONB AS balance_timeseries
FROM account_trend at
LEFT JOIN aggregated_series agg ON at.account_id = agg.account_id
ORDER BY at.name; -- Or other desired order

-- name: GetAccountByProviderAccountID :one
SELECT
    id,
    name,
    type,
    subtype,
    balance,
    currency,
    color,
    meta,
    created_by,
    updated_at,
    connection_id,
    provider_name,
    provider_account_id
FROM accounts
WHERE
    provider_account_id = $1
    AND created_by = $2 -- user_id
    AND deleted_at IS NULL
LIMIT 1;


-- name: GetAccountsByConnectionID :many
SELECT
    id,
    name,
    type,
    subtype,
    balance,
    currency,
    color,
    meta,
    created_by,
    updated_at,
    connection_id,
    provider_name,
    provider_account_id
FROM accounts
WHERE
    connection_id = $1
    AND created_by = $2 -- user_id
    AND deleted_at IS NULL;
