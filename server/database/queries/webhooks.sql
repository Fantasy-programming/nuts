-- name: CreateWebhookSubscription :one
INSERT INTO webhook_subscriptions (
    user_id,
    event,
    active,
    endpoint_url,
    secret
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetWebhookSubscriptionById :one
SELECT
    id,
    user_id,
    event,
    active,
    endpoint_url,
    secret,
    created_at
FROM webhook_subscriptions
WHERE id = $1 LIMIT 1;

-- name: GetWebhookSubscriptionsByUserId :many
SELECT
    id,
    user_id,
    event,
    active,
    endpoint_url,
    secret,
    created_at
FROM webhook_subscriptions
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetWebhookSubscriptionsByEvent :many
SELECT
    id,
    user_id,
    event,
    active,
    endpoint_url,
    secret,
    created_at
FROM webhook_subscriptions
WHERE $1 = ANY(event)
ORDER BY created_at;

-- name: UpdateWebhookSubscription :one
UPDATE webhook_subscriptions
SET
    event = coalesce(sqlc.narg('event'), event),
    endpoint_url = coalesce(sqlc.narg('endpoint_url'), endpoint_url),
    secret = coalesce(sqlc.narg('secret'), secret),
    active = coalesce(sqlc.narg('active'), active)
WHERE
    id = sqlc.arg('id')
    AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteWebhookSubscription :exec
DELETE FROM webhook_subscriptions
WHERE
    id = $1
    AND user_id = $2;

-- name: ListWebhookSubscriptions :many
SELECT
    id,
    user_id,
    active,
    event,
    endpoint_url,
    secret,
    created_at
FROM webhook_subscriptions
ORDER BY created_at DESC
LIMIT
    $1
    OFFSET $2;

-- name: CreateWebhookEvent :one
INSERT INTO webhook_events (
    subscription_id,
    event_type,
    payload,
    status
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetWebhookEventById :one
SELECT
    id,
    subscription_id,
    event_type,
    payload,
    status,
    attempts,
    last_attempt,
    created_at
FROM webhook_events
WHERE id = $1 LIMIT 1;

-- name: GetWebhookEventsBySubscriptionId :many
SELECT
    id,
    subscription_id,
    event_type,
    payload,
    status,
    attempts,
    last_attempt,
    created_at
FROM webhook_events
WHERE subscription_id = $1
ORDER BY created_at DESC;

-- name: GetPendingWebhookEvents :many
SELECT
    id,
    subscription_id,
    event_type,
    payload,
    status,
    attempts,
    last_attempt,
    created_at
FROM webhook_events
WHERE
    status IN ('pending', 'retrying')
    AND (last_attempt IS NULL OR last_attempt < now() - INTERVAL '5 minutes')
    AND attempts < 5
ORDER BY created_at
LIMIT $1;

-- name: UpdateWebhookEventStatus :one
UPDATE webhook_events
SET
    status = $2,
    attempts = attempts + 1,
    last_attempt = now()
WHERE id = $1
RETURNING *;

-- name: DeleteWebhookEvent :exec
DELETE FROM webhook_events
WHERE id = $1;

-- name: CleanupOldWebhookEvents :exec
DELETE FROM webhook_events
WHERE
    created_at < now() - INTERVAL '30 days'
    AND status IN ('sent', 'failed');
