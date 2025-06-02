-- +goose Up

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    name VARCHAR(100) NOT NULL,
    parent_id UUID DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL,
    updated_by UUID REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_user
    FOREIGN KEY (created_by)
    REFERENCES users (id)
    ON DELETE CASCADE,
    CONSTRAINT fk_parent_category
    FOREIGN KEY (parent_id)
    REFERENCES categories (id)
    ON DELETE SET NULL
);

CREATE TABLE transactions (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    amount NUMERIC NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('transfer', 'income', 'expense')),
    account_id UUID NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id),
    destination_account_id UUID REFERENCES accounts (id) ON DELETE SET NULL,
    transaction_datetime TIMESTAMPTZ NOT NULL,
    description TEXT,
    details JSONB,
    created_by UUID REFERENCES users (id),
    updated_by UUID REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;
