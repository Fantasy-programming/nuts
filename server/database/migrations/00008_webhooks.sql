-- +goose Up

CREATE TABLE webhook_subscriptions (
    id UUID NOT NULL DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL,
    event TEXT [] NOT NULL,
    active BOOLEAN NOT NULL,
    endpoint_url TEXT NOT NULL CHECK (endpoint_url ~ '^https?://'),  -- Basic validation
    secret TEXT NOT NULL,  -- For signing requests
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users (id),
    CONSTRAINT webhook_sub_pkey PRIMARY KEY (id)
);


CREATE TABLE webhook_events (
    id UUID NOT NULL PRIMARY KEY DEFAULT (uuid_generate_v4()),
    subscription_id UUID NOT NULL REFERENCES webhook_subscriptions (id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,  -- The event data
    status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS webhook_subscriptions;
