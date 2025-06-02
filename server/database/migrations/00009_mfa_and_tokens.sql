-- +goose Up

ALTER TABLE users
ALTER COLUMN password DROP NOT NULL,
ADD COLUMN mfa_secret BYTEA NULL, -- Store encrypted MFA secret
ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN mfa_verified_at TIMESTAMPTZ NULL;

CREATE TABLE linked_accounts (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

ALTER TABLE user_tokens
ADD COLUMN user_agent TEXT NULL,
ADD COLUMN ip_address VARCHAR(45) NULL,
ADD COLUMN is_current BOOLEAN DEFAULT FALSE;

-- +goose Down
ALTER TABLE users
ALTER COLUMN password SET NOT NULL,
DROP COLUMN IF EXISTS mfa_secret,
DROP COLUMN IF EXISTS mfa_enabled,
DROP COLUMN IF EXISTS mfa_verified_at;

DROP TABLE IF EXISTS linked_accounts;

ALTER TABLE user_tokens
DROP COLUMN IF EXISTS user_agent,
DROP COLUMN IF EXISTS ip_address,
DROP COLUMN IF EXISTS ip_current;
