-- +goose Up

ALTER TABLE accounts ADD COLUMN is_external BOOLEAN DEFAULT FALSE;

CREATE TABLE user_financial_connections (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL REFERENCES users (id),
    provider_name VARCHAR(50) NOT NULL,
    access_token_encrypted TEXT NOT NULL, -- Store encrypted access tokens
    item_id VARCHAR(255), -- Provider-specific item/connection ID
    institution_id VARCHAR(255),
    institution_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, error, disconnected
    last_sync_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    CONSTRAINT user_financial_connections_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_provider_item UNIQUE (user_id, provider_name, item_id)
);

ALTER TABLE accounts ADD COLUMN connection_id UUID REFERENCES user_financial_connections (id);
CREATE INDEX idx_accounts_connection_id ON accounts (connection_id);

CREATE INDEX idx_user_financial_connections_user_id ON user_financial_connections (user_id);
CREATE INDEX idx_user_financial_connections_provider ON user_financial_connections (provider_name);

CREATE TABLE financial_sync_jobs (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL REFERENCES users (id),
    connection_id UUID NOT NULL REFERENCES user_financial_connections (id),
    provider_name VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- accounts, transactions, balances
    status VARCHAR(20) NOT NULL, -- pending, running, completed, failed
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    accounts_synced INTEGER DEFAULT 0,
    transactions_synced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    CONSTRAINT financial_sync_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_financial_sync_jobs_user_id ON financial_sync_jobs (user_id);
CREATE INDEX idx_financial_sync_jobs_status ON financial_sync_jobs (status);

-- +goose Down
DROP INDEX IF EXISTS idx_financial_sync_jobs_status;
DROP INDEX IF EXISTS idx_financial_sync_jobs_user_id;
DROP INDEX IF EXISTS idx_user_financial_connections_provider;
DROP INDEX IF EXISTS idx_user_financial_connections_user_id;

DROP TABLE IF EXISTS financial_sync_jobs;
DROP TABLE IF EXISTS user_financial_connections;

ALTER TABLE accounts DROP COLUMN IF EXISTS sync_status;
ALTER TABLE accounts DROP COLUMN IF EXISTS last_synced_at;
ALTER TABLE accounts DROP COLUMN IF EXISTS is_external;
ALTER TABLE accounts DROP COLUMN IF EXISTS provider_institution_id;
ALTER TABLE accounts DROP COLUMN IF EXISTS provider_account_id;
ALTER TABLE accounts DROP COLUMN IF EXISTS provider_name;
