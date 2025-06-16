package accounts

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const getAccountsWithTrendSQL = `-- name: GetAccountsWithTrend :many
WITH
-- =================================================================
-- Step 1: Define the reporting period and the user's base currency
-- =================================================================
period AS (
    SELECT $1::TIMESTAMPTZ AS start_date, $2::TIMESTAMPTZ AS end_date
),
user_base_currency AS (
    SELECT COALESCE((SELECT currency FROM preferences WHERE user_id = $3 LIMIT 1), 'USD') AS base_currency
),
-- =================================================================
-- Step 2: Unify all raw transaction "movements" into a single stream.
-- =================================================================
all_movements AS (
    SELECT t.account_id, t.transaction_datetime, t.amount, t.transaction_currency FROM transactions t
    WHERE t.created_by = $3 AND t.deleted_at IS NULL AND t.type IN ('income', 'expense')
    UNION ALL
    SELECT t.account_id, t.transaction_datetime, -t.amount AS amount, t.transaction_currency FROM transactions t
    WHERE t.created_by = $3 AND t.deleted_at IS NULL AND t.type = 'transfer'
    UNION ALL
    SELECT t.destination_account_id AS account_id, t.transaction_datetime, t.amount, t.transaction_currency FROM transactions t
    WHERE t.created_by = $3 AND t.deleted_at IS NULL AND t.type = 'transfer' AND t.destination_account_id IS NOT NULL
),
-- =================================================================
-- Step 3: Convert all movements to the user's base currency, ensuring one rate per transaction.
-- =================================================================
transactions_converted AS (
    SELECT
        m.account_id,
        m.transaction_datetime,
        (m.amount * COALESCE(er.rate, 1.0))::DECIMAL AS converted_amount
    FROM all_movements m
    LEFT JOIN LATERAL (
        SELECT rate FROM exchange_rates er
        WHERE er.from_currency = m.transaction_currency
          AND er.to_currency = (SELECT base_currency FROM user_base_currency)
          AND er.effective_date <= m.transaction_datetime::DATE
        ORDER BY er.effective_date DESC
        LIMIT 1
    ) er ON TRUE
    WHERE m.account_id IS NOT NULL
),
-- =================================================================
-- Step 4: Calculate daily net changes (deltas) for each account.
-- =================================================================
daily_deltas AS (
    SELECT
        account_id,
        date_trunc('day', transaction_datetime)::DATE AS date,
        SUM(converted_amount) AS delta
    FROM transactions_converted
    GROUP BY account_id, date_trunc('day', transaction_datetime)
),
-- =================================================================
-- Step 5: Determine the authoritative "anchor" balance for each account.
-- =================================================================
accounts_with_anchor_balance AS (
    SELECT
        a.id AS account_id,
        a.name, a.type, a.color, a.meta, a.is_external, a.created_at, a.updated_at,
        CASE
            WHEN a.is_external THEN (a.balance * COALESCE(er.rate, 1.0))::DECIMAL
            ELSE COALESCE((SELECT SUM(tc.converted_amount) FROM transactions_converted tc WHERE tc.account_id = a.id), 0)
        END AS anchor_balance,
        CASE
            WHEN a.is_external THEN a.updated_at
            ELSE NOW()
        END AS anchor_date
    FROM accounts a
    LEFT JOIN LATERAL (
        SELECT rate FROM exchange_rates er
        WHERE er.from_currency = a.currency
          AND er.to_currency = (SELECT base_currency FROM user_base_currency)
          AND er.effective_date <= a.updated_at::DATE
        ORDER BY er.effective_date DESC
        LIMIT 1
    ) er ON TRUE
    WHERE a.created_by = $3 AND a.deleted_at IS NULL
),
-- =================================================================
-- Step 6: Generate the daily balance timeseries by working backward.
-- =================================================================
balance_timeseries AS (
    SELECT
        a.account_id,
        d.date,
        (
            a.anchor_balance -
            COALESCE((
                SELECT SUM(delta) FROM daily_deltas dd
                WHERE dd.account_id = a.account_id
                  AND dd.date > (SELECT end_date FROM period)::DATE
                  AND dd.date <= a.anchor_date::DATE
            ), 0)
        )
        -
        COALESCE((
            SELECT SUM(delta) FROM daily_deltas dd
            WHERE dd.account_id = a.account_id
              AND dd.date > d.date
              AND dd.date <= (SELECT end_date FROM period)::DATE
        ), 0) AS daily_balance
    FROM
        generate_series(
            (SELECT start_date FROM period)::DATE,
            (SELECT end_date FROM period)::DATE,
            '1 day'::interval
        ) AS d(date)
    CROSS JOIN accounts_with_anchor_balance a
    -- By removing the "WHERE d.date >= a.created_at" clause, we now generate
    -- a full timeseries for ALL accounts over the entire requested period.
),
-- =================================================================
-- Step 7: Aggregate the timeseries into JSON and get period start/end balances.
-- =================================================================
aggregated_series AS (
    SELECT
        bt.account_id,
        jsonb_agg(
            jsonb_build_object(
                'date', bt.date,
                'balance',
                CASE WHEN a.type IN ('credit', 'loan') THEN bt.daily_balance * -1 ELSE bt.daily_balance END
            ) ORDER BY bt.date
        ) AS timeseries,
        (array_agg(bt.daily_balance ORDER BY bt.date ASC))[1] AS start_balance,
        (array_agg(bt.daily_balance ORDER BY bt.date DESC))[1] AS end_balance
    FROM balance_timeseries bt
    JOIN accounts a ON bt.account_id = a.id
    GROUP BY bt.account_id
)
-- =================================================================
-- Final Step: Combine all data for the final output.
-- =================================================================
SELECT
    a.account_id AS id,
    a.name,
    a.type,
    (CASE WHEN a.type IN ('credit', 'loan') THEN agg.end_balance * -1 ELSE agg.end_balance END)::DECIMAL AS balance,
    (SELECT base_currency FROM user_base_currency) AS currency,
    a.color,
    a.meta,
    a.updated_at,
    a.is_external,
    COALESCE(
        CASE
            WHEN agg.start_balance = 0 THEN
                CASE
                    WHEN agg.end_balance > 0 THEN 100.0
                    WHEN agg.end_balance < 0 THEN -100.0
                    ELSE 0.0
                END
            WHEN a.type IN ('credit', 'loan') THEN
                ((agg.start_balance - agg.end_balance) / NULLIF(ABS(agg.start_balance), 0)) * 100.0
            ELSE
                ((agg.end_balance - agg.start_balance) / NULLIF(ABS(agg.start_balance), 0)) * 100.0
        END
    , 0)::DECIMAL AS trend,
    agg.timeseries AS balance_timeseries
FROM accounts_with_anchor_balance a
JOIN aggregated_series agg ON a.account_id = agg.account_id
-- We still only want to show accounts that actually existed during the period.
WHERE a.created_at <= (SELECT end_date FROM period)
ORDER BY a.name;
`

type AccountWithTrend struct {
	ID                uuid.UUID              `json:"id"`
	Name              string                 `json:"name"`
	Type              repository.ACCOUNTTYPE `json:"type"`
	Balance           pgtype.Numeric         `json:"balance"`
	Currency          string                 `json:"currency"`
	Color             repository.COLORENUM   `json:"color"`
	Meta              dto.AccountMeta        `json:"meta"`
	UpdatedAt         time.Time              `json:"updated_at"`
	Trend             pgtype.Numeric         `json:"trend"`
	BalanceTimeseries []BalancePoint         `json:"balance_timeseries"`
	IsExternal        bool                   `json:"is_external"`
}

type BalancePoint struct {
	Date    time.Time `json:"date"`
	Balance float64   `json:"balance"`
}

// We need to split those i guess

type UserFinancialConnection struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	ProviderName         string     `json:"provider_name" db:"provider_name"`
	AccessTokenEncrypted string     `json:"-" db:"access_token_encrypted"` // Never expose in JSON
	ItemID               *string    `json:"item_id" db:"item_id"`
	InstitutionID        *string    `json:"institution_id" db:"institution_id"`
	InstitutionName      *string    `json:"institution_name" db:"institution_name"`
	Status               string     `json:"status" db:"status"`
	LastSyncAt           *time.Time `json:"last_sync_at" db:"last_sync_at"`
	ExpiresAt            *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}

type FinancialSyncJob struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	UserID             uuid.UUID  `json:"user_id" db:"user_id"`
	ConnectionID       uuid.UUID  `json:"connection_id" db:"connection_id"`
	ProviderName       string     `json:"provider_name" db:"provider_name"`
	JobType            string     `json:"job_type" db:"job_type"`
	Status             string     `json:"status" db:"status"`
	StartedAt          *time.Time `json:"started_at" db:"started_at"`
	CompletedAt        *time.Time `json:"completed_at" db:"completed_at"`
	ErrorMessage       *string    `json:"error_message" db:"error_message"`
	AccountsSynced     int        `json:"accounts_synced" db:"accounts_synced"`
	TransactionsSynced int        `json:"transactions_synced" db:"transactions_synced"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
}
