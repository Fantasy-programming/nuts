package accounts

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

// Repository defines the interface for account data operations
type Repository interface {
	// GetAccounts retrieves all accounts for a specific user
	GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	// GetAccountByID retrieves a specific account by its ID
	GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error)
	// CreateAccount creates a new account
	CreateAccount(ctx context.Context, account repository.CreateAccountParams) (repository.Account, error)
	CreateAccountWInitalTrs(ctx context.Context, act repository.CreateAccountParams) (repository.Account, error)

	// UpdateAccount updates an existing account
	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	// DeleteAccount marks an account as deleted
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	// UpdateAccountBalance updates just the balance of an account
	UpdateAccountBalance(ctx context.Context, id uuid.UUID, amount decimal.NullDecimal) error

	// GetAccountsBTimeline
	GetAccountsBTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error)
	GetAccountBTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error)
	GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]AccountWithTrend, error)

	// Connection management
	CreateConnection(ctx context.Context, params repository.CreateConnectionParams) (repository.UserFinancialConnection, error)
	GetConnectionByID(ctx context.Context, id uuid.UUID) (repository.UserFinancialConnection, error)
	GetConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]repository.UserFinancialConnection, error)
	GetConnectionByProviderItemID(ctx context.Context, params repository.GetConnectionByProviderItemIDParams) (repository.UserFinancialConnection, error)
	UpdateConnection(ctx context.Context, params repository.UpdateConnectionParams) (repository.UserFinancialConnection, error)
	DeleteConnection(ctx context.Context, params repository.DeleteConnectionParams) error
	SetConnectionSyncStatus(ctx context.Context, params repository.SetConnectionSyncStatusParams) (repository.UserFinancialConnection, error)
	SetConnectionErrorStatus(ctx context.Context, params repository.SetConnectionErrorStatusParams) (repository.UserFinancialConnection, error)
	ListConnections(ctx context.Context, params repository.ListConnectionsParams) ([]repository.UserFinancialConnection, error)

	// Linked Accounts Methods

	// Connection management
	// CreateConnection(ctx context.Context, connection UserFinancialConnection) (*UserFinancialConnection, error)
	// GetUserConnections(ctx context.Context, userID uuid.UUID) ([]UserFinancialConnection, error)
	// GetConnectionByProvider(ctx context.Context, userID uuid.UUID, provider string) (*UserFinancialConnection, error)
	// UpdateConnection(ctx context.Context, connectionID uuid.UUID, updates map[string]interface{}) error
	// DeleteConnection(ctx context.Context, connectionID uuid.UUID) error

	// Sync job management
	// CreateSyncJob(ctx context.Context, job FinancialSyncJob) (*FinancialSyncJob, error)
	// UpdateSyncJob(ctx context.Context, jobID uuid.UUID, updates map[string]interface{}) error
	// GetUserSyncJobs(ctx context.Context, userID uuid.UUID, limit int) ([]FinancialSyncJob, error)
}

type repo struct {
	queries *repository.Queries
	db      *pgxpool.Pool
}

// NewRepository creates a new account repository
func NewRepository(queries *repository.Queries, db *pgxpool.Pool) Repository {
	return &repo{
		queries: queries,
		db:      db,
	}
}

// GetAccounts retrieves all accounts for a specific user
func (r *repo) GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error) {
	return r.queries.GetAccounts(ctx, &userID)
}

// GetAccountByID retrieves a specific account by its ID
func (r *repo) GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error) {
	return r.queries.GetAccountById(ctx, id)
}

// CreateAccount creates a new account
func (r *repo) CreateAccount(ctx context.Context, account repository.CreateAccountParams) (repository.Account, error) {
	return r.queries.CreateAccount(ctx, account)
}

func (r *repo) CreateAccountWInitalTrs(ctx context.Context, act repository.CreateAccountParams) (repository.Account, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return repository.Account{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to do things")
			}
		}
	}()

	qtx := r.queries.WithTx(tx)

	// Create the account
	account, err := qtx.CreateAccount(ctx, act)
	if err != nil {
		return repository.Account{}, err
	}

	// Category is set to income
	category, err := qtx.GetCategoryByName(ctx, "Income")
	if err != nil {
		return repository.Account{}, err
	}

	description := "Initial Balance"

	// Create the initial transaction
	_, err = qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              types.NullDecimalToDecimal(act.Balance),
		Type:                "income",
		AccountID:           account.ID,
		Description:         &description,
		CategoryID:          category.ID,
		TransactionCurrency: account.Currency,
		OriginalAmount:      types.NullDecimalToDecimal(act.Balance),
		TransactionDatetime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Details: dto.Details{
			PaymentMedium: "",
			Location:      "",
			Note:          "",
			PaymentStatus: "",
		},
		CreatedBy: account.CreatedBy,
	})
	if err != nil {
		return repository.Account{}, err
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return repository.Account{}, err
	}

	return account, nil
}

// UpdateAccount updates an existing account
func (r *repo) UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error) {
	return r.queries.UpdateAccount(ctx, account)
}

// DeleteAccount marks an account as deleted
func (r *repo) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAccount(ctx, id)
}

// UpdateAccountBalance updates just the balance of an account
func (r *repo) UpdateAccountBalance(ctx context.Context, id uuid.UUID, amount decimal.NullDecimal) error {
	params := repository.UpdateAccountBalanceParams{
		ID:      id,
		Balance: amount,
	}
	return r.queries.UpdateAccountBalance(ctx, params)
}

func (r *repo) GetAccountsBTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error) {
	return r.queries.GetAccountsBalanceTimeline(ctx, userID)
}

func (r *repo) GetAccountBTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error) {
	return r.queries.GetAccountBalanceTimeline(ctx, repository.GetAccountBalanceTimelineParams{
		AccountID: accountID,
		UserID:    userID,
	})
}

func (r *repo) GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]AccountWithTrend, error) {
	rows, err := r.db.Query(ctx, getAccountsWithTrendSQL, startTime, endTime, userID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	results := []AccountWithTrend{}

	for rows.Next() {
		var rawTimeseries json.RawMessage
		var rawMeta []byte // raw value from DB
		var a AccountWithTrend

		err := rows.Scan(
			&a.ID, &a.Name, &a.Type, &a.Balance, &a.Currency,
			&a.Color, &rawMeta, &a.UpdatedAt, &a.IsExternal, &a.Trend, &rawTimeseries,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(rawTimeseries, &a.BalanceTimeseries); err != nil {
			return nil, err
		}

		if len(rawMeta) > 0 {
			if err := json.Unmarshal(rawMeta, &a.Meta); err != nil {
				return nil, err
			}
		}

		results = append(results, a)
	}
	return results, nil
}

// Connection Stuff

func (r *repo) CreateConnection(ctx context.Context, params repository.CreateConnectionParams) (repository.UserFinancialConnection, error) {
	return r.queries.CreateConnection(ctx, params)
}

func (r *repo) GetConnectionByID(ctx context.Context, id uuid.UUID) (repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionByID(ctx, id)
}

func (r *repo) GetConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionsByUserID(ctx, userID)
}

func (r *repo) GetConnectionByProviderItemID(ctx context.Context, params repository.GetConnectionByProviderItemIDParams) (repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionByProviderItemID(ctx, params)
}

func (r *repo) UpdateConnection(ctx context.Context, params repository.UpdateConnectionParams) (repository.UserFinancialConnection, error) {
	return r.queries.UpdateConnection(ctx, params)
}

func (r *repo) DeleteConnection(ctx context.Context, params repository.DeleteConnectionParams) error {
	return r.queries.DeleteConnection(ctx, params)
}

func (r *repo) SetConnectionSyncStatus(ctx context.Context, params repository.SetConnectionSyncStatusParams) (repository.UserFinancialConnection, error) {
	return r.queries.SetConnectionSyncStatus(ctx, params)
}

func (r *repo) SetConnectionErrorStatus(ctx context.Context, params repository.SetConnectionErrorStatusParams) (repository.UserFinancialConnection, error) {
	return r.queries.SetConnectionErrorStatus(ctx, params)
}

func (r *repo) ListConnections(ctx context.Context, params repository.ListConnectionsParams) ([]repository.UserFinancialConnection, error) {
	return r.queries.ListConnections(ctx, params)
}
