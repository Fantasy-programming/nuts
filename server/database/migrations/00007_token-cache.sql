-- +goose Up

CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
	  user_id UUID NOT NULL,
	  refresh_token TEXT NOT NULL,
	  expires_at TIMESTAMPTZ NOT NULL,
	  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	  UNIQUE(user_id, refresh_token)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);

-- +goose Down
DROP TABLE IF EXISTS user_tokens;
