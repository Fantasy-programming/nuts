package webhooks

import (
	"context"
	"errors"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Repository defines the interface for webhook data operations
type Repository interface {
	GetWebhooks(ctx context.Context, userID uuid.UUID) ([]repository.WebhookSubscription, error)
	GetWebhook(ctx context.Context, id uuid.UUID) (repository.WebhookSubscription, error)
	CreateWebhook(ctx context.Context, params repository.CreateWebhookSubscriptionParams) (repository.WebhookSubscription, error)
	UpdateWebhook(ctx context.Context, params repository.UpdateWebhookSubscriptionParams) (repository.WebhookSubscription, error)
	DeleteWebhook(ctx context.Context, params repository.DeleteWebhookSubscriptionParams) error
}

type repo struct {
	queries *repository.Queries
}

// NewRepository creates a new webhook repository
func NewRepository(queries *repository.Queries) Repository {
	return &repo{
		queries: queries,
	}
}

// GetWebhooks retrieves all webhooks for a specific user
func (r *repo) GetWebhooks(ctx context.Context, userID uuid.UUID) ([]repository.WebhookSubscription, error) {
	webhooks, err := r.queries.GetWebhookSubscriptionsByUserId(ctx, userID)
	if err != nil {
		// Special handling for empty results
		if errors.Is(err, pgx.ErrNoRows) {
			return []repository.WebhookSubscription{}, nil
		}
		return nil, err
	}
	return webhooks, nil
}

// GetWebhook retrieves a specific webhook by its ID
func (r *repo) GetWebhook(ctx context.Context, id uuid.UUID) (repository.WebhookSubscription, error) {
	return r.queries.GetWebhookSubscriptionById(ctx, id)
}

// CreateWebhook creates a new webhook
func (r *repo) CreateWebhook(ctx context.Context, params repository.CreateWebhookSubscriptionParams) (repository.WebhookSubscription, error) {
	return r.queries.CreateWebhookSubscription(ctx, params)
}

// UpdateWebhook updates an existing webhook
func (r *repo) UpdateWebhook(ctx context.Context, params repository.UpdateWebhookSubscriptionParams) (repository.WebhookSubscription, error) {
	return r.queries.UpdateWebhookSubscription(ctx, params)
}

// DeleteWebhook deletes a webhook
func (r *repo) DeleteWebhook(ctx context.Context, params repository.DeleteWebhookSubscriptionParams) error {
	return r.queries.DeleteWebhookSubscription(ctx, params)
}
