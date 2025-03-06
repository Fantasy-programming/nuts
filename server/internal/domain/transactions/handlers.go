package transactions

import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/types"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// TODO: Handle transfers

func (a *Transactions) GetTransactions(w http.ResponseWriter, r *http.Request) {
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

	// Get Accounts
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

	// Create account map for faster lookups
	accountMap := createAccountMap(accounts)

	transactions, err := a.queries.ListTransactions(ctx, repository.ListTransactionsParams{
		UserID: &userID,
	})
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

	// Enhance transactions with destination account data
	enhancedTransactions := enhanceTransactionsWithDestAccounts(transactions, accountMap)

	// Group the enhanced transactions
	grouped, err := groupEnhancedTransactions(enhancedTransactions)
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

	respond.Json(w, http.StatusOK, grouped, a.log)
}

func (a *Transactions) GetTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    r.URL.Path,
		})
		return
	}

	transaction, err := a.queries.GetTransactionById(ctx, trscID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusNotFound,
				ClientErr:  ErrNoTransactions,
				ActualErr:  err,
				Logger:     a.log,
				Details:    trscID,
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
			Details:    trscID,
		})

		return
	}

	respond.Json(w, http.StatusOK, transaction, a.log)
}

func (a *Transactions) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var request CreateTransactionRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {

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

	// Validate
	amount := types.Numeric(request.Amount)
	accountID, err := uuid.Parse(request.AccountID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
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
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	id, err := jwt.GetID(r)
	if err != nil {
		log.Println(err)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
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
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      accountID,
		Balance: amount,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	respond.Json(w, http.StatusOK, transaction, a.log)
}

func (a *Transactions) CreateTransfert(w http.ResponseWriter, r *http.Request) {
	var request CreateTransfertRequest
	ctx := r.Context()

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
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
			Logger:     a.log,
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
			Logger:     a.log,
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
			Logger:     a.log,
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
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	// Start transaction
	tx, err := a.db.Begin(ctx)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}
	defer tx.Rollback(ctx)

	qtx := a.queries.WithTx(tx)

	fmt.Println("usrid:", userID)

	// Verify accounts exist and belong to user
	sourceAcc, err := qtx.GetAccountById(ctx, accountID)
	fmt.Println("source:", sourceAcc.CreatedBy)

	if err != nil || *sourceAcc.CreatedBy != userID {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusNotFound,
			ClientErr:  ErrSrcAccNotFound,
			ActualErr:  nil,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	destAcc, err := qtx.GetAccountById(ctx, destAccountID)
	if err != nil || *destAcc.CreatedBy != userID {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusNotFound,
			ClientErr:  ErrDestAccNotFound,
			ActualErr:  nil,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	// Check sufficient balance
	amountOut := types.Numeric(-request.Amount)
	newBalance := sourceAcc.Balance
	newBalance.Int = new(big.Int).Add(newBalance.Int, amountOut.Int)
	if newBalance.Int == nil || newBalance.Int.Sign() < 0 {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrLowBalance,
			ActualErr:  nil,
			Logger:     a.log,
			Details:    request,
		})
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
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	// Update account balances
	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      accountID,
		Balance: amountOut,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	err = qtx.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      destAccountID,
		Balance: amountIn,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	if err = tx.Commit(ctx); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    request,
		})
		return
	}

	respond.Json(w, http.StatusOK, transaction, a.log)
}

func (a *Transactions) UpdateTransaction(w http.ResponseWriter, r *http.Request) {}

func (a *Transactions) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	trscID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     a.log,
			Details:    r.URL.Path,
		})
		return
	}

	if err = a.queries.DeleteTransaction(ctx, trscID); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     a.log,
			Details:    trscID,
		})
		return

	}

	respond.Status(w, http.StatusOK)
}
