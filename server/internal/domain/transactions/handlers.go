package transactions

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Handler struct {
	validator       *validation.Validator
	repo            Repository
	recurringService *RecurringTransactionService
	logger          *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, recurringService *RecurringTransactionService, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, recurringService, logger}
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

	if categoryIDStr := q.Get("category_id"); categoryIDStr != "" {
		if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
			params.CategoryID = &categoryID
		}
	}

	if currency := q.Get("currency"); currency != "" {
		params.Currency = &currency
	}

	if isExternalStr := q.Get("is_external"); isExternalStr != "" {
		if isExternal, err := strconv.ParseBool(isExternalStr); err == nil {
			params.IsExternal = &isExternal
		}
	}

	if minAmountStr := q.Get("min_amount"); minAmountStr != "" {
		if minAmount, err := strconv.ParseFloat(minAmountStr, 64); err == nil {
			params.MinAmount = &minAmount
		}
	}

	if maxAmountStr := q.Get("max_amount"); maxAmountStr != "" {
		if maxAmount, err := strconv.ParseFloat(maxAmountStr, 64); err == nil {
			params.MaxAmount = &maxAmount
		}
	}

	// Tags filter (comma-separated values)
	if tagsStr := q.Get("tags"); tagsStr != "" {
		tags := strings.Split(tagsStr, ",")
		for i := range tags {
			tags[i] = strings.TrimSpace(tags[i])
		}
		if len(tags) > 0 && tags[0] != "" {
			params.Tags = tags
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
	trscID, err := request.ParseUUID(r, "id")
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
	var req CreateTransactionRequest
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

	amount := decimal.NewFromFloat(req.Amount)
	accountID, err := uuid.Parse(req.AccountID)
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

	categoryID, err := uuid.Parse(req.CategoryID)
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

	userID, err := jwt.GetUserID(r)
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

	isExternal := false

	// NOTE: Default to usd for now
	transaction, err := h.repo.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              amount,
		Type:                req.Type,
		AccountID:           accountID,
		CategoryID:          &categoryID,
		Description:         req.Description,
		TransactionDatetime: pgtype.Timestamptz{Time: req.TransactionDatetime, Valid: true},
		TransactionCurrency: "USD",
		IsExternal:          &isExternal,
		OriginalAmount:      amount,
		Details:             &req.Details,
		CreatedBy:           &userID,
	})
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

	// If this is a recurring transaction, create the recurring template
	if req.IsRecurring != nil && *req.IsRecurring && req.RecurringConfig != nil {
		recurringReq := CreateRecurringTransactionRequest{
			AccountID:         req.AccountID,
			CategoryID:        &req.CategoryID,
			Amount:            amount,
			Type:              req.Type,
			Description:       req.Description,
			Details:           &req.Details,
			Frequency:         req.RecurringConfig.Frequency,
			FrequencyInterval: req.RecurringConfig.FrequencyInterval,
			FrequencyData:     req.RecurringConfig.FrequencyData,
			StartDate:         req.RecurringConfig.StartDate,
			EndDate:           req.RecurringConfig.EndDate,
			AutoPost:          req.RecurringConfig.AutoPost,
			MaxOccurrences:    req.RecurringConfig.MaxOccurrences,
			TemplateName:      req.RecurringConfig.TemplateName,
			Tags:              req.RecurringConfig.Tags,
		}

		// Validate the recurring transaction
		if err := h.recurringService.ValidateRecurringTransaction(recurringReq); err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrValidation,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    recurringReq,
			})
			return
		}

		// Create the recurring transaction template
		_, err := h.recurringService.CreateRecurringTransaction(ctx, userID, recurringReq)
		if err != nil {
			h.logger.Error().Err(err).Msg("Failed to create recurring transaction template")
			// Note: We don't return an error here since the main transaction was created successfully
			// We could add a warning to the response instead
		}
	}

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) CreateTransfert(w http.ResponseWriter, r *http.Request) {
	var req CreateTransfertRequest
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

	// Force transfer type
	req.Type = "transfer"

	// Parse UUIDs
	accountID, err := uuid.Parse(req.AccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	destAccountID, err := uuid.Parse(req.DestinationAccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
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
			Details:    req,
		})
		return
	}

	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
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
			Details:    req,
		})
		return
	}

	// Create transfer using repository
	transaction, err := h.repo.CreateTransfertTransaction(ctx, TransfertParams{
		Amount:               decimal.NewFromFloat(req.Amount),
		Type:                 req.Type,
		AccountID:            accountID,
		DestinationAccountID: destAccountID,
		CategoryID:           categoryID,
		TransactionCurrency:  "USD",
		OriginalAmount:       decimal.NewFromFloat(req.Amount),
		Description:          req.Description,
		TransactionDatetime:  req.TransactionDatetime,
		Details:              req.Details,
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
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) UpdateTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trscID, err := request.ParseUUID(r, "id")
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

	var req UpdateTransactionRequest
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

	h.logger.Debug().Any("req", req).Msg("request")

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

	params := repository.UpdateTransactionParams{
		ID:        trscID,
		Details:   req.Details,
		UpdatedBy: &userID,
	}

	if req.Amount != nil {
		params.Amount = types.FloatToNullDecimal(*req.Amount)
	}

	if req.AccountID != nil {
		accountID, err := uuid.Parse(*req.AccountID)
		if err != nil {
			// Handle error
		}
		params.AccountID = &accountID
	}

	if req.CategoryID != nil {
		categoryID, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			// Handle error
		}
		params.CategoryID = &categoryID
	}

	if req.Description != nil {
		params.Description = req.Description
	}

	if req.TransactionDatetime != nil {
		params.TransactionDatetime = pgtype.Timestamptz{Time: *req.TransactionDatetime, Valid: true}
	}

	if req.Type != nil {
		params.Type = req.Type
	}

	h.logger.Info().Any("request", req).Msg("cool")
	h.logger.Info().Any("package", params).Msg("nothin day")

	transaction, err := h.repo.UpdateTransaction(ctx, params)
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

func (h *Handler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	trscID, err := request.ParseUUID(r, "id")
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

// // CreateRecurringTransaction handles creating a new recurring transaction.
// func CreateRecurringTransaction(w http.ResponseWriter, r *http.Request) {
// 	userID, err := middleware.GetUserIDFromContext(r.Context())
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
//
// 	var rt models.RecurringTransaction
// 	if err := json.NewDecoder(r.Body).Decode(&rt); err != nil {
// 		http.Error(w, "Invalid request body", http.StatusBadRequest)
// 		return
// 	}
//
// 	// Validate AccountID belongs to UserID
// 	var count int
// 	err = db.GetDB().QueryRow("SELECT COUNT(*) FROM accounts WHERE id = $1 AND user_id = $2", rt.AccountID, userID).Scan(&count)
// 	if err != nil || count == 0 {
// 		http.Error(w, "Invalid account ID or unauthorized access to account", http.StatusBadRequest)
// 		return
// 	}
//
// 	rt.UserID = userID
// 	rt.CreatedAt = time.Now()
// 	rt.UpdatedAt = time.Now()
//
// 	query := `INSERT INTO recurring_transactions (user_id, account_id, description, amount, type, category_id, frequency, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at`
//
// 	categoryIDNull := utils.UUIDPtrToNullString(rt.CategoryID)
// 	endDateNull := utils.TimePtrToNullTime(rt.EndDate)
//
// 	err = db.GetDB().QueryRow(query,
// 		rt.UserID, rt.AccountID, rt.Description, rt.Amount, rt.Type, categoryIDNull, rt.Frequency, rt.StartDate, endDateNull,
// 	).Scan(&rt.ID, &rt.CreatedAt, &rt.UpdatedAt)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to create recurring transaction")
// 		http.Error(w, "Could not create recurring transaction", http.StatusInternalServerError)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(rt)
// }
//
// // GetRecurringTransactions fetches all recurring transactions for a user.
// func GetRecurringTransactions(w http.ResponseWriter, r *http.Request) {
// 	userID, err := middleware.GetUserIDFromContext(r.Context())
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
//
// 	query := `SELECT id, account_id, description, amount, type, category_id, frequency, start_date, end_date, last_generated_date, created_at, updated_at FROM recurring_transactions WHERE user_id = $1 ORDER BY description`
// 	rows, err := db.GetDB().Query(query, userID)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to fetch recurring transactions")
// 		http.Error(w, "Failed to fetch recurring transactions", http.StatusInternalServerError)
// 		return
// 	}
// 	defer rows.Close()
//
// 	var rts []models.RecurringTransaction
// 	for rows.Next() {
// 		var rt models.RecurringTransaction
// 		var categoryID sql.NullString
// 		var endDate, lastGeneratedDate sql.NullTime
// 		err := rows.Scan(
// 			&rt.ID, &rt.AccountID, &rt.Description, &rt.Amount, &rt.Type, &categoryID,
// 			&rt.Frequency, &rt.StartDate, &endDate, &lastGeneratedDate, &rt.CreatedAt, &rt.UpdatedAt,
// 		)
// 		if err != nil {
// 			config.Log.WithError(err).Warn("Error scanning recurring transaction row")
// 			continue
// 		}
// 		rt.UserID = userID
// 		rt.CategoryID = utils.NullStringToUUIDPtr(categoryID)
// 		rt.EndDate = utils.NullTimeToTimePtr(endDate)
// 		rt.LastGeneratedDate = utils.NullTimeToTimePtr(lastGeneratedDate)
// 		rts = append(rts, rt)
// 	}
//
// 	if err = rows.Err(); err != nil {
// 		config.Log.WithError(err).Error("Error iterating recurring transaction rows")
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}
//
// 	json.NewEncoder(w).Encode(rts)
// }
//
// // GeneratePendingRecurringTransactions (for internal or periodic call by a cron job)
// // This simulates a background worker.
// func GeneratePendingRecurringTransactions(w http.ResponseWriter, r *http.Request) {
// 	// For demo, assume this is called by an admin or scheduled task.
// 	// In production, this would be a separate microservice or cron job.
// 	// For now, let's limit to a specific user or fetch all recurring txs across users.
//
// 	// For demo, fetch all recurring transactions for current user (or all users in a real cron)
// 	userID, err := middleware.GetUserIDFromContext(r.Context()) // Assuming triggered by a user
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
//
// 	query := `SELECT id, user_id, account_id, description, amount, type, category_id, frequency, start_date, end_date, last_generated_date FROM recurring_transactions WHERE user_id = $1 AND is_active = TRUE` // Assume active status
// 	rows, err := db.GetDB().Query(query, userID)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to fetch recurring transactions for generation")
// 		http.Error(w, "Failed to retrieve recurring transactions", http.StatusInternalServerError)
// 		return
// 	}
// 	defer rows.Close()
//
// 	generatedCount := 0
// 	today := time.Now()
//
// 	tx, err := db.GetDB().Begin() // Use a transaction for atomic updates
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to begin DB transaction for recurring tx generation")
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}
// 	defer tx.Rollback() // Rollback on error
//
// 	for rows.Next() {
// 		var rt models.RecurringTransaction
// 		var categoryID sql.NullString
// 		var endDate, lastGeneratedDate sql.NullTime
// 		err := rows.Scan(
// 			&rt.ID, &rt.UserID, &rt.AccountID, &rt.Description, &rt.Amount, &rt.Type, &categoryID,
// 			&rt.Frequency, &rt.StartDate, &endDate, &lastGeneratedDate,
// 		)
// 		if err != nil {
// 			config.Log.WithError(err).Warn("Error scanning recurring transaction for generation")
// 			continue
// 		}
// 		rt.CategoryID = utils.NullStringToUUIDPtr(categoryID)
// 		rt.EndDate = utils.NullTimeToTimePtr(endDate)
// 		rt.LastGeneratedDate = utils.NullTimeToTimePtr(lastGeneratedDate)
//
// 		nextGenerationDate := rt.StartDate // Start from start date if never generated
// 		if rt.LastGeneratedDate != nil {
// 			nextGenerationDate = *rt.LastGeneratedDate
// 		}
//
// 		for {
// 			switch rt.Frequency {
// 			case "daily":
// 				nextGenerationDate = nextGenerationDate.AddDate(0, 0, 1)
// 			case "weekly":
// 				nextGenerationDate = nextGenerationDate.AddDate(0, 0, 7)
// 			case "bi-weekly":
// 				nextGenerationDate = nextGenerationDate.AddDate(0, 0, 14)
// 			case "monthly":
// 				nextGenerationDate = nextGenerationDate.AddDate(0, 1, 0)
// 			case "quarterly":
// 				nextGenerationDate = nextGenerationDate.AddDate(0, 3, 0)
// 			case "yearly":
// 				nextGenerationDate = nextGenerationDate.AddDate(1, 0, 0)
// 			default:
// 				config.Log.WithField("frequency", rt.Frequency).Warn("Unknown frequency for recurring transaction")
// 				goto nextRecurringTransaction // Skip to next recurring transaction
// 			}
//
// 			if nextGenerationDate.After(today) {
// 				break // No more transactions to generate for this recurring item yet
// 			}
// 			if rt.EndDate != nil && nextGenerationDate.After(*rt.EndDate) {
// 				break // Recurring transaction ended
// 			}
//
// 			// Create actual transaction
// 			newTransaction := models.Transaction{
// 				UserID:        rt.UserID,
// 				AccountID:     rt.AccountID,
// 				Description:   rt.Description,
// 				Amount:        rt.Amount,
// 				Type:          rt.Type,
// 				Date:          nextGenerationDate,
// 				CategoryID:    rt.CategoryID,
// 				IsCategorized: rt.CategoryID != nil,
// 				CreatedAt:     time.Now(),
// 				UpdatedAt:     time.Now(),
// 			}
//
// 			insertTxQuery := `INSERT INTO transactions (user_id, account_id, description, amount, type, date, category_id, is_categorized) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
// 			_, err = tx.Exec(insertTxQuery,
// 				newTransaction.UserID, newTransaction.AccountID, newTransaction.Description, newTransaction.Amount,
// 				newTransaction.Type, newTransaction.Date, utils.UUIDPtrToNullString(newTransaction.CategoryID), newTransaction.IsCategorized,
// 			)
// 			if err != nil {
// 				config.Log.WithError(err).WithField("recurringTxID", rt.ID).Error("Failed to insert generated transaction")
// 				// Don't break, try to generate others, but log error
// 			} else {
// 				generatedCount++
// 			}
// 		}
// 		// Update last_generated_date for the recurring transaction
// 		updateRTQuery := `UPDATE recurring_transactions SET last_generated_date = $1, updated_at = $2 WHERE id = $3`
// 		_, err = tx.Exec(updateRTQuery, nextGenerationDate, time.Now(), rt.ID)
// 		if err != nil {
// 			config.Log.WithError(err).WithField("recurringTxID", rt.ID).Error("Failed to update last_generated_date")
// 		}
// 		nextRecurringTransaction: // Label for goto
// 	}
//
// 	err = tx.Commit()
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to commit recurring transaction generation")
// 		http.Error(w, "Failed to commit generated transactions", http.StatusInternalServerError)
// 		return
// 	}
//
// 	json.NewEncoder(w).Encode(map[string]string{
// 		"message": fmt.Sprintf("Successfully generated %d transactions.", generatedCount),
// 	})
// }

// // AutomatedImportTransaction handles transactions coming from automated sources (e.g., receipt parser).
// // This endpoint expects a pre-shared API key or service account token
// // to identify the source and map to a specific user/account.
// func AutomatedImportTransaction(w http.ResponseWriter, r *http.Request) {
//     // Authentication for this endpoint must be different from standard JWT user auth.
//     // Use an API key/service account token. For now, a simple header check.
//     // In a real system, you'd use a more sophisticated API key management system.
//     providedAPIKey := r.Header.Get("Authorization") // Assuming "Bearer YOUR_API_KEY"
//     if providedAPIKey == "" || !strings.HasPrefix(providedAPIKey, "Bearer ") {
//         http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
//         return
//     }
//     apiKey := strings.TrimPrefix(providedAPIKey, "Bearer ")
//
//     // Map API key to a specific user ID and an associated default account ID.
//     // This mapping would ideally be in a `service_accounts` table or config.
//     // For demo, hardcode a mapping or infer from API key.
//     // Let's assume a default `receipt_parser_user_id` and `receipt_parser_account_id`
//     // configured in environment variables or config files.
//
//     // Fetch this from DB or env for a specific 'system user' for automation
//     var systemUserID string
//     var systemAccountID string
//     // In a production system, this could be:
//     // var user models.User
//     // db.GetDB().QueryRow("SELECT user_id, default_account_id FROM automated_importers WHERE api_key = $1", apiKey).Scan(...)
//     // For simplicity, let's just use a hardcoded system user (needs to exist in `users` table)
//     systemUserID = os.Getenv("RECEIPT_PARSER_USER_ID")
//     systemAccountID = os.Getenv("RECEIPT_PARSER_ACCOUNT_ID") // default account for receipts
//
//     if systemUserID == "" || systemAccountID == "" {
//         http.Error(w, "Automated import not configured (missing user/account ID mapping)", http.StatusInternalServerError)
//         config.Log.Error("Automated import received, but system user/account not configured.")
//         return
//     }
//
//     parsedSystemUserID, _ := uuid.Parse(systemUserID)
//     parsedSystemAccountID, _ := uuid.Parse(systemAccountID)
//
//     var reqPayload struct {
//         Description string  `json:"description"`
//         Amount      float64 `json:"amount"`
//         Date        string  `json:"date"` // YYYY-MM-DD
//         Type        string  `json:"type"` // "expense", "income"
//         Source      string  `json:"source"`
//     }
//
//     bodyBytes, err := ioutil.ReadAll(r.Body)
//     if err != nil {
//         http.Error(w, "Failed to read request body", http.StatusBadRequest)
//         return
//     }
//     if err := json.Unmarshal(bodyBytes, &reqPayload); err != nil {
//         config.Log.WithError(err).WithField("body", string(bodyBytes)).Error("Failed to parse automated import request body")
//         http.Error(w, "Invalid request body format", http.StatusBadRequest)
//         return
//     }
//
//     txDate, err := time.Parse("2006-01-02", reqPayload.Date)
//     if err != nil {
//         http.Error(w, "Invalid date format. Expected YYYY-MM-DD", http.StatusBadRequest)
//         return
//     }
//
//     // Auto-categorize using AI service for automated imports
//     var categoryID *uuid.UUID
//     var isCategorized bool = false
//     predictedCategoryName, aiErr := callAIPredictCategory(reqPayload.Description) // Reuse AI prediction
//     if aiErr == nil && predictedCategoryName != "" {
//         var catID uuid.UUID
//         // Try to find a matching category by name (global or system user's specific)
//         catQuery := `SELECT id FROM categories WHERE name = $1 AND (user_id IS NULL OR user_id = $2) LIMIT 1`
//         err = db.GetDB().QueryRow(catQuery, predictedCategoryName, parsedSystemUserID).Scan(&catID)
//         if err == nil {
//             categoryID = &catID
//             isCategorized = true
//         } else {
//             config.Log.WithField("categoryName", predictedCategoryName).Warn("AI predicted category not found in DB for automated import.")
//         }
//     } else if aiErr != nil {
//         config.Log.WithError(aiErr).Warn("AI categorization failed for automated import.")
//     }
//
//     newTransaction := models.Transaction{
//         UserID:        parsedSystemUserID,
//         AccountID:     parsedSystemAccountID,
//         Description:   reqPayload.Description,
//         Amount:        reqPayload.Amount,
//         Type:          reqPayload.Type,
//         Date:          txDate,
//         CategoryID:    categoryID,
//         IsCategorized: isCategorized,
//         CreatedAt:     time.Now(),
//         UpdatedAt:     time.Now(),
//     }
//
//     insertQuery := `INSERT INTO transactions (user_id, account_id, description, amount, type, date, category_id, is_categorized) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
//
//     var insertedID uuid.UUID
//     err = db.GetDB().QueryRow(insertQuery,
//         newTransaction.UserID, newTransaction.AccountID, newTransaction.Description, newTransaction.Amount,
//         newTransaction.Type, newTransaction.Date, utils.UUIDPtrToNullString(newTransaction.CategoryID), newTransaction.IsCategorized,
//     ).Scan(&insertedID)
//     if err != nil {
//         config.Log.WithError(err).Error("Failed to insert automated transaction into DB")
//         http.Error(w, "Failed to record transaction", http.StatusInternalServerError)
//         return
//     }
//
//     config.Log.WithField("transactionID", insertedID).WithField("source", reqPayload.Source).Info("Automated transaction imported successfully.")
//     json.NewEncoder(w).Encode(map[string]string{"message": "Transaction recorded successfully", "transaction_id": insertedID.String()})
// }
//

// BulkDeleteTransactions handles bulk deletion of transactions
func (h *Handler) BulkDeleteTransactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req BulkDeleteTransactionsRequest

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

	// Parse transaction IDs
	ids := make([]uuid.UUID, len(req.TransactionIDs))
	for i, idStr := range req.TransactionIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrBadRequest,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    idStr,
			})
			return
		}
		ids[i] = id
	}

	err = h.repo.BulkDeleteTransactions(ctx, ids, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    ids,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

// BulkUpdateCategories handles bulk category updates for transactions
func (h *Handler) BulkUpdateCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req BulkUpdateCategoriesRequest

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

	// Parse transaction IDs
	ids := make([]uuid.UUID, len(req.TransactionIDs))
	for i, idStr := range req.TransactionIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrBadRequest,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    idStr,
			})
			return
		}
		ids[i] = id
	}

	// Parse category ID
	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req.CategoryID,
		})
		return
	}

	err = h.repo.BulkUpdateTransactionCategories(ctx, ids, categoryID, userID)
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

	respond.Status(w, http.StatusOK)
}

// BulkUpdateManualTransactions handles bulk updates for manual transactions
func (h *Handler) BulkUpdateManualTransactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req BulkUpdateManualTransactionsRequest

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

	// Parse transaction IDs
	ids := make([]uuid.UUID, len(req.TransactionIDs))
	for i, idStr := range req.TransactionIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrBadRequest,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    idStr,
			})
			return
		}
		ids[i] = id
	}

	params := BulkUpdateManualTransactionsParams{
		Ids:                 ids,
		TransactionDatetime: req.TransactionDatetime,
		UserID:              userID,
	}

	// Parse optional category ID
	if req.CategoryID != nil {
		categoryID, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrBadRequest,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    *req.CategoryID,
			})
			return
		}
		params.CategoryID = &categoryID
	}

	// Parse optional account ID
	if req.AccountID != nil {
		accountID, err := uuid.Parse(*req.AccountID)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  message.ErrBadRequest,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    *req.AccountID,
			})
			return
		}
		params.AccountID = &accountID
	}

	err = h.repo.BulkUpdateManualTransactions(ctx, params)
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

	respond.Status(w, http.StatusOK)
}
