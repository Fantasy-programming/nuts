package transactions

import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// TODO: Handle transfers

func (a *Transactions) GetTransactions(w http.ResponseWriter, r *http.Request) {
	userID, err := jwtauth.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	transactions, err := a.queries.ListTransactions(ctx, &userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	groupped, err := groupTransactions(transactions)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, groupped)
}

func (a *Transactions) GetTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	transaction, err := a.queries.GetTransactionById(ctx, trscID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(w, http.StatusNotFound, ErrNoTransactions, err)
			return
		}

		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, transaction)
}

func (a *Transactions) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var request CreateTransactionRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	// Validate
	amount := types.Numeric(request.Amount)
	accountID, err := uuid.Parse(request.AccountID)

	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	id, err := jwtauth.GetID(r)
	if err != nil {
		log.Println(err)
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	defer func() {
		if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
			log.Println("CreateTransaction: Failed to rollback transaction", err)
		}
	}()

	qtx := a.queries.WithTx(tx)

	// when doing a transfer, we do something different (create transaction, remove from account a and add to account b)

	transaction, err := qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              amount,
		Type:                request.Type,
		AccountID:           accountID,
		CategoryID:          categoryID,
		Description:         request.Description,
		TransactionDatetime: request.TransactionDatetime,
		Details:             request.Details,
		CreatedBy:           &id,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      accountID,
		Balance: amount,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, transaction)
}

func (a *Transactions) CreateTransfert(w http.ResponseWriter, r *http.Request) {
	var request CreateTransfertRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	// Force transfer type
	request.Type = "transfer"

	// Parse UUIDs
	accountID, err := uuid.Parse(request.AccountID)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	destAccountID, err := uuid.Parse(request.DestinationAccountID)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	if accountID == destAccountID {
		respond.Error(w, http.StatusBadRequest, ErrSameAccount, nil)
		return
	}

	categoryID, err := uuid.Parse(request.CategoryID)
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	userID, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	// Start transaction
	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}
	defer tx.Rollback(ctx)

	qtx := a.queries.WithTx(tx)

	fmt.Println("usrid:", userID)

	// Verify accounts exist and belong to user
	sourceAcc, err := qtx.GetAccountById(ctx, accountID)
	fmt.Println("source:", sourceAcc.CreatedBy)

	if err != nil || *sourceAcc.CreatedBy != userID {
		respond.Error(w, http.StatusNotFound, ErrSrcAccNotFound, nil)
		return
	}

	destAcc, err := qtx.GetAccountById(ctx, destAccountID)
	if err != nil || *destAcc.CreatedBy != userID {
		respond.Error(w, http.StatusNotFound, ErrDestAccNotFound, nil)
		return
	}

	// Check sufficient balance
	amountOut := types.Numeric(-request.Amount)
	newBalance := sourceAcc.Balance
	newBalance.Int = new(big.Int).Add(newBalance.Int, amountOut.Int)
	if newBalance.Int == nil || newBalance.Int.Sign() < 0 {
		respond.Error(w, http.StatusBadRequest, ErrLowBalance, nil)
		return
	}

	// Create the transfer transaction
	amountIn := types.Numeric(request.Amount)
	transaction, err := qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:               amountOut,
		Type:                 request.Type,
		AccountID:            accountID,
		DestinationAccountID: &destAccountID,
		CategoryID:           categoryID,
		Description:          request.Description,
		TransactionDatetime:  request.TransactionDatetime,
		Details:              request.Details,
		CreatedBy:            &userID,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	// Update account balances
	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      accountID,
		Balance: amountOut,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      destAccountID,
		Balance: amountIn,
	})
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return
	}

	respond.Json(w, http.StatusOK, transaction)
}

func (a *Transactions) UpdateTransaction(w http.ResponseWriter, r *http.Request) {}

func (a *Transactions) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(w, http.StatusBadRequest, message.ErrBadRequest, err)
		return
	}

	if err = a.queries.DeleteTransaction(ctx, trscID); err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError, err)
		return

	}

	respond.Status(w, http.StatusOK)
}
