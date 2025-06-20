-- +goose Up
ALTER TABLE transactions
ALTER COLUMN category_id DROP NOT NULL;

-- Drop existing foreign key constraint on category_id
-- +goose StatementBegin
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'transactions'
      AND kcu.column_name = 'category_id'
      AND tc.constraint_type = 'FOREIGN KEY';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT %I', constraint_name);
    END IF;
END$$;
-- +goose StatementEnd

-- Add new foreign key constraint with ON DELETE SET NULL
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add is_categorized column with default false
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_categorized BOOLEAN DEFAULT FALSE;

-- +goose Down
-- Remove is_categorized column
ALTER TABLE transactions
DROP COLUMN IF EXISTS is_categorized;

-- Drop new foreign key constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS fk_transactions_category;

-- Restore NOT NULL
ALTER TABLE transactions
ALTER COLUMN category_id SET NOT NULL;

-- Restore original foreign key constraint without ON DELETE SET NULL
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id) REFERENCES categories(id);
