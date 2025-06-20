-- +goose Up
-- Create table for shared finance contexts (e.g., "Family Finances")
CREATE TABLE IF NOT EXISTS shared_finances (
    id UUID PRIMARY KEY NOT NULL DEFAULT (uuid_generate_v4()),
    name VARCHAR(255) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create join table for members in a shared finance
CREATE TABLE IF NOT EXISTS shared_finance_members (
    shared_finance_id UUID NOT NULL REFERENCES shared_finances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    PRIMARY KEY (shared_finance_id, user_id)
);

-- Add shared_finance_id to accounts table to allow shared ownership
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS shared_finance_id UUID REFERENCES shared_finances(id) ON DELETE SET NULL;

-- Add shared_finance_id to transactions table (optional, for quick access)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS shared_finance_id UUID REFERENCES shared_finances(id) ON DELETE SET NULL;

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS shared_finance_id UUID REFERENCES shared_finances(id) ON DELETE SET NULL;


-- +goose Down
ALTER TABLE budgets
DROP COLUMN IF EXISTS shared_finance_id;

ALTER TABLE transactions
DROP COLUMN IF EXISTS shared_finance_id;

ALTER TABLE accounts
DROP COLUMN IF EXISTS shared_finance_id;

DROP TABLE IF EXISTS shared_finance_members;
DROP TABLE IF EXISTS shared_finances;
