-- +goose Up
-- Create recurring transactions table
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

    -- Basic transaction details
    amount NUMERIC NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('transfer', 'income', 'expense')),
    description TEXT,
    details JSONB,

    -- Recurrence pattern
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom')),
    frequency_interval INTEGER NOT NULL DEFAULT 1, -- Every X days/weeks/months
    frequency_data JSONB, -- For complex patterns like "first Monday", "last weekday"
 
    -- Date management
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    last_generated_date TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ NOT NULL,

    -- Configuration
    auto_post BOOLEAN NOT NULL DEFAULT FALSE, -- Auto-post vs manual confirmation
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    max_occurrences INTEGER, -- Limit number of occurrences
    occurrences_count INTEGER NOT NULL DEFAULT 0,

    -- Template metadata
    template_name VARCHAR(255),
    tags JSONB,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ
);

-- Add recurring_transaction_id to transactions table
ALTER TABLE transactions ADD COLUMN recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN recurring_instance_date TIMESTAMPTZ; -- The original due date for this instance

-- Create indexes for efficient querying
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_due_date ON recurring_transactions(next_due_date) WHERE deleted_at IS NULL AND is_paused = FALSE;
CREATE INDEX idx_recurring_transactions_account_id ON recurring_transactions(account_id);
CREATE INDEX idx_recurring_transactions_frequency ON recurring_transactions(frequency);
CREATE INDEX idx_transactions_recurring_id ON transactions(recurring_transaction_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
-- Remove trigger
DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;

-- Remove indexes
DROP INDEX IF EXISTS idx_recurring_transactions_user_id;
DROP INDEX IF EXISTS idx_recurring_transactions_next_due_date;
DROP INDEX IF EXISTS idx_recurring_transactions_account_id;
DROP INDEX IF EXISTS idx_recurring_transactions_frequency;
DROP INDEX IF EXISTS idx_transactions_recurring_id;

-- Remove columns from transactions table
ALTER TABLE transactions DROP COLUMN IF EXISTS recurring_instance_date;
ALTER TABLE transactions DROP COLUMN IF EXISTS recurring_transaction_id;

-- Drop recurring transactions table
DROP TABLE IF EXISTS recurring_transactions;
