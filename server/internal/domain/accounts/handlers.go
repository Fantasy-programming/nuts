package accounts

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Handler struct {
	validator          *validation.Validator
	db                 *pgxpool.Pool
	repo               Repository
	openFinanceManager *finance.ProviderManager
	scheduler          *jobs.Service
	logger             *zerolog.Logger
}

func NewHandler(validator *validation.Validator, db *pgxpool.Pool, repo Repository, openFinanceManager *finance.ProviderManager, scheduler *jobs.Service, logger *zerolog.Logger) *Handler {
	return &Handler{validator, db, repo, openFinanceManager, scheduler, logger}
}

func (h *Handler) GetAccounts(w http.ResponseWriter, r *http.Request) {
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
			Details:    r.RequestURI,
		})
		return
	}

	accounts, err := h.repo.GetAccounts(ctx, userID)
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

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
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

	account, err := h.repo.GetAccountByID(ctx, accountID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  ErrAccountNotFound,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    accountID,
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
			Details:    accountID,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, h.logger)
}

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req CreateAccountRequest

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

	balance := types.Numeric(req.Balance)
	act, err := validateAccountType(req.Type)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrAccountTypeInvalid,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	color, err := validateColor(req.Color)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrColorTypeInvalid,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	meta := parseMeta(req.Meta)

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

	var account repository.Account

	params := repository.CreateAccountParams{
		CreatedBy: &userID,
		Name:      req.Name,
		Type:      act,
		Balance:   balance,
		Currency:  req.Currency,
		Meta:      meta,
		Color:     color,
	}

	if req.Balance == 0 {
		account, err = h.repo.CreateAccount(ctx, params)
	} else {
		account, err = h.repo.CreateAccountWInitalTrs(ctx, params)
	}

	// save the account
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

func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	accountID, err := parseUUID(r, "id")
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

	var req CreateAccountRequest

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

	balance := types.Numeric(req.Balance)
	act, err := validateNullableAccountType(req.Type)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrAccountTypeInvalid,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	color, err := validateNullableColor(req.Color)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrColorTypeInvalid,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	meta := parseMeta(req.Meta)

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

	account, err := h.repo.UpdateAccount(ctx, repository.UpdateAccountParams{
		Name:      &req.Name,
		Type:      act,
		Currency:  &req.Currency,
		Balance:   balance,
		Color:     color,
		Meta:      meta,
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
func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
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

	if err = h.repo.DeleteAccount(ctx, accountID); err != nil {
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

func (h *Handler) GetAccountsTrends(w http.ResponseWriter, r *http.Request) {
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
				ClientErr:  ErrAccountQueryParamInvalid,
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
				ClientErr:  ErrAccountQueryParamInvalid,
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
				ClientErr:  ErrEndDateBeforeStart,
				Logger:     h.logger,
			})
			return
		}
	} else {
		endDate = time.Now().Add(24 * time.Hour) // Include today fully
		startDate = endDate.AddDate(-1, 0, 0)    // 1 year before endDate
	}

	account, err := h.repo.GetAccountsTrends(ctx, &userID, startDate, endDate)
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

func (h *Handler) GetAccountBTimeline(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	accountID, err := parseUUID(r, "id")
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

	accounts, err := h.repo.GetAccountBTimeline(ctx, accountID)
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

func (h *Handler) GetAccountsBTimeline(w http.ResponseWriter, r *http.Request) {
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

	account, err := h.repo.GetAccountsBTimeline(ctx, &userID)
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

	var req TellerConnectRequest

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

	// Complete the registration flow (fetch data from the provider to create the account)
	provider, err := h.openFinanceManager.GetProvider("teller")
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
	}

	accounts, err := provider.GetAccounts(ctx, req.AccessToken)
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

	encryptedAccessToken := req.AccessToken

	// Attempt to find an existing connection for this user, provider, and item_id (if available from Teller)
	// For Teller, the access token itself might be the unique item_id for the connection.
	// This part depends on how Teller identifies a specific connection/item.
	// Let's assume for now Teller doesn't provide a separate item_id and the access_token is unique per link.
	// If Teller provides an item_id, use it in GetConnectionByProviderItemIDParams.
	// For this example, we'll proceed to create a new connection or update if a similar one is found.

	// For Teller, we might not have a distinct item_id from the token exchange immediately.
	// The access_token itself might serve as the primary identifier for the link.
	// We'll use a placeholder or a hash of the token if an item_id is strictly required by GetConnectionByProviderItemID.
	// Or, we might skip checking for an existing connection if Teller's flow always means a new link.

	// For now, let's assume we create a new connection record each time,
	// or you'd implement logic to find/update based on available identifiers.
	// The `accounts` from `provider.GetAccounts` might contain institution details.
	// We'll use the first account's institution details if available.
	var institutionID, institutionName *string
	if len(accounts) > 0 {
		institutionID = &accounts[0].InstitutionID
		institutionName = &accounts[0].InstitutionName
	}

	status := "active"
	providerName := provider.GetProviderName()
	isExternal := true

	connParams := repository.CreateConnectionParams{
		UserID:               &userID,
		ProviderName:         &providerName,
		AccessTokenEncrypted: &encryptedAccessToken,
		ItemID:               nil, // Teller itemId is the accessID
		InstitutionID:        institutionID,
		InstitutionName:      institutionName,
		Status:               &status,                                           // Default status
		LastSyncAt:           pgtype.Timestamptz{Time: time.Now(), Valid: true}, // Set initial sync time
		ExpiresAt:            pgtype.Timestamptz{Valid: false},
	}

	connection, err := h.repo.CreateConnection(ctx, connParams)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to save Teller connection",
		})
		return
	}

	var createdAccounts []repository.Account
	var accountCreationErrors []error

	for _, providerAccount := range accounts {
		accountParams := repository.CreateAccountParams{
			CreatedBy:         &userID,
			Name:              providerAccount.Name,
			Type:              providerAccount.Type,
			Balance:           types.Numeric(providerAccount.Balance), // Assuming finance.ProviderAccount.Balance is float64
			ProviderAccountID: &providerAccount.ProviderAccountID,
			ProviderName:      &providerName,
			IsExternal:        &isExternal,
			Currency:          providerAccount.Currency,
			ConnectionID:      &connection.ID,           // Link to the connection
			Color:             repository.COLORENUMBlue, // Example: default color
		}

		newAccount, err := h.repo.CreateAccount(ctx, accountParams)
		if err != nil {
			h.logger.Error().Err(err).Interface("account_params", accountParams).Msg("Failed to create linked account from Teller")
			accountCreationErrors = append(accountCreationErrors, fmt.Errorf("account %s (%s): %w", providerAccount.Name, providerAccount.ID, err))
			continue
		}

		createdAccounts = append(createdAccounts, newAccount)

	}

	if len(accountCreationErrors) > 0 {
		// Optionally, you might want to return a partial success or a specific error message
		h.logger.Warn().Errs("errors", accountCreationErrors).Msg("Some accounts could not be created from Teller")
	}

	if err = h.scheduler.EnqueueBankSync(ctx, userID, connection.ID, "full"); err != nil {
		h.logger.Error().Err(err).Msg("Failed to schedule bank sync")
	}

	h.logger.Info().Str("user_id", userID.String()).Str("connection_id", connection.ID.String()).Int("accounts_fetched_from_provider", len(accounts)).Int("accounts_created_in_db", len(createdAccounts)).Msg("Teller connection and account linking process completed")
	respond.Json(w, http.StatusOK, map[string]any{
		"message":                         "Teller connection successful. Accounts processed.",
		"connection_id":                   connection.ID,
		"provider_accounts_fetched_count": len(accounts),
		"internal_accounts_created_count": len(createdAccounts),
		"account_creation_errors":         len(accountCreationErrors), // Or provide more detailed errors
	}, h.logger)
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

	var req MonoConnectRequest

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

	provider, err := h.openFinanceManager.GetProvider("mono")
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
	}

	exchangeResp, err := provider.ExchangePublicToken(ctx, finance.ExchangeTokenRequest{
		PublicToken: req.Code,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError, // Or a more specific provider error
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to exchange Mono token",
		})
		return
	}

	// Mono's exchangeResp.AccessToken is effectively the item_id (or "account_id" in Mono terms)
	monoItemID := exchangeResp.AccessToken
	providerName := "mono"

	// TODO: Encrypt monoItemID if it's sensitive and stored as access_token_encrypted,
	// or store it primarily as item_id. For Mono, there isn't a traditional access token post-exchange.
	// The item_id (Mono's account_id) is used for subsequent API calls.
	// We'll store item_id and leave access_token_encrypted as this item_id for now (needs clarification on best practice for Mono).
	encryptedMonoIdentifier := monoItemID // Placeholder

	// Check if a connection already exists for this user, provider, and item_id
	existingConn, err := h.repo.GetConnectionByProviderItemID(ctx, repository.GetConnectionByProviderItemIDParams{
		UserID:       userID,
		ProviderName: providerName,
		ItemID:       &encryptedMonoIdentifier,
	})

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError, ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger, Details: "Failed to check existing Mono connection"})
		return
	}

	status := "pending_auth"
	statusActive := "active"

	var connection repository.UserFinancialConnection
	if errors.Is(err, pgx.ErrNoRows) { // No existing connection, create new
		connParams := repository.CreateConnectionParams{
			UserID:               &userID,
			ProviderName:         &providerName,
			AccessTokenEncrypted: &encryptedMonoIdentifier, // Or a more specific token if Mono provides one
			ItemID:               &encryptedMonoIdentifier,
			// Institution details might be fetched later via webhook or separate API call for Mono
			InstitutionID:   nil,
			InstitutionName: nil,
			Status:          &status, // Or "active" if data sync is immediate, "pending_auth" if webhooks are primary
			LastSyncAt:      pgtype.Timestamptz{Valid: false},
			ExpiresAt:       pgtype.Timestamptz{Valid: false}, // Set if Mono provides expiration
		}
		connection, err = h.repo.CreateConnection(ctx, connParams)
		if err != nil {
			respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError, ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger, Details: "Failed to create Mono connection record"})
			return
		}
		h.logger.Info().Str("user_id", userID.String()).Str("connection_id", connection.ID.String()).Msg("Mono connection created")
	} else { // Existing connection found
		connection = existingConn
		// Optionally, update status or last_sync_at if needed
		// For example, if re-linking, you might want to set status to 'active' and update last_sync_at
		updatedConn, updateErr := h.repo.UpdateConnection(ctx, repository.UpdateConnectionParams{
			ID:                   &connection.ID,
			UserID:               &userID,                  // For WHERE clause in SQL query
			Status:               &statusActive,            // Example: mark as active on re-link
			AccessTokenEncrypted: &encryptedMonoIdentifier, // Update token if it can change
			LastSyncAt:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
		})
		if updateErr != nil {
			respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError, ClientErr: message.ErrInternalError, ActualErr: updateErr, Logger: h.logger, Details: "Failed to update existing Mono connection"})
			return
		}
		connection = updatedConn
		h.logger.Info().Str("user_id", userID.String()).Str("connection_id", connection.ID.String()).Msg("Mono connection re-linked/updated")
	}

	// At this point, we have the Account ID (monoItemID) but need to wait for data to be available
	// The account creation in your system will happen via webhook or polling using this monoItemID.
	// The `connection.ID` links your internal system to this Mono connection.

	if err = h.scheduler.EnqueueBankSync(ctx, userID, connection.ID, "full"); err != nil {
		h.logger.Error().Err(err).Msg("Failed to schedule bank sync")
	}

	response := map[string]any{
		"connection_id":    connection.ID.String(),
		"provider_item_id": monoItemID, // This is Mono's "account_id"
		"status":           connection.Status,
		"message":          "Mono account linked successfully. Financial data synchronization will follow.",
	}

	respond.Json(w, http.StatusOK, response, h.logger)
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
