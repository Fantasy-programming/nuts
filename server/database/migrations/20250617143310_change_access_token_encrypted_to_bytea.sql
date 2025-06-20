-- +goose Up
ALTER TABLE user_financial_connections
  ALTER COLUMN access_token_encrypted
  SET DATA TYPE BYTEA
  USING access_token_encrypted::bytea;

-- +goose Down
ALTER TABLE user_financial_connections
  ALTER COLUMN access_token_encrypted
  SET DATA TYPE TEXT
  USING access_token_encrypted::text;
