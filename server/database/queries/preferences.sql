-- name: CreateDefaultPreferences :exec
INSERT INTO preferences (
    user_id
) VALUES (
    $1
);

-- name: GetPreferencesByUserId :one
SELECT
    id,
    locale,
    theme,
    timezone,
    time_format,
    date_format,
    currency,
    start_week_on_monday,
    dark_sidebar,
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
    timezone = coalesce(sqlc.narg('timezone'), timezone),
    time_format = coalesce(sqlc.narg('time_format'), time_format),
    date_format = coalesce(sqlc.narg('date_format'), date_format),
    start_week_on_monday = coalesce(sqlc.narg('start_week_on_monday'), start_week_on_monday),
    dark_sidebar = coalesce(sqlc.narg('dark_sidebar'), dark_sidebar),
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
