-- +goose Up
DROP INDEX IF EXISTS idx_financial_sync_jobs_user_id;
DROP INDEX IF EXISTS idx_financial_sync_jobs_status;
DROP TABLE IF EXISTS financial_sync_jobs;

-- +goose Down
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
