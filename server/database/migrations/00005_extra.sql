-- +goose Up

-- CREATE TABLE tags (
--     color VARCHAR(7), -- Hex color code like #FF5733
-- );
CREATE TABLE tags (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color "COLOR_ENUM" NOT NULL DEFAULT 'blue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT tags_user_name_unique UNIQUE (user_id, name)
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

CREATE TRIGGER update_preferencess_updated_at
BEFORE UPDATE ON preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS preferences;
