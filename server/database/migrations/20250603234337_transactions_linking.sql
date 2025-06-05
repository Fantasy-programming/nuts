-- +goose Up
ALTER TABLE transactions ADD COLUMN is_external BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN provider_transaction_id VARCHAR(255);

-- +goose Down
SELECT 'down SQL query';
