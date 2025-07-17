package transactions

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

// RecurringTransactionRepo implements the RecurringTransactionRepository interface
type RecurringTransactionRepo struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

// NewRecurringTransactionRepository creates a new recurring transaction repository
func NewRecurringTransactionRepository(db *pgxpool.Pool, queries *repository.Queries) RecurringTransactionRepository {
	return &RecurringTransactionRepo{
		db:      db,
		queries: queries,
	}
}

// CreateRecurringTransaction creates a new recurring transaction template
func (r *RecurringTransactionRepo) CreateRecurringTransaction(ctx context.Context, req CreateRecurringTransactionRequest, userID uuid.UUID) (*RecurringTransaction, error) {
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

	// Create the recurring transaction
	dbRecurring, err := r.queries.CreateRecurringTransaction(ctx, repository.CreateRecurringTransactionParams{
		UserID:               userID,
		AccountID:            accountID,
		CategoryID:           categoryID,
		DestinationAccountID: destinationAccountID,
		Amount:               req.Amount,
		Type:                 req.Type,
		Description:          req.Description,
		Details:              (*repository.Details)(req.Details),
		Frequency:            req.Frequency,
		FrequencyInterval:    int32(req.FrequencyInterval),
		FrequencyData:        frequencyDataJSON,
		StartDate:            req.StartDate,
		EndDate:              req.EndDate,
		NextDueDate:          req.StartDate, // Initially set to start date
		AutoPost:             req.AutoPost,
		IsPaused:             false,
		MaxOccurrences:       (*int32)(req.MaxOccurrences),
		TemplateName:         req.TemplateName,
		Tags:                 tagsJSON,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

// GetRecurringTransactionByID retrieves a recurring transaction by ID
func (r *RecurringTransactionRepo) GetRecurringTransactionByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*RecurringTransaction, error) {
	dbRecurring, err := r.queries.GetRecurringTransactionById(ctx, repository.GetRecurringTransactionByIdParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

// ListRecurringTransactions retrieves all recurring transactions for a user with filters
func (r *RecurringTransactionRepo) ListRecurringTransactions(ctx context.Context, userID uuid.UUID, filters RecurringTransactionFilters) ([]RecurringTransaction, error) {
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

	dbRecurrings, err := r.queries.ListRecurringTransactionsWithFilters(ctx, repository.ListRecurringTransactionsWithFiltersParams{
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

	var result []RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

// UpdateRecurringTransaction updates a recurring transaction
func (r *RecurringTransactionRepo) UpdateRecurringTransaction(ctx context.Context, id uuid.UUID, req UpdateRecurringTransactionRequest, userID uuid.UUID) (*RecurringTransaction, error) {
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

	// Update the recurring transaction
	dbRecurring, err := r.queries.UpdateRecurringTransaction(ctx, repository.UpdateRecurringTransactionParams{
		ID:                   id,
		UserID:               userID,
		AccountID:            accountID,
		CategoryID:           categoryID,
		DestinationAccountID: destinationAccountID,
		Amount:               req.Amount,
		Type:                 req.Type,
		Description:          req.Description,
		Details:              (*repository.Details)(req.Details),
		Frequency:            req.Frequency,
		FrequencyInterval:    (*int32)(req.FrequencyInterval),
		FrequencyData:        frequencyDataJSON,
		StartDate:            req.StartDate,
		EndDate:              req.EndDate,
		NextDueDate:          nil, // Will be calculated by service
		AutoPost:             req.AutoPost,
		IsPaused:             req.IsPaused,
		MaxOccurrences:       (*int32)(req.MaxOccurrences),
		TemplateName:         req.TemplateName,
		Tags:                 tagsJSON,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

// DeleteRecurringTransaction soft deletes a recurring transaction
func (r *RecurringTransactionRepo) DeleteRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.queries.DeleteRecurringTransaction(ctx, repository.DeleteRecurringTransactionParams{
		ID:     id,
		UserID: userID,
	})
}

// PauseRecurringTransaction pauses or resumes a recurring transaction
func (r *RecurringTransactionRepo) PauseRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID, isPaused bool) (*RecurringTransaction, error) {
	dbRecurring, err := r.queries.PauseRecurringTransaction(ctx, repository.PauseRecurringTransactionParams{
		ID:       id,
		IsPaused: isPaused,
		UserID:   userID,
	})
	if err != nil {
		return nil, err
	}

	return convertDBRecurringToModel(dbRecurring), nil
}

// GetDueRecurringTransactions retrieves all due recurring transactions
func (r *RecurringTransactionRepo) GetDueRecurringTransactions(ctx context.Context, dueDate time.Time) ([]RecurringTransaction, error) {
	dbRecurrings, err := r.queries.GetDueRecurringTransactions(ctx, dueDate)
	if err != nil {
		return nil, err
	}

	var result []RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

// GetRecurringTransactionStats retrieves statistics for recurring transactions
func (r *RecurringTransactionRepo) GetRecurringTransactionStats(ctx context.Context, userID uuid.UUID) (*RecurringTransactionStats, error) {
	stats, err := r.queries.GetRecurringTransactionStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &RecurringTransactionStats{
		TotalCount:  int(stats.TotalCount),
		ActiveCount: int(stats.ActiveCount),
		PausedCount: int(stats.PausedCount),
		DueCount:    int(stats.DueCount),
	}, nil
}

// GetUpcomingRecurringTransactions retrieves upcoming recurring transactions within a date range
func (r *RecurringTransactionRepo) GetUpcomingRecurringTransactions(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]RecurringTransaction, error) {
	dbRecurrings, err := r.queries.GetUpcomingRecurringTransactions(ctx, repository.GetUpcomingRecurringTransactionsParams{
		UserID:    userID,
		StartDate: startDate,
		EndDate:   endDate,
	})
	if err != nil {
		return nil, err
	}

	var result []RecurringTransaction
	for _, dbRecurring := range dbRecurrings {
		result = append(result, *convertDBRecurringToModel(dbRecurring))
	}

	return result, nil
}

// GetRecurringTransactionInstances retrieves all instances of a recurring transaction
func (r *RecurringTransactionRepo) GetRecurringTransactionInstances(ctx context.Context, userID uuid.UUID, recurringID uuid.UUID) ([]repository.Transaction, error) {
	return r.queries.GetRecurringTransactionInstances(ctx, repository.GetRecurringTransactionInstancesParams{
		UserID:       userID,
		RecurringID:  recurringID,
	})
}

// convertDBRecurringToModel converts a database recurring transaction to the domain model
func convertDBRecurringToModel(dbRecurring repository.RecurringTransaction) *RecurringTransaction {
	rt := &RecurringTransaction{
		ID:                   dbRecurring.ID,
		UserID:               dbRecurring.UserID,
		AccountID:            dbRecurring.AccountID,
		CategoryID:           dbRecurring.CategoryID,
		DestinationAccountID: dbRecurring.DestinationAccountID,
		Amount:               dbRecurring.Amount,
		Type:                 dbRecurring.Type,
		Description:          dbRecurring.Description,
		Details:              (*Details)(dbRecurring.Details),
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
		var frequencyData FrequencyData
		if err := json.Unmarshal(dbRecurring.FrequencyData, &frequencyData); err == nil {
			rt.FrequencyData = &frequencyData
		}
	}

	// Parse tags
	if dbRecurring.Tags != nil {
		var tags Tags
		if err := json.Unmarshal(dbRecurring.Tags, &tags); err == nil {
			rt.Tags = &tags
		}
	}

	return rt
}