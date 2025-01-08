package accounts

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/google/uuid"
)

func (a *Account) GetAccounts(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	accounts, err := a.queries.GetAccounts(r.Context(), &id)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, err)
	}

	respond.Json(w, http.StatusOK, accounts)
}

func (a *Account) GetAccount(w http.ResponseWriter, r *http.Request) {
	idString := r.PathValue("id")

	if idString == "" {
		log.Println("GetAccount: Missing :id")
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	finalId, err := uuid.Parse(idString)
	if err != nil {
		log.Println("GetAccount: Failed to parse uuid", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	account, err := a.queries.GetAccountById(r.Context(), finalId)
	if err != nil {
		log.Println("GetAccount: Failed to fetch accounts from db", err)
		respond.Error(w, http.StatusInternalServerError, err)
	}

	respond.Json(w, http.StatusOK, account)
}

func (a *Account) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var request CreateAccountRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("CreateAccount: Bad request", err, r.Body)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// Validate balance

	balance := types.Numeric(request.Balance)

	// Validate accounttype

	var act repository.ACCOUNTTYPE
	err = act.Scan(request.Type)
	if err != nil {
		log.Println("CreateAccount: Unsupported Account type", err, request.Type)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !act.Valid() {
		log.Println("CreateAccount: Unsupported Account type", err, request.Type)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// Validate color

	var color repository.COLORENUM
	err = color.Scan(request.Colors)
	if err != nil {
		log.Println("CreateAccount: Unsupported Color", err, request.Colors)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !color.Valid() {
		log.Println("CreateAccount: Unsupported Color", err, request.Colors)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// validate meta

	var meta []byte

	if request.Meta != nil {
		meta = *request.Meta
	}

	// Get id from context
	id, err := jwtauth.GetID(r)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	// save the account

	account, err := a.queries.CreateAccount(r.Context(), repository.CreateAccountParams{
		CreatedBy: &id,
		Name:      request.Name,
		Type:      act,
		Balance:   balance,
		Currency:  request.Currency,
		Meta:      meta,
		Color:     color,
	})
	if err != nil {
		log.Println("CreateAccount: Failed to fetch from db", err)
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	respond.Json(w, http.StatusOK, account)
}

func (a *Account) UpdateAccount(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	if idStr == "" {
		log.Println("UpdateAccount: Missing :id")
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// Get id from context
	accountID, err := uuid.Parse(idStr)
	if err != nil {
		log.Println("UpdateAccount: Invalid uuid", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	var request CreateAccountRequest

	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("UpdateAccount: Bad request", err, r.Body)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// Validate and parse

	balance := types.Numeric(request.Balance)

	var act repository.NullACCOUNTTYPE
	err = act.Scan(request.Type)
	if err != nil {

		log.Println("UpdateAccount: Unsupported Account type", err, request.Type)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !act.ACCOUNTTYPE.Valid() {
		log.Println("UpdateAccount: Unsupported Account type", err, request.Type)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	var color repository.NullCOLORENUM
	err = color.Scan(request.Colors)
	if err != nil {
		log.Println("UpdateAccount: Unsupported Color type", err, request.Colors)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	if !color.COLORENUM.Valid() {
		log.Println("UpdateAccount: Unsupported Color type", err, request.Colors)
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	var meta []byte

	if request.Meta != nil {
		meta = *request.Meta
	}

	userID, err := jwtauth.GetID(r)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	account, err := a.queries.UpdateAccount(r.Context(), repository.UpdateAccountParams{
		Name:      &request.Name,
		Type:      act,
		Currency:  &request.Currency,
		Balance:   balance,
		Color:     color,
		Meta:      meta,
		UpdatedBy: &userID,
		ID:        accountID,
	})
	if err != nil {
		log.Println("UpdateAccount: Failed to mutate db", err)
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	respond.Json(w, http.StatusOK, account)
}

func (a *Account) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	if idStr == "" {
		log.Println("DeleteAccount: Missing :id")
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}
	// Get id from context
	id, err := uuid.Parse(idStr)
	if err != nil {
		log.Println("DeleteAccount: Failed to parse uuid", err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	// delete the account
	err = a.queries.DeleteAccount(r.Context(), id)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}

	respond.Status(w, http.StatusOK)
}
