-- name: CreateCategory :one
INSERT INTO categories (
    name,
    icon,
    color,
    parent_id,
    is_default,
    type,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetCategoryById :one
SELECT *
FROM categories
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
LIMIT 1;

-- name: GetCategoryByName :one
SELECT *
FROM categories
WHERE
    name = sqlc.arg('name')
LIMIT 1;

-- name: ListCategories :many
SELECT *
FROM categories
WHERE
    created_by = sqlc.arg('user_id')
    AND deleted_at IS NULL;

-- name: ListChildCategories :many
SELECT *
FROM categories
WHERE
    parent_id = sqlc.arg('parent_id')
    AND deleted_at IS NULL;

-- name: UpdateCategory :one
UPDATE categories
SET
    name = coalesce(sqlc.narg('name'), name),
    parent_id = coalesce(sqlc.narg('parent_id'), parent_id),
    is_default = coalesce(sqlc.narg('is_default'), is_default),
    updated_by = sqlc.arg('updated_by')
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteCategory :exec
UPDATE categories
SET deleted_at = current_timestamp
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: GetDefaultCategories :many
SELECT *
FROM categories
WHERE
    created_by = sqlc.arg('user_id')
    AND is_default = TRUE
    AND deleted_at IS NULL;

-- name: CreateDefaultCategories :exec
WITH parent_categories AS (
    INSERT INTO categories (
        name,
        is_default,
        created_by,
        type,
        color,
        icon
    )
    VALUES
    ('Food & Beverage', TRUE, sqlc.arg('user_id'), 'expense', '#FF7043', 'Pizza'),
    ('Shopping', TRUE, sqlc.arg('user_id'), 'expense', '#AB47BC', 'ShoppingBag'),
    ('Housing', TRUE, sqlc.arg('user_id'), 'expense', '#29B6F6', 'Gome'),
    ('Transportation', TRUE, sqlc.arg('user_id'), 'expense', '#42A5F5', 'Bus'),
    ('Vehicle', TRUE, sqlc.arg('user_id'), 'expense', '#8D6E63', 'Car'),
    ('Life & Entertainment', TRUE, sqlc.arg('user_id'), 'expense', '#66BB6A', 'Music'),
    ('Communication & PC', TRUE, sqlc.arg('user_id'), 'expense', '#26A69A', 'Smartphone'),
    ('Financial Expenses', TRUE, sqlc.arg('user_id'), 'expense', '#EC407A', 'Credit-card'),
    ('Investments', TRUE, sqlc.arg('user_id'), 'expense', '#7E57C2', 'BarChart2'),
    ('Income', TRUE, sqlc.arg('user_id'), 'income', '#26C6DA', 'DollarSign'),
    ('Others', TRUE, sqlc.arg('user_id'), 'expense', '#78909C', 'Circle'),
    ('Transfers', TRUE, sqlc.arg('user_id'), 'expense', '#FFA726', 'Repeat')
    RETURNING id, name, color, icon
),
food_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Bar & Cafe'), ('Groceries'), ('Restaurant & Fast Food')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Food & Beverage'
),
shopping_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Clothing & Shoes'), ('Electronics'), ('Health & Beauty'), ('Home & Garden'), ('Gifts'), ('Sports Equipment')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Shopping'
),
housing_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Rent'), ('Mortgage'), ('Utilities'), ('Maintenance & Repairs'), ('Property Tax')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Housing'
),
transportation_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Public Transport'), ('Taxi & Ride Share'), ('Parking'), ('Travel')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Transportation'
),
vehicle_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Fuel'), ('Service & Maintenance'), ('Insurance'), ('Registration & Tax')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Vehicle'
),
life_entertainment_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Entertainment'), ('Health & Fitness'), ('Hobbies'), ('Education'), ('Pets'), ('Subscriptions')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Life & Entertainment'
),
communication_pc_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Phone'), ('Internet'), ('Software & Apps'), ('Hardware & Devices')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Communication & PC'
),
financial_expenses_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Bank Fees'), ('Interest'), ('Taxes'), ('Insurance')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Financial Expenses'
),
investments_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'expense', pc.color, pc.icon
    FROM (VALUES ('Stocks'), ('Crypto'), ('Real Estate'), ('Retirement'), ('Savings')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Investments'
),
income_subcategories AS (
    INSERT INTO categories (name, parent_id, is_default, created_by, type, color, icon)
    SELECT subcat.name, pc.id, TRUE, sqlc.arg('user_id'), 'income', pc.color, pc.icon
    FROM (VALUES ('Salary'), ('Business'), ('Dividends'), ('Interest'), ('Rental'), ('Sale'), ('Gifts Received')) AS subcat(name)
    JOIN parent_categories pc ON pc.name = 'Income'
)
SELECT 1;
