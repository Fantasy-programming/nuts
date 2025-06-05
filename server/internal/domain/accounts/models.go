package accounts

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
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
    -- Get account info, including creation date and external account flags
    SELECT
        id AS account_id,
        name,
        type,
        balance AS db_balance, -- Store the database balance for external accounts
        currency,
        color,
        meta,
        created_by,
        created_at,
        updated_at,
        deleted_at,
        is_external,
        provider_account_id,
        provider_name
    FROM accounts
    WHERE accounts.created_by = $3
    -- Include accounts active at any point during the period
    AND created_at <= (SELECT end_date FROM period)
    AND deleted_at IS NULL
),

balance_calc AS (
    -- Calculate balance at the start and end of the period for each account
    -- Only for non-external accounts or external accounts with transactions
    SELECT
        ai.account_id,
        ai.is_external,
        ai.db_balance,
        -- Balance just BEFORE start_date
        coalesce(sum(
            CASE
                WHEN t.transaction_datetime < (SELECT start_date FROM period) THEN
                    CASE
                        WHEN t.type = 'income' THEN t.amount
                        WHEN t.type = 'expense' THEN -t.amount
                        WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                        WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0)::DECIMAL AS calculated_start_balance,
        -- Balance AT end_date (inclusive)
        coalesce(sum(
            CASE
                WHEN t.transaction_datetime <= (SELECT end_date FROM period)
                    THEN
                        CASE
                            WHEN t.type = 'income' THEN t.amount
                            WHEN t.type = 'expense' THEN -t.amount
                            WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                            WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                            ELSE 0
                        END
                ELSE 0
            END
        ), 0)::DECIMAL AS calculated_end_balance,
        -- Count transactions to determine if we have transaction data
        COUNT(t.id) AS transaction_count
    FROM account_info ai
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.created_by = $3
        AND t.transaction_datetime <= (SELECT end_date FROM period)
    GROUP BY ai.account_id, ai.is_external, ai.db_balance
),

account_trend AS (
    -- Calculate trend percentage, using DB balance for external accounts without transactions
    SELECT
        ai.account_id,
        ai.name,
        ai.type,
        -- Use DB balance for external accounts, calculated balance for internal accounts
        CASE
            WHEN ai.is_external AND (bc.transaction_count = 0 OR bc.transaction_count IS NULL) THEN ai.db_balance
            ELSE coalesce(bc.calculated_end_balance, 0)
        END AS balance,
        ai.currency,
        ai.color,
        ai.meta,
        ai.updated_at,
        ai.is_external,
        -- Calculate trend based on whether account is external with/without transactions
        CASE
            -- For external accounts without transactions, we can't calculate trend reliably
            WHEN ai.is_external AND (bc.transaction_count = 0 OR bc.transaction_count IS NULL) THEN 0.0
            -- For accounts with transactions, calculate trend normally
            WHEN coalesce(bc.calculated_start_balance, 0) = 0 THEN
                CASE
                    WHEN coalesce(bc.calculated_end_balance, 0) = 0 THEN 0
                    WHEN coalesce(bc.calculated_end_balance, 0) > 0 THEN 100.0
                    ELSE -100.0
                END
            ELSE
                ( (coalesce(bc.calculated_end_balance, 0) - bc.calculated_start_balance) / ABS(bc.calculated_start_balance) * 100.0 )
        END::DECIMAL AS trend
    FROM account_info ai
    LEFT JOIN balance_calc bc ON ai.account_id = bc.account_id
    WHERE ai.created_at <= (SELECT end_date FROM period)
      AND ai.deleted_at IS NULL
),

balance_timeseries AS (
    SELECT
        ai.account_id,
        ds.date,
        CASE
            -- For external accounts without transactions, use the DB balance for all dates
            WHEN ai.is_external AND NOT EXISTS (
                SELECT 1 FROM transactions t 
                WHERE (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
                AND t.created_by = $3
            ) THEN ai.db_balance
            -- For accounts with transactions, calculate cumulative balance
            ELSE sum(
                CASE
                    WHEN t.type = 'income' THEN t.amount
                    WHEN t.type = 'expense' THEN -t.amount
                    WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                    WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                    ELSE 0
                END
            )
        END::DECIMAL AS cumulative_balance
    FROM account_info ai
    CROSS JOIN date_series ds
    LEFT JOIN transactions t
        ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
       AND t.transaction_datetime <= ds.date + interval '1 day' - interval '1 second'
       AND t.created_by = $3
    GROUP BY ai.account_id, ds.date, ai.is_external, ai.db_balance
),

aggregated_series AS (
    SELECT
        account_id,
        jsonb_agg(
            jsonb_build_object(
                'date', date::timestamptz,
                'balance', coalesce(cumulative_balance, 0)
            ) ORDER BY date
        ) AS timeseries
    FROM balance_timeseries
    GROUP BY account_id
)
SELECT
    at.account_id as id,
    at.name,
    at.type,
    at.balance::DECIMAL as balance,
    at.currency,
    at.color,
    at.meta,
    at.updated_at,
    at.trend::DECIMAL as trend,
    coalesce(agg.timeseries, '[]'::JSONB)::JSONB AS balance_timeseries,
    at.is_external
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
