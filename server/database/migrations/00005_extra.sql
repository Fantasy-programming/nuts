-- +goose Up

CREATE TABLE tags (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    color "COLOR_ENUM" NOT NULL DEFAULT 'blue',
    CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
    CONSTRAINT tags_pkey PRIMARY KEY (id)
);

CREATE TABLE preferences (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    theme VARCHAR(10) NOT NULL DEFAULT 'light',
    currency CHAR(3) NOT NULL DEFAULT 'USD' REFERENCES currencies (code),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
);

-- +goose Down
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS preferences;
