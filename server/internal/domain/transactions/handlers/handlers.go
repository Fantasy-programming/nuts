package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	sqlRepo "github.com/Fantasy-Programming/nuts/server/internal/repository"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
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
	service   service.Transactions
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Transactions, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{service, validator, logger}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
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
	params := transactions.ListTransactionsParams{
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
	transactions, err := h.service.GetTransactions(ctx, params, groupByDate)
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

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
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

	transaction, err := h.service.GetTransaction(ctx, trscID)
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

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req transactions.CreateTransactionRequest
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
	transaction, err := h.service.CreateTransaction(ctx, sqlRepo.CreateTransactionParams{
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

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) CreateTransfert(w http.ResponseWriter, r *http.Request) {
	var req transactions.CreateTransfertRequest
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
			ClientErr:  transactions.ErrSameAccount,
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
	transaction, err := h.service.CreateTransfertTransaction(ctx, transactions.TransfertParams{
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
		case transactions.ErrSrcAccNotFound:
			statusCode = http.StatusNotFound
			clientErr = transactions.ErrSrcAccNotFound
		case transactions.ErrDestAccNotFound:
			statusCode = http.StatusNotFound
			clientErr = transactions.ErrDestAccNotFound
		case transactions.ErrLowBalance:
			statusCode = http.StatusBadRequest
			clientErr = transactions.ErrLowBalance
		case transactions.ErrSameAccount:
			statusCode = http.StatusBadRequest
			clientErr = transactions.ErrSameAccount
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

	// // Apply rules to the newly created transaction
	// if h.rulesService != nil {
	// 	err = h.rulesService.AutoApplyRulesToNewTransaction(ctx, transaction.ID, userID)
	// 	if err != nil {
	// 		// Log the error but don't fail the transaction creation
	// 		h.logger.Error().Err(err).Str("transaction_id", transaction.ID.String()).Msg("Failed to apply rules to transaction")
	// 	}
	// }

	respond.Json(w, http.StatusOK, transaction, h.logger)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
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

	var req transactions.UpdateTransactionRequest
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

	params := sqlRepo.UpdateTransactionParams{
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

	transaction, err := h.service.UpdateTransaction(ctx, params)
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

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
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

	if err = h.service.DeleteTransaction(ctx, trscID); err != nil {
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

// AutomatedImportTransaction handles transactions coming from automated sources (e.g., receipt parser).
// This endpoint expects a pre-shared API key or service account token
// to identify the source and map to a specific user/account.
// func AutomatedImport(w http.ResponseWriter, r *http.Request) {
// 	// Authentication for this endpoint must be different from standard JWT user auth.
// 	// Use an API key/service account token. For now, a simple header check.
// 	// In a real system, you'd use a more sophisticated API key management system.
//
// 	apiKey := r.Header.Get("X-Nuts-Key") // Assuming "Bearer YOUR_API_KEY"
// 	if apiKey == "" {
// 		http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
// 		return
// 	}
//
// 	// Map API key to a specific user ID and an associated default account ID.
// 	// This mapping would ideally be in a `service_accounts` table or config.
// 	// For demo, hardcode a mapping or infer from API key.
// 	// Let's assume a default `receipt_parser_user_id` and `receipt_parser_account_id`
// 	// configured in environment variables or config files.
//
// 	// Fetch this from DB or env for a specific 'system user' for automation
// 	var systemUserID string
// 	var systemAccountID string
//
// 	// In a production system, this could be:
// 	// var user models.User
// 	// db.GetDB().QueryRow("SELECT user_id, default_account_id FROM automated_importers WHERE api_key = $1", apiKey).Scan(...)
// 	// For simplicity, let's just use a hardcoded system user (needs to exist in `users` table)
// 	systemUserID = os.Getenv("RECEIPT_PARSER_USER_ID")
// 	systemAccountID = os.Getenv("RECEIPT_PARSER_ACCOUNT_ID") // default account for receipts
//
// 	if systemUserID == "" || systemAccountID == "" {
// 		http.Error(w, "Automated import not configured (missing user/account ID mapping)", http.StatusInternalServerError)
// 		config.Log.Error("Automated import received, but system user/account not configured.")
// 		return
// 	}
//
// 	parsedSystemUserID, _ := uuid.Parse(systemUserID)
// 	parsedSystemAccountID, _ := uuid.Parse(systemAccountID)
//
// 	var reqPayload struct {
// 		Description string  `json:"description"`
// 		Amount      float64 `json:"amount"`
// 		Date        string  `json:"date"` // YYYY-MM-DD
// 		Type        string  `json:"type"` // "expense", "income"
// 		Source      string  `json:"source"`
// 	}
//
// 	bodyBytes, err := ioutil.ReadAll(r.Body)
// 	if err != nil {
// 		http.Error(w, "Failed to read request body", http.StatusBadRequest)
// 		return
// 	}
// 	if err := json.Unmarshal(bodyBytes, &reqPayload); err != nil {
// 		config.Log.WithError(err).WithField("body", string(bodyBytes)).Error("Failed to parse automated import request body")
// 		http.Error(w, "Invalid request body format", http.StatusBadRequest)
// 		return
// 	}
//
// 	txDate, err := time.Parse("2006-01-02", reqPayload.Date)
// 	if err != nil {
// 		http.Error(w, "Invalid date format. Expected YYYY-MM-DD", http.StatusBadRequest)
// 		return
// 	}
//
// 	// Auto-categorize using AI service for automated imports
// 	var categoryID *uuid.UUID
// 	var isCategorized bool = false
// 	predictedCategoryName, aiErr := callAIPredictCategory(reqPayload.Description) // Reuse AI prediction
// 	if aiErr == nil && predictedCategoryName != "" {
// 		var catID uuid.UUID
// 		// Try to find a matching category by name (global or system user's specific)
// 		catQuery := `SELECT id FROM categories WHERE name = $1 AND (user_id IS NULL OR user_id = $2) LIMIT 1`
// 		err = db.GetDB().QueryRow(catQuery, predictedCategoryName, parsedSystemUserID).Scan(&catID)
// 		if err == nil {
// 			categoryID = &catID
// 			isCategorized = true
// 		} else {
// 			config.Log.WithField("categoryName", predictedCategoryName).Warn("AI predicted category not found in DB for automated import.")
// 		}
// 	} else if aiErr != nil {
// 		config.Log.WithError(aiErr).Warn("AI categorization failed for automated import.")
// 	}
//
// 	newTransaction := models.Transaction{
// 		UserID:        parsedSystemUserID,
// 		AccountID:     parsedSystemAccountID,
// 		Description:   reqPayload.Description,
// 		Amount:        reqPayload.Amount,
// 		Type:          reqPayload.Type,
// 		Date:          txDate,
// 		CategoryID:    categoryID,
// 		IsCategorized: isCategorized,
// 		CreatedAt:     time.Now(),
// 		UpdatedAt:     time.Now(),
// 	}
//
// 	insertQuery := `INSERT INTO transactions (user_id, account_id, description, amount, type, date, category_id, is_categorized) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
//
// 	var insertedID uuid.UUID
// 	err = db.GetDB().QueryRow(insertQuery,
// 		newTransaction.UserID, newTransaction.AccountID, newTransaction.Description, newTransaction.Amount,
// 		newTransaction.Type, newTransaction.Date, utils.UUIDPtrToNullString(newTransaction.CategoryID), newTransaction.IsCategorized,
// 	).Scan(&insertedID)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to insert automated transaction into DB")
// 		http.Error(w, "Failed to record transaction", http.StatusInternalServerError)
// 		return
// 	}
//
// 	config.Log.WithField("transactionID", insertedID).WithField("source", reqPayload.Source).Info("Automated transaction imported successfully.")
// 	json.NewEncoder(w).Encode(map[string]string{"message": "Transaction recorded successfully", "transaction_id": insertedID.String()})
// }

func (h *Handler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req transactions.BulkDeleteTransactionsRequest

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

	err = h.service.BulkDeleteTransactions(ctx, sqlRepo.BulkDeleteTransactionsParams{
		Ids:    ids,
		UserID: &userID,
	})
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

func (h *Handler) BulkUpdateCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req transactions.BulkUpdateCategoriesRequest

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

	err = h.service.BulkUpdateTransactionCategories(ctx, sqlRepo.BulkUpdateTransactionCategoriesParams{
		Ids:        ids,
		CategoryID: &categoryID,
		UserID:     &userID,
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

	respond.Status(w, http.StatusOK)
}

func (h *Handler) BulkUpdateManualTransactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req transactions.BulkUpdateManualTransactionsRequest

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

	params := transactions.BulkUpdateManualTransactionsParams{
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

	err = h.service.BulkUpdateManualTransactions(ctx, params)
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
