package rules

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// Handler handles HTTP requests for transaction rules
type Handler struct {
	service   *Service
	validator *validation.Validator
	logger    *zerolog.Logger
}

// NewHandler creates a new rules handler
func NewHandler(service *Service, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{
		service:   service,
		validator: validator,
		logger:    logger,
	}
}

// CreateRule creates a new transaction rule
func (h *Handler) CreateRule(w http.ResponseWriter, r *http.Request) {
	var req CreateTransactionRuleRequest
	ctx := r.Context()

	// Parse and validate request
	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Create rule
	rule, err := h.service.CreateRule(ctx, req, userID)
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

	respond.Json(w, http.StatusCreated, rule, h.logger)
}

// GetRule retrieves a rule by ID
func (h *Handler) GetRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get rule ID from URL path
	ruleIDStr := r.PathValue("id")
	if ruleIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "rule ID is required",
		})
		return
	}

	ruleID, err := uuid.Parse(ruleIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	// Get rule
	rule, err := h.service.GetRule(ctx, ruleID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusNotFound,
			ClientErr:  message.ErrNoRecord,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	respond.Json(w, http.StatusOK, rule, h.logger)
}

// ListRules retrieves all rules for a user
func (h *Handler) ListRules(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// List rules
	rules, err := h.service.ListRules(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID.String(),
		})
		return
	}

	respond.Json(w, http.StatusOK, rules, h.logger)
}

// UpdateRule updates an existing rule
func (h *Handler) UpdateRule(w http.ResponseWriter, r *http.Request) {
	var req UpdateTransactionRuleRequest
	ctx := r.Context()

	// Get rule ID from URL path
	ruleIDStr := r.PathValue("id")
	if ruleIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "rule ID is required",
		})
		return
	}

	ruleID, err := uuid.Parse(ruleIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	// Parse and validate request
	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Update rule
	rule, err := h.service.UpdateRule(ctx, ruleID, req, userID)
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

	respond.Json(w, http.StatusOK, rule, h.logger)
}

// DeleteRule deletes a rule
func (h *Handler) DeleteRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get rule ID from URL path
	ruleIDStr := r.PathValue("id")
	if ruleIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "rule ID is required",
		})
		return
	}

	ruleID, err := uuid.Parse(ruleIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Delete rule
	err = h.service.DeleteRule(ctx, ruleID, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ToggleRule toggles the active status of a rule
func (h *Handler) ToggleRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get rule ID from URL path
	ruleIDStr := r.PathValue("id")
	if ruleIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "rule ID is required",
		})
		return
	}

	ruleID, err := uuid.Parse(ruleIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Toggle rule
	rule, err := h.service.ToggleRuleActive(ctx, ruleID, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ruleIDStr,
		})
		return
	}

	respond.Json(w, http.StatusOK, rule, h.logger)
}

// ApplyRulesToTransaction applies rules to a specific transaction
func (h *Handler) ApplyRulesToTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get transaction ID from URL path
	transactionIDStr := r.PathValue("transactionId")
	if transactionIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "transaction ID is required",
		})
		return
	}

	transactionID, err := uuid.Parse(transactionIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    transactionIDStr,
		})
		return
	}

	// Get user ID from JWT
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Apply rules to transaction
	matches, err := h.service.ApplyRulesToTransaction(ctx, transactionID, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    transactionIDStr,
		})
		return
	}

	respond.Json(w, http.StatusOK, matches, h.logger)
}