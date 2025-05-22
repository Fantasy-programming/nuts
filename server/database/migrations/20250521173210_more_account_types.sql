-- +goose Up
-- +goose StatementBegin
ALTER TYPE "ACCOUNT_TYPE" ADD VALUE 'investment';
ALTER TYPE "ACCOUNT_TYPE" ADD VALUE 'checking';
ALTER TYPE "ACCOUNT_TYPE" ADD VALUE 'savings';
ALTER TYPE "ACCOUNT_TYPE" ADD VALUE 'loan';
ALTER TYPE "ACCOUNT_TYPE" ADD VALUE 'other';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
