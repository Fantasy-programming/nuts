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
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/jackc/pgx/v5"
)

var Secret = "fadfadfsf"

func (w *Webhooks) GetWebhooks(res http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    r.URL.Path,
		})
		return
	}

	webhooks, err := w.queries.GetWebhookSubscriptionsByUserId(ctx, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Json(res, http.StatusOK, "[]", w.log)
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    userID,
		})
		return
	}

	respond.Json(res, http.StatusOK, webhooks, w.log)
}

func (w *Webhooks) GetWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	_, err = jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    nil,
		})
		return
	}
	webhook, err := w.queries.GetWebhookSubscriptionById(ctx, webhookID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Json(res, http.StatusNotFound, "", w.log)
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusOK, webhook, w.log)
}

func (w *Webhooks) CreateWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req WebhookRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     w.log,
			Details:    r.Body,
		})
		return
	}

	if err := w.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     w.log,
			Details:    req,
		})
		return
	}

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    nil,
		})
		return
	}

	newHook, err := w.queries.CreateWebhookSubscription(ctx, repository.CreateWebhookSubscriptionParams{
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
			Logger:     w.log,
			Details:    userID,
		})
		return
	}

	respond.Json(res, http.StatusOK, newHook, w.log)
}

// UpdateWebhook updates an existing webhook
func (w *Webhooks) UpdateWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     w.log,
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
			Logger:     w.log,
			Details:    r.Body,
		})
		return
	}

	if err := w.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     w.log,
			Details:    req,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    nil,
		})
		return
	}

	updatedWebhook, err := w.queries.UpdateWebhookSubscription(ctx, repository.UpdateWebhookSubscriptionParams{
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
				Logger:     w.log,
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
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusOK, updatedWebhook, w.log)
}

// DeleteWebhook deletes a webhook by ID
func (w *Webhooks) DeleteWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    nil,
		})
		return
	}

	err = w.queries.DeleteWebhookSubscription(ctx, repository.DeleteWebhookSubscriptionParams{
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
				Logger:     w.log,
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
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	respond.Json(res, http.StatusNoContent, nil, w.log)
}

// TestWebhook triggers a test event for a webhook
func (w *Webhooks) TestWebhook(res http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	webhookID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	// Verify that the user owns this webhook
	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     w.log,
			Details:    nil,
		})
		return
	}

	webhook, err := w.queries.GetWebhookSubscriptionById(ctx, webhookID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          res,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  message.ErrNoRecord,
				ActualErr:  err,
				Logger:     w.log,
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
			Logger:     w.log,
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
			Logger:     w.log,
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
	success, deliveryErr := w.deliverWebhook(webhook, testPayload)

	if !success {
		respond.Error(respond.ErrorOptions{
			W:          res,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  deliveryErr,
			Logger:     w.log,
			Details:    webhookID,
		})
		return
	}

	w.log.Info().
		Str("webhook_id", webhook.ID.String()).
		Str("webhook_url", webhook.EndpointUrl).
		Msg("Test webhook event delivered successfully")

	respond.Json(res, http.StatusOK, map[string]string{
		"status":  "success",
		"message": "Test webhook event delivered successfully",
	}, w.log)
}

// deliverWebhook sends a payload to the webhook endpoint
func (w *Webhooks) deliverWebhook(webhook repository.WebhookSubscription, payload interface{}) (bool, error) {
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
	signature := w.generateSignature(payloadBytes, webhook.Secret)
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
func (w *Webhooks) generateSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}
