package transactions

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// RecurringTransactionHandlers handles HTTP requests for recurring transactions
type RecurringTransactionHandlers struct {
	service *RecurringTransactionService
	logger  *zerolog.Logger
}

// NewRecurringTransactionHandlers creates new recurring transaction handlers
func NewRecurringTransactionHandlers(service *RecurringTransactionService, logger *zerolog.Logger) *RecurringTransactionHandlers {
	return &RecurringTransactionHandlers{
		service: service,
		logger:  logger,
	}
}

// CreateRecurringTransaction handles POST /api/transactions/recurring
func (h *RecurringTransactionHandlers) CreateRecurringTransaction(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	var req CreateRecurringTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	// Validate the request
	if err := h.service.ValidateRecurringTransaction(req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	// Create the recurring transaction
	recurringTransaction, err := h.service.repo.CreateRecurringTransaction(r.Context(), req, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	respond.Json(w, http.StatusCreated, recurringTransaction, h.logger)
}

// GetRecurringTransaction handles GET /api/transactions/recurring/{id}
func (h *RecurringTransactionHandlers) GetRecurringTransaction(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	recurringTransaction, err := h.service.repo.GetRecurringTransactionByID(r.Context(), id, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusNotFound,
			ClientErr:  message.ErrNoRecord,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	respond.Json(w, http.StatusOK, recurringTransaction, h.logger)
}

// RegisterRecurringTransactionRoutes registers all recurring transaction routes
func RegisterRecurringTransactionRoutes(r chi.Router, handlers *RecurringTransactionHandlers) {
	r.Route("/recurring", func(r chi.Router) {
		r.Post("/", handlers.CreateRecurringTransaction)
		r.Get("/{id}", handlers.GetRecurringTransaction)
	})
}

