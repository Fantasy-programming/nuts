package transactions

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
	"github.com/rs/zerolog"
)

// NeuralInputHandler handles neural input requests for transaction parsing
type NeuralInputHandler struct {
	validator  *validation.Validator
	llmService llm.Service
	logger     *zerolog.Logger
}

// NewNeuralInputHandler creates a new neural input handler
func NewNeuralInputHandler(validator *validation.Validator, llmService llm.Service, logger *zerolog.Logger) *NeuralInputHandler {
	return &NeuralInputHandler{
		validator:  validator,
		llmService: llmService,
		logger:     logger,
	}
}

// ParseTransactions handles POST /transactions/neural-input
func (h *NeuralInputHandler) ParseTransactions(w http.ResponseWriter, r *http.Request) {
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

	var req llm.NeuralInputRequest
	ctx := r.Context()

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
	
	h.logger.Info().
		Str("user_id", userID.String()).
		Str("input", req.Input).
		Msg("Processing neural input for transaction parsing")

	response, err := h.llmService.ParseTransactions(ctx, req)
	if err != nil {
		h.logger.Error().
			Err(err).
			Str("user_id", userID.String()).
			Msg("Failed to parse transactions from neural input")
		
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

	h.logger.Info().
		Str("user_id", userID.String()).
		Int("transactions_count", len(response.Transactions)).
		Str("model", response.Model).
		Msg("Successfully parsed transactions from neural input")

	respond.Json(w, http.StatusOK, response, h.logger)
}