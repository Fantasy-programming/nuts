-- name: CreatePreferences :one
INSERT INTO preferences (
    user_id,
    locale,
    theme,
    currency
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetPreferencesByUserId :one
SELECT
    id,
    locale,
    theme,
    currency,
    created_at,
    updated_at
FROM preferences
WHERE
    user_id = $1
    AND deleted_at IS NULL
LIMIT 1;

-- name: UpdatePreferences :one
UPDATE preferences
SET
    locale = coalesce(sqlc.narg('locale'), locale),
    theme = coalesce(sqlc.narg('theme'), theme),
    currency = coalesce(sqlc.narg('currency'), currency),
    updated_at = current_timestamp
WHERE
    user_id = sqlc.arg('user_id')
    AND deleted_at IS NULL
RETURNING *;

-- name: DeletePreferences :exec
UPDATE preferences
SET
    deleted_at = current_timestamp
WHERE
    user_id = $1
    AND deleted_at IS NULL;

-- name: ListPreferences :many
SELECT
    id,
    user_id,
    locale,
    theme,
    currency,
    created_at,
    updated_at
FROM preferences
WHERE deleted_at IS NULL
ORDER BY user_id
LIMIT
    $1
    OFFSET $2;
