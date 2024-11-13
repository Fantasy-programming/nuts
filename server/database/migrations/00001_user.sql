-- +goose Up

-- 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2: tables
CREATE TABLE users (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    email VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    password VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- 3: Functions
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- 4: Add function on table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5: Add index
CREATE UNIQUE INDEX users_email_key ON users (email);

-- +goose Down
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS "uuid-ossp";
