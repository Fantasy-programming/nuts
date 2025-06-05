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
    SELECT
        id AS account_id,
        name,
        type,
        balance AS db_balance,
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
    AND created_at <= (SELECT end_date FROM period)
    AND deleted_at IS NULL
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
        AND t.created_by = $3
    GROUP BY ai.account_id
),

-- Calculate the correct initial balance for the start of the period
initial_balances AS (
    SELECT
        ai.account_id,
        ai.is_external,
        ai.db_balance,
        ats.total_transaction_count,
        -- Calculate balance at start of period
        CASE
            -- Internal accounts: Calculate from transactions before start_date
            WHEN NOT ai.is_external THEN 
                COALESCE(SUM(
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
                ), 0)
            
            -- External accounts with NO transactions: Use DB balance
            WHEN ai.is_external AND (ats.total_transaction_count = 0 OR ats.total_transaction_count IS NULL) THEN 
                ai.db_balance
            
            -- External accounts WITH transactions: Work backwards from current balance
            WHEN ai.is_external AND ats.total_transaction_count > 0 THEN 
                ai.db_balance - COALESCE(ats.total_transaction_impact, 0)
            
            ELSE 0
        END AS calculated_start_balance,
        
        -- Calculate balance at end of period
        CASE
            -- External accounts with NO transactions: Use DB balance
            WHEN ai.is_external AND (ats.total_transaction_count = 0 OR ats.total_transaction_count IS NULL) THEN 
                ai.db_balance
            
            -- External accounts WITH transactions: Use DB balance (current balance)
            WHEN ai.is_external AND ats.total_transaction_count > 0 THEN 
                ai.db_balance
            
            -- Internal accounts: Calculate from all transactions up to end_date
            ELSE COALESCE(SUM(
                CASE
                    WHEN t.transaction_datetime <= (SELECT end_date FROM period) THEN
                        CASE
                            WHEN t.type = 'income' THEN t.amount
                            WHEN t.type = 'expense' THEN -t.amount
                            WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                            WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                            ELSE 0
                        END
                    ELSE 0
                END
            ), 0)
        END AS calculated_end_balance
    FROM account_info ai
    LEFT JOIN account_transaction_summary ats ON ai.account_id = ats.account_id
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.created_by = $3
    GROUP BY ai.account_id, ai.is_external, ai.db_balance, ats.total_transaction_count, ats.total_transaction_impact
),

account_trend AS (
    SELECT
        ai.account_id,
        ai.name,
        ai.type,
        ib.calculated_end_balance AS balance,
        ai.currency,
        ai.color,
        ai.meta,
        ai.updated_at,
        ai.is_external,
        -- Calculate trend percentage
        CASE
            WHEN COALESCE(ib.calculated_start_balance, 0) = 0 THEN
                CASE
                    WHEN COALESCE(ib.calculated_end_balance, 0) = 0 THEN 0
                    WHEN COALESCE(ib.calculated_end_balance, 0) > 0 THEN 100.0
                    ELSE -100.0
                END
            ELSE
                ((ib.calculated_end_balance - ib.calculated_start_balance) / ABS(ib.calculated_start_balance) * 100.0)
        END::DECIMAL AS trend
    FROM account_info ai
    LEFT JOIN initial_balances ib ON ai.account_id = ib.account_id
    WHERE ai.created_at <= (SELECT end_date FROM period)
      AND ai.deleted_at IS NULL
),

balance_timeseries AS (
    SELECT
        ai.account_id,
        ds.date,
        CASE
            -- External accounts with NO transactions: Use DB balance (flat line)
            WHEN ai.is_external AND (ib.total_transaction_count = 0 OR ib.total_transaction_count IS NULL) THEN 
                ai.db_balance
            
            -- All other accounts: Calculate running balance
            ELSE ib.calculated_start_balance + COALESCE(SUM(
                CASE
                    WHEN t.transaction_datetime >= (SELECT start_date FROM period) 
                         AND t.transaction_datetime <= ds.date + interval '1 day' - interval '1 second' THEN
                        CASE
                            WHEN t.type = 'income' THEN t.amount
                            WHEN t.type = 'expense' THEN -t.amount
                            WHEN t.type = 'transfer' AND t.account_id = ai.account_id THEN -t.amount
                            WHEN t.type = 'transfer' AND t.destination_account_id = ai.account_id THEN t.amount
                            ELSE 0
                        END
                    ELSE 0
                END
            ), 0)
        END::DECIMAL AS daily_balance
    FROM account_info ai
    CROSS JOIN date_series ds
    LEFT JOIN initial_balances ib ON ai.account_id = ib.account_id
    LEFT JOIN transactions t ON (t.account_id = ai.account_id OR t.destination_account_id = ai.account_id)
        AND t.created_by = $3
    -- Only show accounts from when they should appear in timeline
    WHERE CASE
        -- Internal accounts: from creation date or period start, whichever is later
        WHEN NOT ai.is_external THEN ds.date >= GREATEST(
            ai.created_at::DATE,
            (SELECT start_date FROM period)::DATE
        )
        -- External accounts: from period start
        ELSE ds.date >= (SELECT start_date FROM period)::DATE
    END
    GROUP BY ai.account_id, ds.date, ai.is_external, ai.db_balance, ib.calculated_start_balance, ib.total_transaction_count
),

aggregated_series AS (
    SELECT
        account_id,
        jsonb_agg(
            jsonb_build_object(
                'date', date::timestamptz,
                'balance', COALESCE(daily_balance, 0)
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
    COALESCE(agg.timeseries, '[]'::JSONB)::JSONB AS balance_timeseries,
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
