-- name: CreateCategory :one
INSERT INTO categories (
    name,
    parent_id,
    is_default,
    created_by
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetCategoryById :one
SELECT *
FROM categories
WHERE
    id = sqlc.arg('id')
    AND deleted_at IS NULL
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
        created_by
    )
    VALUES
        ('Food & Beverage', TRUE, sqlc.arg('user_id')),
        ('Shopping', TRUE, sqlc.arg('user_id')),
        ('Housing', TRUE, sqlc.arg('user_id')),
        ('Transportation', TRUE, sqlc.arg('user_id')),
        ('Vehicle', TRUE, sqlc.arg('user_id')),
        ('Life & Entertainment', TRUE, sqlc.arg('user_id')),
        ('Communication & PC', TRUE, sqlc.arg('user_id')),
        ('Financial Expenses', TRUE, sqlc.arg('user_id')),
        ('Investments', TRUE, sqlc.arg('user_id')),
        ('Income', TRUE, sqlc.arg('user_id')),
        ('Others', TRUE, sqlc.arg('user_id')),
        ('Transfers', TRUE, sqlc.arg('user_id'))
    RETURNING id, name
),
food_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Bar & Cafe'),
            ('Groceries'),
            ('Restaurant & Fast Food')
    ) AS subcat(name)
    WHERE pc.name = 'Food & Beverage'
),
shopping_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Clothing & Shoes'),
            ('Electronics'),
            ('Health & Beauty'),
            ('Home & Garden'),
            ('Gifts'),
            ('Sports Equipment')
    ) AS subcat(name)
    WHERE pc.name = 'Shopping'
),
housing_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Rent'),
            ('Mortgage'),
            ('Utilities'),
            ('Maintenance & Repairs'),
            ('Property Tax')
    ) AS subcat(name)
    WHERE pc.name = 'Housing'
),
transportation_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Public Transport'),
            ('Taxi & Ride Share'),
            ('Parking'),
            ('Travel')
    ) AS subcat(name)
    WHERE pc.name = 'Transportation'
),
vehicle_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Fuel'),
            ('Service & Maintenance'),
            ('Insurance'),
            ('Registration & Tax')
    ) AS subcat(name)
    WHERE pc.name = 'Vehicle'
),
life_entertainment_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Entertainment'),
            ('Health & Fitness'),
            ('Hobbies'),
            ('Education'),
            ('Pets'),
            ('Subscriptions')
    ) AS subcat(name)
    WHERE pc.name = 'Life & Entertainment'
),
communication_pc_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Phone'),
            ('Internet'),
            ('Software & Apps'),
            ('Hardware & Devices')
    ) AS subcat(name)
    WHERE pc.name = 'Communication & PC'
),
financial_expenses_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Bank Fees'),
            ('Interest'),
            ('Taxes'),
            ('Insurance')
    ) AS subcat(name)
    WHERE pc.name = 'Financial Expenses'
),
investments_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Stocks'),
            ('Crypto'),
            ('Real Estate'),
            ('Retirement'),
            ('Savings')
    ) AS subcat(name)
    WHERE pc.name = 'Investments'
),
income_subcategories AS (
    INSERT INTO categories (
        name,
        parent_id,
        is_default,
        created_by
    )
    SELECT 
        subcat.name,
        pc.id,
        TRUE,
        sqlc.arg('user_id')
    FROM parent_categories pc
    CROSS JOIN (
        VALUES 
            ('Salary'),
            ('Business'),
            ('Dividends'),
            ('Interest'),
            ('Rental'),
            ('Sale'),
            ('Gifts Received')
    ) AS subcat(name)
    WHERE pc.name = 'Income'
)
SELECT 1;
