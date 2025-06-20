-- +goose Up

-- 1. Add "type" to categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Temporarily allow NULL for safe population
-- Set default 'expense' for existing categories (you can change this logic)
UPDATE categories SET type = 'expense' WHERE type IS NULL;

-- Now enforce NOT NULL and restrict values
ALTER TABLE categories
ALTER COLUMN type SET NOT NULL;

ALTER TABLE categories
ADD CONSTRAINT category_type_check
CHECK (type IN ('income', 'expense'));

-- 2. Create budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- e.g., 'monthly', 'weekly', 'yearly'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, category_id, start_date)
);

-- +goose Down

-- Drop budgets table
DROP TABLE IF EXISTS budgets;

-- Remove "type" column and its constraint
ALTER TABLE categories
DROP CONSTRAINT IF EXISTS category_type_check;

ALTER TABLE categories
DROP COLUMN IF EXISTS type;
