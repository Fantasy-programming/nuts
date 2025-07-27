package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// Helper function to convert *int to *int32
func convertIntToInt32Ptr(i *int) *int32 {
	if i == nil {
		return nil
	}
	val := int32(*i)
	return &val
}

func (r *repo) CreateRecurringTransaction(ctx context.Context, req transactions.CreateRecurringTransactionRequest, userID uuid.UUID) (*transactions.RecurringTransaction, error) {
	// Parse the account ID
	accountID, err := uuid.Parse(req.AccountID)
	if err != nil {
		return nil, err
	}

	// Parse category ID if provided
	var categoryID *uuid.UUID
	if req.CategoryID != nil {
		parsed, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			return nil, err
		}
		categoryID = &parsed
	}

	// Parse destination account ID if provided
	var destinationAccountID *uuid.UUID
	if req.DestinationAccountID != nil {
		parsed, err := uuid.Parse(*req.DestinationAccountID)
		if err != nil {
			return nil, err
		}
		destinationAccountID = &parsed
	}

	// Convert frequency data and tags to JSONB
	var frequencyDataJSON []byte
	if req.FrequencyData != nil {
		frequencyDataJSON, err = json.Marshal(req.FrequencyData)
		if err != nil {
			return nil, err
		}
	}

	var tagsJSON []byte
	if req.Tags != nil {
		tagsJSON, err = json.Marshal(req.Tags)
		if err != nil {
			return nil, err
		}
	}

	endDate := pgtype.Timestamptz{Valid: false}

	if req.EndDate != nil {
		endDate = pgtype.Timestamptz{Valid: true, Time: *req.EndDate}
	}

	// Create the recurring transaction
	dbRecurring, err := r.Queries.CreateRecurringTransaction(ctx, repository.CreateRecurringTransactionParams{
		UserID:               userID,
		AccountID:            accountID,
		CategoryID:           categoryID,
		DestinationAccountID: destinationAccountID,
		Amount:               req.Amount,
		Type:                 req.Type,
		Description:          req.Description,
		Details:              req.Details,
		Frequency:            req.Frequency,
		FrequencyInterval:    int32(req.FrequencyInterval),
		FrequencyData:        frequencyDataJSON,
		StartDate:            pgtype.Timestamptz{Valid: true, Time: req.StartDate},
		EndDate:              endDate,
		NextDueDate:          pgtype.Timestamptz{Valid: true, Time: req.StartDate}, // Initially set to start date
		AutoPost:             req.AutoPost,
		IsPaused:             false,
		MaxOccurrences:       convertIntToInt32Ptr(req.MaxOccurrences),
		TemplateName:         req.TemplateName,
		Tags:                 tagsJSON,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

func (r *repo) GetRecurringTransactionByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*transactions.RecurringTransaction, error) {
	dbRecurring, err := r.Queries.GetRecurringTransactionById(ctx, repository.GetRecurringTransactionByIdParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

func (r *repo) ListRecurringTransactions(ctx context.Context, userID uuid.UUID, filters transactions.RecurringTransactionFilters) ([]transactions.RecurringTransaction, error) {
	// Parse filter UUIDs
	var accountID *uuid.UUID
	if filters.AccountID != nil {
		parsed, err := uuid.Parse(*filters.AccountID)
		if err != nil {
			return nil, err
		}
		accountID = &parsed
	}

	var categoryID *uuid.UUID
	if filters.CategoryID != nil {
		parsed, err := uuid.Parse(*filters.CategoryID)
		if err != nil {
			return nil, err
		}
		categoryID = &parsed
	}

	dbRecurrings, err := r.Queries.ListRecurringTransactionsWithFilters(ctx, repository.ListRecurringTransactionsWithFiltersParams{
		UserID:       userID,
		AccountID:    accountID,
		CategoryID:   categoryID,
		Frequency:    filters.Frequency,
		IsPaused:     filters.IsPaused,
		AutoPost:     filters.AutoPost,
		TemplateName: filters.TemplateName,
		Limit:        100, // Default limit
		Offset:       0,
	})
	if err != nil {
		return nil, err
	}

	var result []transactions.RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

// UpdateRecurringTransaction updates a recurring transaction
func (r *repo) UpdateRecurringTransaction(ctx context.Context, id uuid.UUID, req transactions.UpdateRecurringTransactionRequest, userID uuid.UUID) (*transactions.RecurringTransaction, error) {
	// Parse account ID if provided
	var accountID *uuid.UUID
	if req.AccountID != nil {
		parsed, err := uuid.Parse(*req.AccountID)
		if err != nil {
			return nil, err
		}
		accountID = &parsed
	}

	// Parse category ID if provided
	var categoryID *uuid.UUID
	if req.CategoryID != nil {
		parsed, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			return nil, err
		}
		categoryID = &parsed
	}

	// Parse destination account ID if provided
	var destinationAccountID *uuid.UUID
	if req.DestinationAccountID != nil {
		parsed, err := uuid.Parse(*req.DestinationAccountID)
		if err != nil {
			return nil, err
		}
		destinationAccountID = &parsed
	}

	// Convert frequency data and tags to JSONB
	var frequencyDataJSON []byte
	if req.FrequencyData != nil {
		var err error
		frequencyDataJSON, err = json.Marshal(req.FrequencyData)
		if err != nil {
			return nil, err
		}
	}

	var tagsJSON []byte
	if req.Tags != nil {
		var err error
		tagsJSON, err = json.Marshal(req.Tags)
		if err != nil {
			return nil, err
		}
	}

	startDate := pgtype.Timestamptz{Valid: false}
	endDate := pgtype.Timestamptz{Valid: false}

	if req.StartDate != nil {
		startDate = pgtype.Timestamptz{Valid: true, Time: *req.StartDate}
	}

	if req.EndDate != nil {
		endDate = pgtype.Timestamptz{Valid: true, Time: *req.EndDate}
	}

	amount := decimal.NewNullDecimal(*req.Amount)

	// Update the recurring transaction
	dbRecurring, err := r.Queries.UpdateRecurringTransaction(ctx, repository.UpdateRecurringTransactionParams{
		ID:                   id,
		UserID:               userID,
		AccountID:            accountID,
		CategoryID:           categoryID,
		DestinationAccountID: destinationAccountID,
		Amount:               amount,
		Type:                 req.Type,
		Description:          req.Description,
		Details:              req.Details,
		Frequency:            req.Frequency,
		FrequencyInterval:    convertIntToInt32Ptr(req.FrequencyInterval),
		FrequencyData:        frequencyDataJSON,
		StartDate:            startDate,
		EndDate:              endDate,
		NextDueDate:          pgtype.Timestamptz{Valid: false}, // Will be calculated by service
		AutoPost:             req.AutoPost,
		IsPaused:             req.IsPaused,
		MaxOccurrences:       convertIntToInt32Ptr(req.MaxOccurrences),
		TemplateName:         req.TemplateName,
		Tags:                 tagsJSON,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

func (r *repo) DeleteRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.Queries.DeleteRecurringTransaction(ctx, repository.DeleteRecurringTransactionParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *repo) PauseRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID, isPaused bool) (*transactions.RecurringTransaction, error) {
	dbRecurring, err := r.Queries.PauseRecurringTransaction(ctx, repository.PauseRecurringTransactionParams{
		ID:       id,
		IsPaused: isPaused,
		UserID:   userID,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

func (r *repo) GetDueRecurringTransactions(ctx context.Context, dueDate time.Time) ([]transactions.RecurringTransaction, error) {
	dbRecurrings, err := r.Queries.GetDueRecurringTransactions(ctx, pgtype.Timestamptz{Valid: true, Time: dueDate})
	if err != nil {
		return nil, err
	}

	var result []transactions.RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

func (r *repo) GetRecurringTransactionStats(ctx context.Context, userID uuid.UUID) (*transactions.RecurringTransactionStats, error) {
	stats, err := r.Queries.GetRecurringTransactionStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &transactions.RecurringTransactionStats{
		TotalCount:  int(stats.TotalCount),
		ActiveCount: int(stats.ActiveCount),
		PausedCount: int(stats.PausedCount),
		DueCount:    int(stats.DueCount),
	}, nil
}

func (r *repo) GetUpcomingRecurringTransactions(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]transactions.RecurringTransaction, error) {
	dbRecurrings, err := r.Queries.GetUpcomingRecurringTransactions(ctx, repository.GetUpcomingRecurringTransactionsParams{
		UserID:        userID,
		NextDueDate:   pgtype.Timestamptz{Valid: true, Time: startDate},
		NextDueDate_2: pgtype.Timestamptz{Valid: true, Time: endDate},
	})
	if err != nil {
		return nil, err
	}

	var result []transactions.RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

func (r *repo) GetRecurringTransactionInstances(ctx context.Context, userID uuid.UUID, recurringID uuid.UUID) ([]repository.Transaction, error) {
	rows, err := r.Queries.GetRecurringTransactionInstances(ctx, repository.GetRecurringTransactionInstancesParams{
		UserID: userID,
		ID:     recurringID,
	})
	if err != nil {
		return nil, err
	}

	var transactions []repository.Transaction
	for _, row := range rows {
		transaction := repository.Transaction{
			ID:                     row.ID,
			Amount:                 row.Amount,
			Type:                   row.Type,
			AccountID:              row.AccountID,
			CategoryID:             row.CategoryID,
			DestinationAccountID:   row.DestinationAccountID,
			TransactionDatetime:    row.TransactionDatetime,
			Description:            row.Description,
			Details:                row.Details,
			CreatedBy:              row.CreatedBy,
			UpdatedBy:              row.UpdatedBy,
			CreatedAt:              row.CreatedAt,
			UpdatedAt:              row.UpdatedAt,
			DeletedAt:              row.DeletedAt,
			IsExternal:             row.IsExternal,
			ProviderTransactionID:  row.ProviderTransactionID,
			TransactionCurrency:    row.TransactionCurrency,
			OriginalAmount:         row.OriginalAmount,
			ExchangeRate:           row.ExchangeRate,
			ExchangeRateDate:       row.ExchangeRateDate,
			IsCategorized:          row.IsCategorized,
			SharedFinanceID:        row.SharedFinanceID,
			RecurringTransactionID: row.RecurringTransactionID,
			RecurringInstanceDate:  row.RecurringInstanceDate,
		}
		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

// convertDBRecurringToModel converts a database recurring transaction to the domain model
func convertDBRecurringToModel(dbRecurring repository.RecurringTransaction) *transactions.RecurringTransaction {
	rt := &transactions.RecurringTransaction{
		ID:                   dbRecurring.ID,
		UserID:               dbRecurring.UserID,
		AccountID:            dbRecurring.AccountID,
		CategoryID:           dbRecurring.CategoryID,
		DestinationAccountID: dbRecurring.DestinationAccountID,
		Amount:               types.PgtypeNumericToDecimal(dbRecurring.Amount),
		Type:                 dbRecurring.Type,
		Description:          dbRecurring.Description,
		Details:              nil, // TODO: Convert dto.Details to domain Details
		Frequency:            dbRecurring.Frequency,
		FrequencyInterval:    int(dbRecurring.FrequencyInterval),
		StartDate:            dbRecurring.StartDate,
		EndDate:              dbRecurring.EndDate,
		LastGeneratedDate:    dbRecurring.LastGeneratedDate,
		NextDueDate:          dbRecurring.NextDueDate,
		AutoPost:             dbRecurring.AutoPost,
		IsPaused:             dbRecurring.IsPaused,
		OccurrencesCount:     int(dbRecurring.OccurrencesCount),
		TemplateName:         dbRecurring.TemplateName,
		CreatedAt:            dbRecurring.CreatedAt,
		UpdatedAt:            dbRecurring.UpdatedAt,
		DeletedAt:            dbRecurring.DeletedAt,
	}

	// Convert max occurrences
	if dbRecurring.MaxOccurrences != nil {
		maxOcc := int(*dbRecurring.MaxOccurrences)
		rt.MaxOccurrences = &maxOcc
	}

	// Parse frequency data
	if dbRecurring.FrequencyData != nil {
		var frequencyData transactions.FrequencyData
		if err := json.Unmarshal(dbRecurring.FrequencyData, &frequencyData); err == nil {
			rt.FrequencyData = &frequencyData
		}
	}

	// Parse tags
	if dbRecurring.Tags != nil {
		var tags transactions.Tags
		if err := json.Unmarshal(dbRecurring.Tags, &tags); err == nil {
			rt.Tags = &tags
		}
	}

	return rt
}
