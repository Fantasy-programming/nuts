-- name: CreateAccount :one
INSERT INTO accounts (
    created_by,
    name,
    type,
    subtype,
    balance,
    currency,
    meta,
    connection_id,
    is_external,
    provider_account_id,
    provider_name
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;


-- name: BatchCreateAccount :copyfrom
INSERT INTO accounts (
    created_by,
    name,
    type,
    subtype,
    balance,
    currency,
    meta,
    connection_id,
    is_external,
    provider_account_id,
    provider_name
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
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
WITH relevant_period AS (
    SELECT
        date_trunc('month', now()) - INTERVAL '11 months' AS start_month,
        date_trunc('month', now()) AS end_month
),
months AS (
    SELECT generate_series(
        (SELECT start_month FROM relevant_period),
        (SELECT end_month FROM relevant_period),
        INTERVAL '1 month'
    ) AS month
),
account_info AS (
    SELECT
        id AS account_id,
        created_at,
        is_external,
        balance AS db_balance
    FROM accounts
    WHERE
        deleted_at IS NULL
        AND accounts.created_by = sqlc.arg('user_id')
),
-- Get all transactions for each account to understand what data we have
account_transaction_summary AS (
    SELECT
        ai.account_id,
        COUNT(t.id) AS total_transaction_count,
        MIN(t.transaction_datetime) AS earliest_transaction_date,
        MAX(t.transaction_datetime) AS latest_transaction_date,
        -- Sum of all transactions we have for this account
        SUM(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                ELSE 0
            END
        ) AS total_transaction_impact
    FROM account_info ai
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.created_by = sqlc.arg('user_id')
    GROUP BY ai.account_id
),
-- Calculate transactions that happened before our timeline period
pre_timeline_transactions AS (
    SELECT
        ai.account_id,
        SUM(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                ELSE 0
            END
        ) AS pre_timeline_impact
    FROM account_info ai
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.transaction_datetime < (SELECT start_month FROM relevant_period)
        AND t.created_by = sqlc.arg('user_id')
    GROUP BY ai.account_id
),
-- Calculate transactions within our timeline period
timeline_transactions AS (
    SELECT
        ai.account_id,
        SUM(
            CASE
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                ELSE 0
            END
        ) AS timeline_impact
    FROM account_info ai
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.transaction_datetime >= (SELECT start_month FROM relevant_period)
        AND t.transaction_datetime < ((SELECT end_month FROM relevant_period) + INTERVAL '1 month')
        AND t.created_by = sqlc.arg('user_id')
    GROUP BY ai.account_id
),
-- Determine the correct initial balance for the start of our timeline
initial_balances AS (
    SELECT
        ai.account_id,
        ai.is_external,
        ai.db_balance,
        ai.created_at,
        ats.total_transaction_count,
        ats.earliest_transaction_date,
        CASE
            -- Internal accounts: Calculate from all pre-timeline transactions
            WHEN NOT ai.is_external THEN 
                COALESCE(ptt.pre_timeline_impact, 0)
            
            -- External accounts with NO transactions at all: Use DB balance
            WHEN ai.is_external AND (ats.total_transaction_count = 0 OR ats.total_transaction_count IS NULL) THEN 
                ai.db_balance
            
            -- External accounts WITH transactions: Work backwards from current balance
            -- Current balance = initial_balance + all_transaction_impacts
            -- Therefore: initial_balance = current_balance - all_transaction_impacts
            WHEN ai.is_external AND ats.total_transaction_count > 0 THEN 
                ai.db_balance - COALESCE(ats.total_transaction_impact, 0)
            
            ELSE 0
        END AS calculated_initial_balance
    FROM account_info ai
    LEFT JOIN account_transaction_summary ats ON ai.account_id = ats.account_id
    LEFT JOIN pre_timeline_transactions ptt ON ai.account_id = ptt.account_id
    LEFT JOIN timeline_transactions tt ON ai.account_id = tt.account_id
),
-- Monthly transaction aggregation within our timeline
monthly_transactions AS (
    SELECT
        ai.account_id,
        date_trunc('month', t.transaction_datetime) AS month,
        SUM(
            CASE
                 WHEN t.type = 'income' THEN t.amount
                 WHEN t.type = 'expense' THEN -t.amount
                 WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                 WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                 ELSE 0
            END
        ) AS monthly_net
    FROM transactions t
    JOIN account_info ai ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
    WHERE t.transaction_datetime >= (SELECT start_month FROM relevant_period)
      AND t.transaction_datetime < ((SELECT end_month FROM relevant_period) + INTERVAL '1 month')
      AND t.created_by = '323e5fb0-5175-4292-be64-60f48c8cff49'
    GROUP BY ai.account_id, month
),
-- Combine everything: accounts, months, and their balances
combined AS (
    SELECT
        m.month,
        ai.account_id,
        ai.is_external,
        ai.db_balance,
        ib.calculated_initial_balance AS initial_balance,
        COALESCE(mt.monthly_net, 0) AS monthly_net,
        ib.total_transaction_count,
        -- Determine when this account should start appearing in timeline
        CASE 
            WHEN ai.is_external THEN (SELECT start_month FROM relevant_period)
            ELSE GREATEST(
                date_trunc('month', ai.created_at),
                (SELECT start_month FROM relevant_period)
            )
        END AS account_start_month
    FROM months m
    CROSS JOIN account_info ai
    LEFT JOIN initial_balances ib ON ai.account_id = ib.account_id
    LEFT JOIN monthly_transactions mt ON ai.account_id = mt.account_id AND m.month = mt.month
    -- Determine when accounts should start appearing in timeline
    WHERE 
        -- Internal accounts: from creation date or timeline start, whichever is later
        (NOT ai.is_external AND m.month >= GREATEST(
            date_trunc('month', ai.created_at),
            (SELECT start_month FROM relevant_period)
        ))
        OR
        -- External accounts: from timeline start (they represent pre-existing accounts)
        (ai.is_external AND m.month >= (SELECT start_month FROM relevant_period))
),
-- Calculate running balances
running_balance AS (
    SELECT
        c.month,
        c.account_id,
        c.is_external,
        c.db_balance,
        c.total_transaction_count,
        CASE
            -- External accounts with NO transactions: Use DB balance (flat line)
            WHEN c.is_external AND (c.total_transaction_count = 0 OR c.total_transaction_count IS NULL) THEN 
                c.db_balance
            
            -- All other accounts: Calculate running balance from initial + cumulative monthly changes
            ELSE c.initial_balance + SUM(c.monthly_net) OVER (
                PARTITION BY c.account_id
                ORDER BY c.month
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
        END AS balance
    FROM combined c
)
-- Final aggregation: Sum all account balances per month
SELECT
    rb.month::TIMESTAMPTZ as month,
    SUM(rb.balance)::DECIMAL AS balance
FROM running_balance rb
GROUP BY rb.month
ORDER BY rb.month;



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
