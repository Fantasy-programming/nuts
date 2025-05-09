-- +goose Up

ALTER TABLE user_tokens
ADD COLUMN created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN location TEXT,
ADD COLUMN browser_name TEXT,
ADD COLUMN device_name TEXT,
ADD COLUMN os_name TEXT,
ADD COLUMN revoked BOOLEAN DEFAULT FALSE;

-- +goose Down
ALTER TABLE user_tokens
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS browser_name,
DROP COLUMN IF EXISTS device_name,
DROP COLUMN IF EXISTS os_name,
DROP COLUMN IF EXISTS revoked;
