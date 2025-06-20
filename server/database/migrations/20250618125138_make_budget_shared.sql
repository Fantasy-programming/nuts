-- +goose Up
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- +goose Down
ALTER TABLE budgets
DROP COLUMN IF EXISTS name;
