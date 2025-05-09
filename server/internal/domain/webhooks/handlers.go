package webhooks

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
)

// Get webhook secret from environment variable with fallback for development
func getWebhookSecret() string {
	secret := os.Getenv("WEBHOOK_SECRET")
	if secret == "" {
		// Log a warning in production environment
		if os.Getenv("APP_ENV") == "production" {
			// This is very dangerous and should be properly configured
			fmt.Println("WARNING: WEBHOOK_SECRET not set in production environment")
		}
		return "dev_webhook_secret_replace_in_production"
	}
	return secret
}

type Handler struct {
	v      *validation.Validator
	repo   Repository
	logger *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, logger}
}

func (h *Handler) GetWebhooks(res http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.URL.Path,
		})
		return
	}

	webhooks, err := h.repo.GetWebhooks(ctx, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Json(res, http.StatusOK, "[]", h.logger)
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Json(res, http.StatusOK, webhooks, h.logger)
}

func (h *Handler) GetWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	_, err = jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}
	webhook, err := h.repo.GetWebhook(ctx, webhookID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Json(res, http.StatusNotFound, "", h.logger)
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusOK, webhook, h.logger)
}

func (h *Handler) CreateWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req WebhookRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if err := h.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	newHook, err := h.repo.CreateWebhook(ctx, repository.CreateWebhookSubscriptionParams{
		UserID:      userID,
		Event:       req.Events,
		Active:      true,
		EndpointUrl: req.URL,
		Secret:      req.Secret,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Json(res, http.StatusOK, newHook, h.logger)
}

// UpdateWebhook updates an existing webhook
func (h *Handler) UpdateWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	var req WebhookUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if err := h.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	updatedWebhook, err := h.repo.UpdateWebhook(ctx, repository.UpdateWebhookSubscriptionParams{
		ID:          webhookID,
		UserID:      userID,
		Event:       req.Events,
		Active:      req.Active,
		EndpointUrl: req.URL,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          res,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  message.ErrNoRecord,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    webhookID,
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusOK, updatedWebhook, h.logger)
}

// DeleteWebhook deletes a webhook by ID
func (h *Handler) DeleteWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	err = h.repo.DeleteWebhook(ctx, repository.DeleteWebhookSubscriptionParams{
		ID:     webhookID,
		UserID: userID,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          res,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  message.ErrNoRecord,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    webhookID,
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusNoContent, nil, h.logger)
}

// TestWebhook triggers a test event for a webhook
func (h *Handler) TestWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	webhook, err := h.repo.GetWebhook(ctx, webhookID)
	if err != nil {
		if (err == pgx.ErrNoRows) {
			respond.Error(respond.ErrorOptions{
				W:          res,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  message.ErrNoRecord,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    webhookID,
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	// Verify the webhook belongs to this user
	if webhook.UserID != userID {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusForbidden,
			ClientErr:  message.ErrForbidden,
			ActualErr:  errors.New("webhook does not belong to user"),
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	// Create test payload
	testPayload := map[string]interface{}{
		"event": "test",
		"data": map[string]interface{}{
			"message":    "This is a test webhook event",
			"webhook_id": webhook.ID.String(),
			"timestamp":  time.Now().Format(time.RFC3339),
		},
	}

	// Implement webhook delivery
	// (You may want to extract this into a reusable service)
	success, deliveryErr := h.deliverWebhook(webhook, testPayload)

	if !success {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  deliveryErr,
			Logger:     h.logger,
			Details:    webhookID,
		})
		return
	}

	h.logger.Info().
		Str("webhook_id", webhook.ID.String()).
		Str("webhook_url", webhook.EndpointUrl).
		Msg("Test webhook event delivered successfully")

	respond.Json(res, http.StatusOK, map[string]string{
		"status":  "success",
		"message": "Test webhook event delivered successfully",
	}, h.logger)
}

// deliverWebhook sends a payload to the webhook endpoint
func (h *Handler) deliverWebhook(webhook repository.WebhookSubscription, payload interface{}) (bool, error) {
	// Convert payload to JSON
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return false, err
	}

	// Create HTTP request
	req, err := http.NewRequest(http.MethodPost, webhook.EndpointUrl, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return false, err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NUTS-Webhook-Service/1.0")

	// Generate signature using the webhook's secret
	signature := h.generateSignature(payloadBytes, webhook.Secret)
	req.Header.Set("X-NUTS-Signature", signature)

	// Send the request
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return false, fmt.Errorf("webhook delivery failed with status: %d", resp.StatusCode)
	}

	return true, nil
}

// generateSignature creates an HMAC signature for the payload using the webhook secret
func (h *Handler) generateSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}
