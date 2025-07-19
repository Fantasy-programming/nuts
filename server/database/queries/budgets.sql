-- name: CreateBudget :one
INSERT INTO budgets (
  shared_finance_id,
  category_id,
  amount,
  name,
  start_date,
  end_date,
  frequency,
  budget_mode,
  template_id,
  global_limit_amount,
  percentage_allocation,
  is_flex_bucket,
  user_id
  ) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
  ) RETURNING id, created_at, updated_at;

-- name: UpdateBudget :exec
UPDATE budgets
SET
    category_id = $1,
    amount = $2,
    name = $3,
    start_date = $4,
    end_date = $5,
    frequency = $6,
    budget_mode = $7,
    template_id = $8,
    global_limit_amount = $9,
    percentage_allocation = $10,
    is_flex_bucket = $11,
    updated_at = $12
WHERE id = $13;

-- name: GetBudgetsByMode :many
SELECT * FROM budgets 
WHERE user_id = $1 AND budget_mode = $2 
ORDER BY created_at DESC;

-- name: GetUserBudgetSettings :one
SELECT * FROM user_budget_settings
WHERE user_id = $1 AND (shared_finance_id = $2 OR shared_finance_id IS NULL)
LIMIT 1;

-- name: CreateUserBudgetSettings :one
INSERT INTO user_budget_settings (
    user_id,
    shared_finance_id,
    budget_mode,
    settings
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: UpdateUserBudgetSettings :one
UPDATE user_budget_settings
SET
    budget_mode = $1,
    settings = $2,
    updated_at = NOW()
WHERE user_id = $3 AND (shared_finance_id = $4 OR shared_finance_id IS NULL)
RETURNING *;

-- name: GetBudgetTemplates :many
SELECT * FROM budget_templates ORDER BY is_default DESC, name ASC;

-- name: GetBudgetTemplate :one
SELECT * FROM budget_templates WHERE id = $1;

-- name: GetBudgetTemplateCategories :many
SELECT * FROM budget_template_categories 
WHERE template_id = $1 
ORDER BY percentage DESC;

-- name: UpdateUserBudgetMode :exec
UPDATE users SET budget_mode = $1 WHERE id = $2;


