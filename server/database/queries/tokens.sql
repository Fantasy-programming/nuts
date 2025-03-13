-- name: DeleteExpiredTokens :exec
DELETE FROM user_tokens
WHERE user_id = $1 AND expires_at < NOW();

-- name: DeleteUserToken :exec
DELETE FROM user_tokens
WHERE user_id = $1;

-- name: SaveUserToken :exec
INSERT INTO user_tokens (user_id, refresh_token, expires_at)
VALUES ($1, $2, $3);

-- name: GetRefreshToken :one
SELECT
    id,
    user_id,
    refresh_token,
    expires_at
FROM user_tokens
WHERE user_id = $1 AND refresh_token = $2 AND expires_at > NOW();

-- name: UpdateTokenTimeSTamp :exec
UPDATE user_tokens
SET last_used_at = NOW()
WHERE id = $1;
