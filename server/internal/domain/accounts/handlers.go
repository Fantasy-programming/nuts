package accounts

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/jackc/pgx/v5"
)

func (a *Account) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    userID,
		})
		return
	}

	accounts, err := a.queries.GetAccounts(ctx, &userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, accounts, a.log)
}

func (a *Account) GetAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    accountID,
		})
		return
	}

	account, err := a.queries.GetAccountById(ctx, accountID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  ErrAccountNotFound,
				ActualErr:  err,
				Logger:     a.log,
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
			Logger:     a.log,
			Details:    accountID,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, a.log)
}

func (a *Account) CreateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req CreateAccountRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    r.Body,
		})
		return

	}

	// Validate balance
	if err := a.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     a.log,
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
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	color, err := validateColor(req.Colors)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrAccountTypeInvalid,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	meta := parseMeta(req.Meta)

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    nil,
		})
		return
	}

	// save the account
	account, err := a.queries.CreateAccount(ctx, repository.CreateAccountParams{
		CreatedBy: &userID,
		Name:      req.Name,
		Type:      act,
		Balance:   balance,
		Currency:  req.Currency,
		Meta:      meta,
		Color:     color,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, a.log)
}

func (a *Account) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    accountID,
		})
		return
	}

	var req CreateAccountRequest

	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    r.Body,
		})
		return
	}

	// Validate and parse
	if err := a.v.Validator.Struct(req); err != nil {
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     a.log,
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
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	color, err := validateNullableColor(req.Colors)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrAccountTypeInvalid,
			ActualErr:  err,
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	meta := parseMeta(req.Meta)

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    nil,
		})
		return
	}

	account, err := a.queries.UpdateAccount(ctx, repository.UpdateAccountParams{
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
			Logger:     a.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, account, a.log)
}

// Delete an account
func (a *Account) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    accountID,
		})
		return
	}

	if err = a.queries.DeleteAccount(ctx, accountID); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    accountID,
		})
		return

	}

	respond.Status(w, http.StatusOK)
}
