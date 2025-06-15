-- +goose Up
ALTER TABLE exchange_rates
  ALTER COLUMN rate TYPE DECIMAL(30, 10);

-- +goose Down
ALTER TABLE exchange_rates
  ALTER COLUMN rate TYPE DECIMAL(20, 8);
