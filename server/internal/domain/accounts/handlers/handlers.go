package handlers

import (
	"net/http"
	"net/url"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/service"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/telemetry"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Handler struct {
	service   service.Account
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Account, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{
		service,
		validator,
		logger,
	}
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
			Details:    nil,
		})
		return
	}

	accounts, err := h.service.ListAccounts(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl": r.RequestURI,
				"operation":  "GetAccounts",
			},
		})
		return
	}

	respond.Json(w, http.StatusOK, accounts, h.logger)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl": r.RequestURI,
				"operation":  "GetAccount",
			},
		})

		return
	}

	account, err := h.service.GetAccount(ctx, accountID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  accounts.ErrAccountNotFound,
				ActualErr:  err,
				Logger:     h.logger,
				Details: map[string]any{
					"requestUrl": r.RequestURI,
					"operation":  "GetAccount",
					"account_id": accountID,
				},
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details: map[string]any{
				"requestUrl": r.RequestURI,
				"operation":  "GetAccount",
				"account_id": accountID,
			},
		})
		return
	}

	respond.Json(w, http.StatusOK, account, h.logger)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "accounts.Create")
	defer func() {
		metrics.End(http.StatusOK) // Default status, will be overridden if there's an error
	}()

	var req accounts.CreateAccountRequest

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		telemetry.RecordError(ctx, "validation_parse_error", "accounts.Create")
		metrics.End(http.StatusBadRequest)
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
		telemetry.RecordError(ctx, "validation_error", "accounts.Create")
		telemetry.RecordBusinessEvent(ctx, "account_create", "failure")
		metrics.End(http.StatusBadRequest)
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

	balance := decimal.NullDecimal{
		Decimal: decimal.NewFromFloat(req.Balance),
		Valid:   true,
	}

	act, err := accounts.ValidateAccountType(req.Type)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  accounts.ErrAccountTypeInvalid,
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
			Details:    nil,
		})
		return
	}

	external := false
	hasBalance := req.Balance == 0

	params := repository.CreateAccountParams{
		CreatedBy:  &userID,
		Name:       req.Name,
		Type:       act,
		Balance:    balance,
		Currency:   req.Currency,
		Meta:       req.Meta,
		IsExternal: &external,
	}

	account, err := h.service.CreateAccount(ctx, hasBalance, params)
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

	respond.Json(w, http.StatusOK, account, h.logger)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	accountID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    accountID,
		})
		return
	}

	var req accounts.CreateAccountRequest

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

	balance := decimal.NullDecimal{
		Decimal: decimal.NewFromFloat(req.Balance),
		Valid:   true,
	}

	act, err := accounts.ValidateNullableAccountType(req.Type)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  accounts.ErrAccountTypeInvalid,
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
			Details:    nil,
		})
		return
	}

	account, err := h.service.UpdateAccount(ctx, repository.UpdateAccountParams{
		Name:      &req.Name,
		Type:      act,
		Currency:  &req.Currency,
		Balance:   balance,
		Meta:      req.Meta,
		UpdatedBy: &userID,
		ID:        accountID,
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

	respond.Json(w, http.StatusOK, account, h.logger)
}

// Delete an account
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    accountID,
		})
		return
	}

	if err = h.service.DeleteAccount(ctx, accountID); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    accountID,
		})
		return

	}

	respond.Status(w, http.StatusOK)
}

func (h *Handler) GetTrends(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	u, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    u,
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
			Details:    userID,
		})
		return
	}

	startDateStr := u.Get("start")
	endDateStr := u.Get("end")

	var startDate, endDate time.Time

	if startDateStr != "" && endDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  accounts.ErrAccountQueryParamInvalid,
				ActualErr:  err,
				Logger:     h.logger,
			})
			return
		}

		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  accounts.ErrAccountQueryParamInvalid,
				ActualErr:  err,
				Logger:     h.logger,
			})
			return
		}

		// Ensure startDate is before endDate
		if startDate.After(endDate) {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusBadRequest,
				ClientErr:  accounts.ErrEndDateBeforeStart,
				Logger:     h.logger,
			})
			return
		}
	} else {
		endDate = time.Now().Add(24 * time.Hour) // Include today fully
		startDate = endDate.AddDate(-1, 0, 0)    // 1 year before endDate
	}

	account, err := h.service.GetAccountsTrends(ctx, &userID, startDate, endDate)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, h.logger)
}

func (h *Handler) GetBalanceTimeline(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	accountID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    accountID,
		})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    accountID,
		})
		return
	}

	accounts, err := h.service.GetAccountBalanceTimeline(ctx, userID, accountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	respond.Json(w, http.StatusOK, accounts, h.logger)
}

func (h *Handler) ListBalanceTimelines(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
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

	account, err := h.service.GetAccountsBalanceTimeline(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, h.logger)
}

func (h *Handler) TellerConnect(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
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

	var req accounts.TellerConnectRequest

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

	err = h.service.LinkTeller(ctx, userID, req)
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

	respond.Response(w, r, http.StatusOK, accounts.TellerLinkedMessage, nil)
}

func (h *Handler) MonoConnect(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
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

	var req accounts.MonoConnectRequest

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

	err = h.service.LinkMono(ctx, userID, req)
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

	respond.Response(w, r, http.StatusOK, accounts.MonoLinkedMessage, nil)
}

// func (h *Handler) MonoWebhook(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
//
// 	var webhook struct {
// 		Event string `json:"event"`
// 		Data  struct {
// 			ID       string `json:"id"`
// 			Customer string `json:"customer"`
// 			Meta     struct {
// 				DataStatus string `json:"data_status"`
// 				AuthMethod string `json:"auth_method"`
// 			} `json:"meta"`
// 			Account *struct {
// 				ID            string  `json:"_id"`
// 				Name          string  `json:"name"`
// 				Currency      string  `json:"currency"`
// 				Type          string  `json:"type"`
// 				AccountNumber string  `json:"accountNumber"`
// 				Balance       float64 `json:"balance"`
// 				Institution   struct {
// 					Name     string `json:"name"`
// 					BankCode string `json:"bankCode"`
// 					Type     string `json:"type"`
// 				} `json:"institution"`
// 				BVN string `json:"bvn"`
// 			} `json:"account"`
// 		} `json:"data"`
// 	}
//
// 	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
// 		respond.Error(respond.ErrorOptions{
// 			W:          w,
// 			R:          r,
// 			StatusCode: http.StatusBadRequest,
// 			ClientErr:  message.ErrBadRequest,
// 			ActualErr:  err,
// 			Logger:     h.logger,
// 			Details:    nil,
// 		})
// 		return
// 	}
//
// 	switch webhook.Event {
// 	case "mono.events.account_connected":
// 		// Account has been linked successfully
// 		h.logger.Info().
// 			Str("account_id", webhook.Data.ID).
// 			Str("customer", webhook.Data.Customer).
// 			Msg("Mono account connected")
//
// 	case "mono.events.account_updated":
// 		// Account data status has been updated
// 		if webhook.Data.Meta.DataStatus == "AVAILABLE" && webhook.Data.Account != nil {
// 			// Data is now available, create the account in our system
// 			err := h.createMonoAccount(ctx, webhook.Data.ID, *webhook.Data.Account)
// 			if err != nil {
// 				h.logger.Error().Err(err).
// 					Str("account_id", webhook.Data.ID).
// 					Msg("Failed to create account from Mono webhook")
// 			}
// 		}
// 	}
//
// 	// Acknowledge webhook
// 	w.WriteHeader(http.StatusOK)
// }
//
// func (h *Handler) createMonoAccount(ctx context.Context, monoAccountID string, monoAccount struct {
// 	ID            string  `json:"_id"`
// 	Name          string  `json:"name"`
// 	Currency      string  `json:"currency"`
// 	Type          string  `json:"type"`
// 	AccountNumber string  `json:"accountNumber"`
// 	Balance       float64 `json:"balance"`
// 	Institution   struct {
// 		Name     string `json:"name"`
// 		BankCode string `json:"bankCode"`
// 		Type     string `json:"type"`
// 	} `json:"institution"`
// 	BVN string `json:"bvn"`
// },
// ) error {
// 	// Find the user associated with this Mono account
// 	connection, err := h.repo.GetConnectionByProviderAccountID(ctx, "mono", monoAccountID)
// 	if err != nil {
// 		return fmt.Errorf("failed to find connection: %w", err)
// 	}
//
// 	// Map Mono account type to your internal account type
// 	accountType, err := mapMonoAccountType(monoAccount.Type)
// 	if err != nil {
// 		return fmt.Errorf("failed to map account type: %w", err)
// 	}
//
// 	// Create account in your system
// 	params := repository.CreateAccountParams{
// 		CreatedBy:         &connection.UserID,
// 		Name:              fmt.Sprintf("%s - %s", monoAccount.Institution.Name, monoAccount.Name),
// 		Type:              accountType,
// 		Balance:           types.Numeric(monoAccount.Balance / 100), // Mono returns balance in kobo/cents
// 		Currency:          monoAccount.Currency,
// 		ProviderAccountID: &monoAccountID,
// 		Provider:          stringPtr("mono"),
// 		AccountNumber:     &monoAccount.AccountNumber,
// 		InstitutionName:   &monoAccount.Institution.Name,
// 		Color:             "blue", // Default color, you might want to make this configurable
// 		Meta: map[string]interface{}{
// 			"mono_account_id":  monoAccount.ID,
// 			"bank_code":        monoAccount.Institution.BankCode,
// 			"institution_type": monoAccount.Institution.Type,
// 			"bvn":              monoAccount.BVN,
// 		},
// 	}
//
// 	var account repository.Account
// 	if monoAccount.Balance == 0 {
// 		account, err = h.repo.CreateAccount(ctx, params)
// 	} else {
// 		account, err = h.repo.CreateAccountWInitalTrs(ctx, params)
// 	}
//
// 	if err != nil {
// 		return fmt.Errorf("failed to create account: %w", err)
// 	}
//
// 	h.logger.Info().
// 		Str("account_id", account.ID).
// 		Str("mono_account_id", monoAccountID).
// 		Str("user_id", connection.UserID).
// 		Msg("Successfully created account from Mono")
//
// 	return nil
// }

// func (h *Handler) PlaidConnect(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
//
// 	userID, err := jwt.GetUserID(r)
// 	if err != nil {
// 		respond.Error(respond.ErrorOptions{
// 			W:          w,
// 			R:          r,
// 			StatusCode: http.StatusInternalServerError,
// 			ClientErr:  message.ErrInternalError,
// 			ActualErr:  err,
// 			Logger:     h.logger,
// 			Details:    userID,
// 		})
// 		return
// 	}
//
// plaidClientID := os.Getenv("PLAID_CLIENT_ID")
// plaidSecret := os.Getenv("PLAID_SECRET")
// if plaidClientID == "" || plaidSecret == "" {
// 	http.Error(w, "Plaid credentials not configured", http.StatusInternalServerError)
// 	return
// }
//
// reqBody := models.CreateLinkTokenRequest{
// 	PlaidClientID: plaidClientID,
// 	PlaidSecret:   plaidSecret,
// 	ClientName:    "Personal Finance Manager", // Your app name
// 	Language:      "en",
// 	CountryCodes:  []string{"US"},
// 	User: struct {
// 		ClientUserID string `json:"client_user_id"`
// 	}{
// 		ClientUserID: userID.String(), // Pass your internal user ID to Plaid
// 	},
// 	Products: []string{"transactions"}, // Or other products like "assets", "investments", "balance"
// }
//
// jsonReqBody, _ := json.Marshal(reqBody)
//
// resp, err := http.Post(getPlaidEnvURL()+"/link/token/create", "application/json", bytes.NewBuffer(jsonReqBody))
// if err != nil {
// 	log.Printf("Error calling Plaid /link/token/create: %v", err)
// 	http.Error(w, "Failed to connect to Plaid", http.StatusInternalServerError)
// 	return
// }
// defer resp.Body.Close()
//
// if resp.StatusCode != http.StatusOK {
// 	bodyBytes, _ := ioutil.ReadAll(resp.Body)
// 	log.Printf("Plaid /link/token/create returned non-OK status: %d, body: %s", resp.StatusCode, string(bodyBytes))
// 	http.Error(w, fmt.Sprintf("Plaid error: %s", string(bodyBytes)), resp.StatusCode)
// 	return
// }
//
// var linkTokenRes models.CreateLinkTokenResponse
// if err := json.NewDecoder(resp.Body).Decode(&linkTokenRes); err != nil {
// 	log.Printf("Error decoding Plaid link token response: %v", err)
// 	http.Error(w, "Failed to parse Plaid response", http.StatusInternalServerError)
// 	return
// }
//
// json.NewEncoder(w).Encode(linkTokenRes)
// }

// TODO: Interesting

// 	if account.PlaidItemID != nil || account.PlaidAccountID != nil {
// 		http.Error(w, "Cannot manually create Plaid-connected accounts via this endpoint", http.StatusBadRequest)
// 		return
// 	}

// 	// Assign shared_finance_id based on active context
// 	if activeContext.Type == "shared" && activeContext.SharedFinanceID != nil {
// 		// Verify user is admin or allowed to add to this shared finance group
// 		// For simplicity: allow any member to add to the shared group they're viewing.
// 		// More robust: query shared_finance_members table for role 'admin'
// 		account.SharedFinanceID = activeContext.SharedFinanceID
// 	} else {
// 		account.SharedFinanceID = nil // Personal account
// 	}
//
// 	query := `INSERT INTO accounts (user_id, name, type, current_balance, currency, shared_finance_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
// 	err = db.GetDB().QueryRow(query,
// 		account.UserID, account.Name, account.Type, account.CurrentBalance, account.Currency,
// 		utils.UUIDPtrToNullString(account.SharedFinanceID),
// 	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Error creating account")
// 		http.Error(w, "Could not create account", http.StatusInternalServerError)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(account)
// }
//
// // GetAccounts handles fetching accounts accessible by the user based on context.
// func GetAccounts(w http.ResponseWriter, r *http.Request) {
// 	userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
// 	activeContext := middleware.GetActiveSharedFinanceContext(r.Context())
//
// 	// Build the base query
// 	baseQuery := `SELECT id, name, type, current_balance, currency, plaid_item_id, plaid_account_id, shared_finance_id, created_at, updated_at FROM accounts`
//
// 	// Add WHERE clause based on active context
// 	whereClause, args, _ := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "accounts", 1)
// 	fullQuery := fmt.Sprintf("%s WHERE %s ORDER BY name", baseQuery, whereClause)
//
//
// 	rows, err := db.GetDB().Query(fullQuery, args...) // Pass arguments dynamically
// 	if err != nil {
// 		config.Log.WithError(err).WithField("query", fullQuery).WithField("args", args).Error("Error getting accounts")
// 		http.Error(w, "Could not retrieve accounts", http.StatusInternalServerError)
// 		return
// 	}
// 	defer rows.Close()
//
// 	var accounts []models.Account
// 	for rows.Next() {
// 		var account models.Account
// 		var plaidItemID, plaidAccountID, sharedFinanceID sql.NullString
// 		err := rows.Scan(
// 			&account.ID, &account.Name, &account.Type, &account.CurrentBalance,
// 			&account.Currency, &plaidItemID, &plaidAccountID, &sharedFinanceID, &account.CreatedAt, &account.UpdatedAt,
// 		)
// 		if err != nil {
// 			config.Log.WithError(err).Warn("Error scanning account")
// 			continue
// 		}
// 		account.PlaidItemID = utils.NullStringToStringPtr(plaidItemID)
// 		account.PlaidAccountID = utils.NullStringToStringPtr(plaidAccountID)
// 		account.SharedFinanceID = utils.NullStringToUUIDPtr(sharedFinanceID) // Populate shared_finance_id
// 		account.UserID = userID // For display, though not directly fetched from DB for shared items
//
// 		accounts = append(accounts, account)
// 	}
//
// 	if err = rows.Err(); err != nil {
// 		config.Log.WithError(err).Error("Error iterating rows for accounts")
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}
//
// 	json.NewEncoder(w).Encode(accounts)
// }
//
// // GetAccount handles fetching a single account, ensuring user access.
// func GetAccount(w http.ResponseWriter, r *http.Request) {
// 	userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
// 	activeContext := middleware.GetActiveSharedFinanceContext(r.Context())
//
// 	vars := mux.Vars(r)
// 	accountID, err := uuid.Parse(vars["id"])
// 	if err != nil {
// 		http.Error(w, "Invalid account ID", http.StatusBadRequest)
// 		return
// 	}
//
// 	baseQuery := `SELECT id, user_id, name, type, current_balance, currency, plaid_item_id, plaid_account_id, shared_finance_id, created_at, updated_at FROM accounts`
//
// 	// Ensure the ID belongs to the user's accessible scope
// 	whereClause, args, nextArgIndex := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "accounts", 1)
// 	fullQuery := fmt.Sprintf("%s WHERE id = $%d AND %s", baseQuery, nextArgIndex, whereClause)
// 	args = append([]interface{}{accountID}, args...) // Prepend accountID to args
//
//
// 	var account models.Account
// 	var plaidItemID, plaidAccountID, sharedFinanceID sql.NullString
// 	err = db.GetDB().QueryRow(fullQuery, args...).Scan(
// 		&account.ID, &account.UserID, &account.Name, &account.Type, &account.CurrentBalance, &account.Currency,
// 		&plaidItemID, &plaidAccountID, &sharedFinanceID, &account.CreatedAt, &account.UpdatedAt,
// 	)
// 	if err != nil {
// 		if err == sql.ErrNoRows {
// 			http.Error(w, "Account not found or unauthorized", http.StatusNotFound)
// 			return
// 		}
// 		config.Log.WithError(err).WithField("accountID", accountID).Error("Error getting single account")
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}
// 	account.PlaidItemID = utils.NullStringToStringPtr(plaidItemID)
// 	account.PlaidAccountID = utils.NullStringToStringPtr(plaidAccountID)
// 	account.SharedFinanceID = utils.NullStringToUUIDPtr(sharedFinanceID) // Populate shared_finance_id
// 	json.NewEncoder(w).Encode(account)
// }
//
//
// // UpdateAccount handles updating an existing account, ensuring user access.
// func UpdateAccount(w http.ResponseWriter, r *http.Request) {
//     userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
//     if err != nil {
//         http.Error(w, "Unauthorized", http.StatusUnauthorized)
//         return
//     }
//     activeContext := middleware.GetActiveSharedFinanceContext(r.Context())
//
//     vars := mux.Vars(r)
//     accountID, err := uuid.Parse(vars["id"])
//     if err != nil {
//         http.Error(w, "Invalid account ID", http.StatusBadRequest)
//         return
//     }
//
//     var updatedAccount models.Account
//     if err := json.NewDecoder(r.Body).Decode(&updatedAccount); err != nil {
//         http.Error(w, "Invalid request body", http.StatusBadRequest)
//         return
//     }
//
//     // Prevent updating Plaid specific fields directly via this endpoint
//     if updatedAccount.PlaidItemID != nil || updatedAccount.PlaidAccountID != nil {
//         http.Error(w, "Cannot update Plaid-specific fields via this endpoint", http.StatusBadRequest)
//         return
//     }
//     // Prevent updating shared_finance_id directly here, it should be managed by Shared Finance APIs
//     if updatedAccount.SharedFinanceID != nil {
//         http.Error(w, "Cannot update shared_finance_id directly via this endpoint", http.StatusBadRequest)
//         return
//     }
//
//     // First, verify access to the account
//     verifyQuery := `SELECT id FROM accounts`
//     verifyWhere, verifyArgs, verifyNextArg := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "accounts", 1)
//     verifyQuery = fmt.Sprintf("%s WHERE id = $%d AND %s", verifyQuery, verifyNextArg, verifyWhere)
//     verifyArgs = append([]interface{}{accountID}, verifyArgs...)
//
//     var existingAccountID uuid.UUID
//     err = db.GetDB().QueryRow(verifyQuery, verifyArgs...).Scan(&existingAccountID)
//     if err != nil {
//         if err == sql.ErrNoRows {
//             http.Error(w, "Account not found or unauthorized", http.StatusNotFound)
//             return
//         }
//         config.Log.WithError(err).WithField("accountID", accountID).Error("Error verifying account access for update")
//         http.Error(w, "Internal server error during account update verification", http.StatusInternalServerError)
//         return
//     }
//
//     // Now perform the update on the verified account
//     query := `UPDATE accounts SET name = $1, type = $2, current_balance = $3, currency = $4, updated_at = $5 WHERE id = $6`
//     res, err := db.GetDB().Exec(query, updatedAccount.Name, updatedAccount.Type, updatedAccount.CurrentBalance, updatedAccount.Currency, time.Now(), accountID)
//     if err != nil {
//         config.Log.WithError(err).Error("Error updating account")
//         http.Error(w, "Could not update account", http.StatusInternalServerError)
//         return
//     }
//     rowsAffected, _ := res.RowsAffected()
//     if rowsAffected == 0 {
//         http.Error(w, "Account not found after verification (race condition or bad ID)", http.StatusInternalServerError)
//         return
//     }
//     w.WriteHeader(http.StatusOK)
//     json.NewEncoder(w).Encode(map[string]string{"message": "Account updated successfully"})
// }
//
// // DeleteAccount handles deleting an account, ensuring user access.
// func DeleteAccount(w http.ResponseWriter, r *http.Request) {
//     userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
//     if err != nil {
//         http.Error(w, "Unauthorized", http.StatusUnauthorized)
//         return
//     }
//     activeContext := middleware.GetActiveSharedFinanceContext(r.Context())
//
//     vars := mux.Vars(r)
//     accountID, err := uuid.Parse(vars["id"])
//     if err != nil {
//         http.Error(w, "Invalid account ID", http.StatusBadRequest)
//         return
//     }
//
//     // First, verify access to the account (similar to Update)
//     verifyQuery := `SELECT id FROM accounts`
//     verifyWhere, verifyArgs, verifyNextArg := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "accounts", 1)
//     verifyQuery = fmt.Sprintf("%s WHERE id = $%d AND %s", verifyQuery, verifyNextArg, verifyWhere)
//     verifyArgs = append([]interface{}{accountID}, verifyArgs...)
//
//     var existingAccountID uuid.UUID
//     err = db.GetDB().QueryRow(verifyQuery, verifyArgs...).Scan(&existingAccountID)
//     if err != nil {
//         if err == sql.ErrNoRows {
//             http.Error(w, "Account not found or unauthorized", http.StatusNotFound)
//             return
//         }
//         config.Log.WithError(err).WithField("accountID", accountID).Error("Error verifying account access for delete")
//         http.Error(w, "Internal server error during account delete verification", http.StatusInternalServerError)
//         return
//     }
//
//     // Now perform the delete
//     query := `DELETE FROM accounts WHERE id = $1`
//     res, err := db.GetDB().Exec(query, accountID)
//     if err != nil {
//         config.Log.WithError(err).Error("Error deleting account")
//         http.Error(w, "Could not delete account", http.StatusInternalServerError)
//         return
//     }
//     rowsAffected, _ := res.RowsAffected()
//     if rowsAffected == 0 {
//         http.Error(w, "Account not found (race condition or bad ID)", http.StatusInternalServerError)
//         return
//     }
//     w.WriteHeader(http.StatusOK)
//     json.NewEncoder(w).Encode(map[string]string{"message": "Account deleted successfully"})
// }
