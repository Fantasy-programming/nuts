-- +goose Up
ALTER TABLE users ADD COLUMN avatar_url VARCHAR;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
