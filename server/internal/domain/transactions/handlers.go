package transactions

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Handler struct {
	validator *validation.Validator
	repo      Repository
	logger    *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, logger}
}

func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	q := r.URL.Query()

	// Pagination
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 { // Set a reasonable default and max
		limit = 25
	}

	// Conditional Grouping
	groupByDate := q.Get("group_by") == "date"

	// Filters
	params := ListTransactionsParams{
		UserID: userID,
		Page:   page,
		Limit:  limit,
	}

	if search := q.Get("q"); search != "" {
		params.Search = &search
	}

	if txType := q.Get("type"); txType != "" {
		params.Type = &txType
	}

	if accountIDStr := q.Get("account_id"); accountIDStr != "" {
		if accountID, err := uuid.Parse(accountIDStr); err == nil {
			params.AccountID = &accountID
		}
	}

	// Date Range Filter (example: ?start_date=2023-01-01&end_date=2023-01-31)
	layout := "2006-01-02"
	if startDateStr := q.Get("start_date"); startDateStr != "" {
		if t, err := time.Parse(layout, startDateStr); err == nil {
			params.StartDate = &t
		}
	}
	if endDateStr := q.Get("end_date"); endDateStr != "" {
		if t, err := time.Parse(layout, endDateStr); err == nil {
			params.EndDate = &t
		}
	}

	// Get Accounts

	transactions, err := h.repo.GetTransactions(ctx, params, groupByDate)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, transactions, h.logger)
}

func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.URL.Path,
		})
		return
	}

	transaction, err := h.repo.GetTransaction(ctx, trscID)
	if err != nil {

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    trscID,
		})

		return
	}

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var request CreateTransactionRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {

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

	// Validate
	amount := decimal.NewFromFloat(request.Amount)
	accountID, err := uuid.Parse(request.AccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	id, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	transaction, err := h.repo.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              amount,
		Type:                request.Type,
		AccountID:           accountID,
		CategoryID:          categoryID,
		Description:         request.Description,
		TransactionDatetime: pgtype.Timestamptz{Time: request.TransactionDatetime, Valid: true},
		Details:             request.Details,
		CreatedBy:           &id,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) CreateTransfert(w http.ResponseWriter, r *http.Request) {
	var request CreateTransfertRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
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

	// Force transfer type
	request.Type = "transfer"

	// Parse UUIDs
	accountID, err := uuid.Parse(request.AccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	destAccountID, err := uuid.Parse(request.DestinationAccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	if accountID == destAccountID {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrSameAccount,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	// Create transfer using repository
	transaction, err := h.repo.CreateTransfertTransaction(ctx, TransfertParams{
		Amount:               decimal.NewFromFloat(request.Amount),
		Type:                 request.Type,
		AccountID:            accountID,
		DestinationAccountID: destAccountID,
		CategoryID:           categoryID,
		Description:          request.Description,
		TransactionDatetime:  request.TransactionDatetime,
		Details:              request.Details,
		UserID:               userID,
	})
	// Handle specific errors with appropriate status codes
	if err != nil {
		var statusCode int
		var clientErr error

		switch err {
		case ErrSrcAccNotFound:
			statusCode = http.StatusNotFound
			clientErr = ErrSrcAccNotFound
		case ErrDestAccNotFound:
			statusCode = http.StatusNotFound
			clientErr = ErrDestAccNotFound
		case ErrLowBalance:
			statusCode = http.StatusBadRequest
			clientErr = ErrLowBalance
		case ErrSameAccount:
			statusCode = http.StatusBadRequest
			clientErr = ErrSameAccount
		default:
			statusCode = http.StatusInternalServerError
			clientErr = message.ErrInternalError
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  clientErr,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    request,
		})
		return
	}

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) UpdateTransaction(w http.ResponseWriter, r *http.Request) {}

func (h *Handler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.URL.Path,
		})
		return
	}

	if err = h.repo.DeleteTransaction(ctx, trscID); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    trscID,
		})
		return

	}

	respond.Status(w, http.StatusOK)
}
