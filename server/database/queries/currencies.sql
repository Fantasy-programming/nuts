-- name: GetCurrencies :many
SELECT
    code,
    name
FROM currencies;


-- name: UpsertExchangeRate :exec
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date)
VALUES ($1, $2, $3, $4)
ON CONFLICT (from_currency, to_currency, effective_date)
DO UPDATE SET 
    rate = EXCLUDED.rate,
    updated_at = NOW();

-- name: GetExchangeRate :one
SELECT rate FROM exchange_rates
WHERE from_currency = $1 AND to_currency = $2 AND effective_date = $3;

-- name: GetLatestExchangeRate :one
SELECT rate, effective_date FROM exchange_rates
WHERE from_currency = $1 AND to_currency = $2
ORDER BY effective_date DESC
LIMIT 1;

-- name: ExchangeRateExistsForDate :one
SELECT EXISTS(
    SELECT 1 FROM exchange_rates 
    WHERE from_currency = $1 AND effective_date = $2
);

-- name: GetExchangeRatesForDate :many
SELECT from_currency, to_currency, rate FROM exchange_rates
WHERE effective_date = $1;

-- name: GetAccountCurrency :one
SELECT currency FROM accounts WHERE id = $1;

-- name: ConvertAmount :one
SELECT 
    CASE 
        WHEN $1 = $2 THEN $3  -- Same currency, no conversion needed
        ELSE $3 * (
            SELECT rate FROM exchange_rates
            WHERE from_currency = $1 AND to_currency = $2 
            ORDER BY effective_date DESC 
            LIMIT 1
        )
    END as converted_amount;

-- name: GetTransactionWithCurrency :one
SELECT 
    t.*,
    a.currency as account_currency,
    CASE 
        WHEN t.transaction_currency = a.currency THEN t.amount
        ELSE t.original_amount * t.exchange_rate
    END as display_amount
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE t.id = $1;

-- name: GetUserNetWorthInBaseCurrency :one
WITH account_balances AS (
    SELECT 
        a.id,
        a.currency,
        COALESCE(SUM(
            CASE 
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = a.id THEN t.amount
                ELSE 0
            END
        ), 0) as balance
    FROM accounts a
    LEFT JOIN transactions t ON (t.account_id = a.id OR t.destination_account_id = a.id)
        AND t.deleted_at IS NULL
    WHERE a.created_by = $1 AND a.deleted_at IS NULL
    GROUP BY a.id, a.currency
),
converted_balances AS (
    SELECT 
        ab.balance * COALESCE(er.rate, 1.0) as converted_balance
    FROM account_balances ab
    LEFT JOIN exchange_rates er ON (
        er.from_currency = ab.currency 
        AND er.to_currency = $2
        AND er.effective_date = (
            SELECT MAX(effective_date) 
            FROM exchange_rates er2 
            WHERE er2.from_currency = ab.currency 
                AND er2.to_currency = $2
                AND er2.effective_date <= CURRENT_DATE
        )
    )
    WHERE ab.balance != 0
)
SELECT COALESCE(SUM(converted_balance), 0) as net_worth
FROM converted_balances;
