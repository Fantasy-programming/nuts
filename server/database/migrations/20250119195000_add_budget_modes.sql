-- +goose Up

-- Create budget modes enum and user preferences
CREATE TYPE budget_mode AS ENUM (
    'traditional_category',  -- Traditional category-based budgets (existing)
    'flex_bucket',          -- Single flexible spending pool  
    'global_limit',         -- Simple total spending cap
    'zero_based',          -- Every dollar must be assigned
    'percentage_based'      -- 50/30/20 rule and similar frameworks
);

-- Add budget mode to user preferences
ALTER TABLE users ADD COLUMN budget_mode budget_mode DEFAULT 'traditional_category';

-- Create budget templates table for percentage-based budgeting
CREATE TABLE budget_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,  -- e.g., "50/30/20 Rule"
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget template categories for percentage allocations
CREATE TABLE budget_template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,  -- e.g., "Needs", "Wants", "Savings"
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add budget mode specific fields to budgets table
ALTER TABLE budgets ADD COLUMN budget_mode budget_mode DEFAULT 'traditional_category';
ALTER TABLE budgets ADD COLUMN template_id UUID REFERENCES budget_templates(id);
ALTER TABLE budgets ADD COLUMN global_limit_amount NUMERIC(15, 2); -- For global_limit mode
ALTER TABLE budgets ADD COLUMN percentage_allocation NUMERIC(5,2); -- For percentage_based mode
ALTER TABLE budgets ADD COLUMN is_flex_bucket BOOLEAN DEFAULT FALSE; -- For flex_bucket mode

-- Create user budget settings table for mode-specific preferences
CREATE TABLE user_budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_finance_id UUID REFERENCES shared_finances(id) ON DELETE CASCADE,
    budget_mode budget_mode NOT NULL DEFAULT 'traditional_category',
    settings JSONB DEFAULT '{}', -- Store mode-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, shared_finance_id)
);

-- Insert default budget templates
INSERT INTO budget_templates (name, description, is_default) VALUES 
('50/30/20 Rule', 'Allocate 50% to needs, 30% to wants, 20% to savings', true),
('60/20/20 Rule', 'Allocate 60% to needs, 20% to wants, 20% to savings', false),
('70/20/10 Rule', 'Allocate 70% to needs, 20% to wants, 10% to savings', false);

-- Insert template categories for 50/30/20 rule
INSERT INTO budget_template_categories (template_id, category_name, percentage, description)
SELECT 
    bt.id,
    category_data.category_name,
    category_data.percentage,
    category_data.description
FROM budget_templates bt,
(VALUES 
    ('Needs', 50.00, 'Essential expenses like housing, utilities, groceries'),
    ('Wants', 30.00, 'Non-essential expenses like entertainment, dining out'),
    ('Savings', 20.00, 'Emergency fund, retirement, and other savings goals')
) AS category_data(category_name, percentage, description)
WHERE bt.name = '50/30/20 Rule';

-- Insert template categories for 60/20/20 rule
INSERT INTO budget_template_categories (template_id, category_name, percentage, description)
SELECT 
    bt.id,
    category_data.category_name,
    category_data.percentage,
    category_data.description
FROM budget_templates bt,
(VALUES 
    ('Needs', 60.00, 'Essential expenses like housing, utilities, groceries'),
    ('Wants', 20.00, 'Non-essential expenses like entertainment, dining out'),
    ('Savings', 20.00, 'Emergency fund, retirement, and other savings goals')
) AS category_data(category_name, percentage, description)
WHERE bt.name = '60/20/20 Rule';

-- Insert template categories for 70/20/10 rule
INSERT INTO budget_template_categories (template_id, category_name, percentage, description)
SELECT 
    bt.id,
    category_data.category_name,
    category_data.percentage,
    category_data.description
FROM budget_templates bt,
(VALUES 
    ('Needs', 70.00, 'Essential expenses like housing, utilities, groceries'),
    ('Wants', 20.00, 'Non-essential expenses like entertainment, dining out'),
    ('Savings', 10.00, 'Emergency fund, retirement, and other savings goals')
) AS category_data(category_name, percentage, description)
WHERE bt.name = '70/20/10 Rule';

-- +goose Down

-- Remove budget templates data
DELETE FROM budget_template_categories;
DELETE FROM budget_templates;

-- Drop new tables
DROP TABLE IF EXISTS user_budget_settings;
DROP TABLE IF EXISTS budget_template_categories;
DROP TABLE IF EXISTS budget_templates;

-- Remove columns from budgets table
ALTER TABLE budgets DROP COLUMN IF EXISTS budget_mode;
ALTER TABLE budgets DROP COLUMN IF EXISTS template_id;
ALTER TABLE budgets DROP COLUMN IF EXISTS global_limit_amount;
ALTER TABLE budgets DROP COLUMN IF EXISTS percentage_allocation;
ALTER TABLE budgets DROP COLUMN IF EXISTS is_flex_bucket;

-- Remove column from users table
ALTER TABLE users DROP COLUMN IF EXISTS budget_mode;

-- Drop enum type
DROP TYPE IF EXISTS budget_mode;