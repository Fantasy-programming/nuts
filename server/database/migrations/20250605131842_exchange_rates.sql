-- +goose Up

-- Table to store exchange rates
CREATE TABLE exchange_rates (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    from_currency CHAR(3) NOT NULL REFERENCES currencies(code),
    to_currency CHAR(3) NOT NULL REFERENCES currencies(code),
    rate DECIMAL(20, 8) NOT NULL, -- High precision for exchange rates
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    CONSTRAINT exchange_rates_pkey PRIMARY KEY (id),
    CONSTRAINT exchange_rates_unique_rate UNIQUE (from_currency, to_currency, effective_date),
    CONSTRAINT exchange_rates_different_currencies CHECK (from_currency != to_currency)
);

-- Index for fast lookups
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates (from_currency, to_currency, effective_date DESC);
CREATE INDEX idx_exchange_rates_date ON exchange_rates (effective_date DESC);

-- Add currency-related fields to transactions table
ALTER TABLE transactions ADD COLUMN transaction_currency CHAR(3) REFERENCES currencies(code);
ALTER TABLE transactions ADD COLUMN original_amount NUMERIC; -- Amount in transaction currency
ALTER TABLE transactions ADD COLUMN exchange_rate DECIMAL(20, 8); -- Rate used for conversion
ALTER TABLE transactions ADD COLUMN exchange_rate_date DATE; -- Date of exchange rate used

-- Set default values for existing transactions (assumes they're in account currency)
UPDATE transactions SET 
    transaction_currency = (SELECT currency FROM accounts WHERE accounts.id = transactions.account_id),
    original_amount = amount,
    exchange_rate = 1.0,
    exchange_rate_date = CURRENT_DATE
WHERE transaction_currency IS NULL;

-- Make transaction_currency NOT NULL after populating existing data
ALTER TABLE transactions ALTER COLUMN transaction_currency SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN original_amount SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX idx_transactions_currency ON transactions (transaction_currency);
CREATE INDEX idx_transactions_exchange_rate_date ON transactions (exchange_rate_date);

-- Add constraint to ensure consistency
-- +goose StatementBegin
CREATE FUNCTION check_exchange_rate_consistency() RETURNS trigger AS $$
DECLARE
    acct_currency TEXT;
BEGIN
    SELECT currency INTO acct_currency FROM accounts WHERE id = NEW.account_id;

    IF NEW.transaction_currency = acct_currency AND NEW.exchange_rate != 1.0 THEN
        RAISE EXCEPTION 'Exchange rate must be 1.0 when currencies match';
    ELSIF NEW.transaction_currency != acct_currency AND NEW.exchange_rate <= 0 THEN
        RAISE EXCEPTION 'Exchange rate must be > 0 when currencies differ';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER check_exchange_rate_consistency
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_exchange_rate_consistency();

DROP TRIGGER IF EXISTS check_exchange_rate_consistency ON transactions;
DROP FUNCTION IF EXISTS check_exchange_rate_consistency;

CREATE INDEX idx_user_preferences_base_currency ON preferences (currency);

-- +goose Down
DROP INDEX IF EXISTS idx_user_preferences_base_currency;
DROP TRIGGER IF EXISTS check_exchange_rate_consistency ON transactions;
DROP FUNCTION IF EXISTS check_exchange_rate_consistency;
DROP INDEX IF EXISTS idx_transactions_exchange_rate_date;
DROP INDEX IF EXISTS idx_transactions_currency;
ALTER TABLE transactions DROP COLUMN IF EXISTS exchange_rate_date;
ALTER TABLE transactions DROP COLUMN IF EXISTS exchange_rate;
ALTER TABLE transactions DROP COLUMN IF EXISTS original_amount;
ALTER TABLE transactions DROP COLUMN IF EXISTS transaction_currency;
DROP TABLE IF EXISTS exchange_rates;
