-- name: DeleteExpiredTokens :exec
DELETE FROM user_tokens
WHERE user_id = $1 AND expires_at < NOW();

-- name: DeleteUserToken :exec
DELETE FROM user_tokens
WHERE user_id = $1;

-- name: SaveUserToken :exec
INSERT INTO user_tokens (user_id, refresh_token, expires_at, user_agent, ip_address, location, browser_name, device_name, os_name)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: GetRefreshToken :one
SELECT
    id,
    user_id,
    refresh_token,
    expires_at,
    last_used_at
FROM user_tokens
WHERE user_id = $1 AND refresh_token = $2 AND expires_at > NOW();

-- name: UpdateTokenTimeSTamp :exec
UPDATE user_tokens
SET last_used_at = NOW()
WHERE id = $1;

-- name: GetSessions :many
SELECT
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}
    id,
    last_used_at,
    user_agent,
    ip_address,
    location,
    browser_name,
    device_name,
    os_name
FROM user_tokens
WHERE user_id = $1 AND expires_at > NOW() AND revoked = false;

-- name: RevokeSession :exec
UPDATE user_tokens
SET
    last_used_at = NOW(),
    revoked = true
WHERE id = $1;
