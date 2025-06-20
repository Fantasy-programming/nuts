-- name: CreateBudget :one
INSERT INTO budgets (
  shared_finance_id,
  category_id,
  amount,
  name,
  start_date,
  end_date,
  frequency,
  -- rollover_enabled,
  user_id
  ) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
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
    -- rollover_enabled = $7,
    updated_at = $7
WHERE id = $8;


