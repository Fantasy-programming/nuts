package accounts

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/lib/validation"
	ut "github.com/go-playground/universal-translator"
	"github.com/jackc/pgx/v5"
)

func (a *Account) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userID, err := jwtauth.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	accounts, err := a.queries.GetAccounts(ctx, &userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, accounts)
}

func (a *Account) GetAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	account, err := a.queries.GetAccountById(ctx, accountID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(w, http.StatusNotFound, ErrAccountNotFound, err)
			return
		}

		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, account)
}

func (a *Account) CreateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trans := ctx.Value("translator").(ut.Translator)

	var req CreateAccountRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return

	}

	// Validate balance
	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := validation.TranslateErrors(err, trans)
		respond.Errors(w, http.StatusBadRequest, message.ErrValidation, validationErrors)
		return
	}

	balance := types.Numeric(req.Balance)
	act, err := validateAccountType(req.Type)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, ErrAccountTypeInvalid, err)
		return
	}

	color, err := validateColor(req.Colors)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, ErrAccountTypeInvalid, err)
		return
	}

	meta := parseMeta(req.Meta)

	userID, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
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
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, account)
}

func (a *Account) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trans := ctx.Value("translator").(ut.Translator)

	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	var req CreateAccountRequest

	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	// Validate and parse
	if err := a.validate.Validator.Struct(req); err != nil {
		validationErrors := validation.TranslateErrors(err, trans)
		respond.Errors(w, http.StatusBadRequest, message.ErrValidation, validationErrors)
		return
	}

	balance := types.Numeric(req.Balance)
	act, err := validateNullableAccountType(req.Type)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, ErrAccountTypeInvalid, err)
		return
	}

	color, err := validateNullableColor(req.Colors)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, ErrAccountTypeInvalid, err)
		return
	}

	meta := parseMeta(req.Meta)

	userID, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
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
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, account)
}

// Delete an account
func (a *Account) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	accountID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	if err = a.queries.DeleteAccount(ctx, accountID); err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return

	}

	respond.Status(w, http.StatusOK)
}
