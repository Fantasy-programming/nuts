-- +goose Up

-- 1: Enum types
CREATE TYPE "COLOR_ENUM" AS ENUM ('red', 'green', 'blue');
CREATE TYPE "ACCOUNT_TYPE" AS ENUM ('cash', 'momo', 'credit');

-- 2: Tables 
CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY,
    name TEXT
);

CREATE TABLE accounts (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    name VARCHAR(100) NOT NULL,
    type "ACCOUNT_TYPE" NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 0,
    currency CHAR(3) NOT NULL REFERENCES currencies (code),
    color "COLOR_ENUM" NOT NULL DEFAULT 'blue',
    meta JSONB,
    created_by UUID REFERENCES users (id),
    updated_by UUID REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT accounts_pkey PRIMARY KEY (id)
);

-- 3: Triggers
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4: Indexes
CREATE INDEX idx_accounts_name ON accounts (name);
CREATE INDEX idx_accounts_currency ON accounts (currency);

-- +goose Down
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS currencies;
DROP TYPE IF EXISTS COLOR_ENUM;
DROP TYPE IF EXISTS ACCOUNT_TYPE;
