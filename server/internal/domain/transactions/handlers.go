package transactions

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/google/uuid"
)

func (a *Transactions) GetTransactions(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}
	transactions, err := a.queries.ListTransactions(r.Context(), &id)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}
	payload, err := json.Marshal(transactions)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}
	respond.Json(w, http.StatusOK, payload)
}

func (a *Transactions) GetTransaction(w http.ResponseWriter, r *http.Request) {
	idString := r.PathValue("id")

	if idString == "" {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	finalId, err := uuid.Parse(idString)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	transaction, err := a.queries.GetTransactionById(r.Context(), finalId)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}

	payload, err := json.Marshal(transaction)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}
	respond.Json(w, http.StatusOK, payload)
}

func (a *Transactions) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var request CreateTransactionRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	// Validate

	amount := types.Numeric(request.Amount)

	accountID, err := uuid.Parse(request.AccountID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	id, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	transaction, err := a.queries.CreateTransaction(r.Context(), repository.CreateTransactionParams{
		Amount:              amount,
		Type:                request.Type,
		AccountID:           accountID,
		CategoryID:          categoryID,
		Description:         request.Description,
		TransactionDatetime: request.TransactionDatetime,
		Medium:              request.Medium,
		Location:            request.Location,
		Details:             request.Details,
		CreatedBy:           &id,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	payload, err := json.Marshal(transaction)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	respond.Json(w, http.StatusOK, payload)
}

func (a *Transactions) UpdateTransaction(w http.ResponseWriter, r *http.Request) {}

func (a *Transactions) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	idString := r.PathValue("id")

	if idString == "" {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest)
		return
	}

	finalId, err := uuid.Parse(idString)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	err = a.queries.DeleteTransaction(r.Context(), finalId)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	respond.Status(w, http.StatusOK)
}
