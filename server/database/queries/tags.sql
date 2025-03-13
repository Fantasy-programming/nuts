-- name: CreateTag :one
INSERT INTO tags (
    user_id,
    name,
    color
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetTagById :one
SELECT
    id,
    user_id,
    name,
    color
FROM tags
WHERE id = $1 LIMIT 1;

-- name: GetTagsByUserId :many
SELECT
    id,
    name,
    color
FROM tags
WHERE user_id = $1
ORDER BY name;

-- name: ListTags :many
SELECT
    id,
    user_id,
    name,
    color
FROM tags
ORDER BY name
LIMIT
    $1
    OFFSET $2;

-- name: UpdateTag :one
UPDATE tags
SET
    name = coalesce(sqlc.narg('name'), name),
    color = coalesce(sqlc.narg('color'), color)
WHERE
    id = sqlc.arg('id')
    AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteTag :exec
DELETE FROM tags
WHERE
    id = $1
    AND user_id = $2;
