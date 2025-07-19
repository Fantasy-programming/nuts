-- +goose Up
-- Create the transaction_rules table
CREATE TABLE transaction_rules (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    -- Conditions (stored as JSONB for flexibility)
    conditions JSONB NOT NULL,
    -- Actions (stored as JSONB for flexibility)
    actions JSONB NOT NULL,
    -- Audit fields
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_transaction_rules_created_by ON transaction_rules(created_by);
CREATE INDEX idx_transaction_rules_is_active ON transaction_rules(is_active);
CREATE INDEX idx_transaction_rules_priority ON transaction_rules(priority);
CREATE INDEX idx_transaction_rules_conditions ON transaction_rules USING GIN(conditions);
CREATE INDEX idx_transaction_rules_actions ON transaction_rules USING GIN(actions);

-- Create trigger for updated_at
CREATE TRIGGER update_transaction_rules_updated_at
BEFORE UPDATE ON transaction_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
-- Drop the trigger
DROP TRIGGER IF EXISTS update_transaction_rules_updated_at ON transaction_rules;

-- Drop the table
DROP TABLE IF EXISTS transaction_rules;