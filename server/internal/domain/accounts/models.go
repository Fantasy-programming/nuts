package accounts

import (
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const getAccountsWithTrendSQL = `-- name: GetAccountsWithTrend :many
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
        currency,
        color,
        meta,
        created_by,
        created_at,
        updated_at,
        deleted_at
    FROM accounts
    WHERE accounts.created_by = $3
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
    WHERE t.created_by = $3
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
       AND t.created_by = $3
    GROUP BY ai.account_id, ds.date
),

aggregated_series AS (
    SELECT
        account_id,
        jsonb_agg(
            jsonb_build_object(
	              'date', date::timestamptz,
                'balance', cumulative_balance
            ) ORDER BY date
        ) AS timeseries
    FROM balance_timeseries
    GROUP BY account_id
)
SELECT
    at.account_id as id,
    at.name,
    at.type,
    at.balance::DECIMAL as balance, -- Balance at the end_date
    at.currency,
    at.color,
    at.meta,
    at.updated_at,
    at.trend::DECIMAL as trend,
    coalesce(agg.timeseries, '[]'::JSONB)::JSONB AS balance_timeseries
FROM account_trend at
LEFT JOIN aggregated_series agg ON at.account_id = agg.account_id
ORDER BY at.name
`

type AccountWithTrend struct {
	ID                uuid.UUID              `json:"id"`
	Name              string                 `json:"name"`
	Type              repository.ACCOUNTTYPE `json:"type"`
	Balance           pgtype.Numeric         `json:"balance"`
	Currency          string                 `json:"currency"`
	Color             repository.COLORENUM   `json:"color"`
	Meta              []byte                 `json:"meta"`
	UpdatedAt         time.Time              `json:"updated_at"`
	Trend             pgtype.Numeric         `json:"trend"`
	BalanceTimeseries []BalancePoint         `json:"balance_timeseries"`
}

type BalancePoint struct {
	Date    time.Time `json:"date"`
	Balance float64   `json:"balance"`
}
