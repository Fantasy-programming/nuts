package transactions

import (
	"context"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// RecurringTransactionRepository defines the interface for recurring transaction operations
type RecurringTransactionRepository interface {
	CreateRecurringTransaction(ctx context.Context, req CreateRecurringTransactionRequest, userID uuid.UUID) (*RecurringTransaction, error)
	GetRecurringTransactionByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*RecurringTransaction, error)
	ListRecurringTransactions(ctx context.Context, userID uuid.UUID, filters RecurringTransactionFilters) ([]RecurringTransaction, error)
	UpdateRecurringTransaction(ctx context.Context, id uuid.UUID, req UpdateRecurringTransactionRequest, userID uuid.UUID) (*RecurringTransaction, error)
	DeleteRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	PauseRecurringTransaction(ctx context.Context, id uuid.UUID, userID uuid.UUID, isPaused bool) (*RecurringTransaction, error)
	GetDueRecurringTransactions(ctx context.Context, dueDate time.Time) ([]RecurringTransaction, error)
	GetRecurringTransactionStats(ctx context.Context, userID uuid.UUID) (*RecurringTransactionStats, error)
	GetUpcomingRecurringTransactions(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]RecurringTransaction, error)
	GetRecurringTransactionInstances(ctx context.Context, userID uuid.UUID, recurringID uuid.UUID) ([]repository.Transaction, error)
}

// RecurringTransactionService provides business logic for recurring transactions
type RecurringTransactionService struct {
	repo           RecurringTransactionRepository
	queries        *repository.Queries
	transactionSvc Repository
}

// NewRecurringTransactionService creates a new recurring transaction service
func NewRecurringTransactionService(repo RecurringTransactionRepository, queries *repository.Queries, transactionSvc Repository) *RecurringTransactionService {
	return &RecurringTransactionService{
		repo:           repo,
		queries:        queries,
		transactionSvc: transactionSvc,
	}
}

// CreateRecurringTransaction creates a new recurring transaction template
func (s *RecurringTransactionService) CreateRecurringTransaction(ctx context.Context, userID uuid.UUID, req CreateRecurringTransactionRequest) (*RecurringTransaction, error) {
	// Validate the request
	if err := s.ValidateRecurringTransaction(req); err != nil {
		return nil, err
	}

	// Create the recurring transaction
	return s.repo.CreateRecurringTransaction(ctx, req, userID)
}

// GenerateNextDueDate calculates the next due date based on frequency and pattern
func (s *RecurringTransactionService) GenerateNextDueDate(rt *RecurringTransaction) time.Time {
	baseDate := rt.NextDueDate
	if rt.LastGeneratedDate != nil {
		baseDate = *rt.LastGeneratedDate
	}

	switch rt.Frequency {
	case "daily":
		return baseDate.AddDate(0, 0, rt.FrequencyInterval)
	case "weekly":
		return baseDate.AddDate(0, 0, rt.FrequencyInterval*7)
	case "biweekly":
		return baseDate.AddDate(0, 0, rt.FrequencyInterval*14)
	case "monthly":
		return baseDate.AddDate(0, rt.FrequencyInterval, 0)
	case "yearly":
		return baseDate.AddDate(rt.FrequencyInterval, 0, 0)
	case "custom":
		return s.generateCustomFrequencyDate(rt, baseDate)
	default:
		return baseDate.AddDate(0, 0, rt.FrequencyInterval)
	}
}

// generateCustomFrequencyDate handles complex recurring patterns
func (s *RecurringTransactionService) generateCustomFrequencyDate(rt *RecurringTransaction, baseDate time.Time) time.Time {
	if rt.FrequencyData == nil {
		return baseDate.AddDate(0, 0, rt.FrequencyInterval)
	}

	// Handle "first Monday of month" type patterns
	if rt.FrequencyData.DayOfWeek != nil && rt.FrequencyData.WeekOfMonth != nil {
		return s.findNthWeekdayOfMonth(baseDate, *rt.FrequencyData.DayOfWeek, *rt.FrequencyData.WeekOfMonth)
	}

	// Handle "last weekday of month" patterns
	if rt.FrequencyData.DayOfWeek != nil && rt.FrequencyData.WeekOfMonth != nil && *rt.FrequencyData.WeekOfMonth == -1 {
		return s.findLastWeekdayOfMonth(baseDate, *rt.FrequencyData.DayOfWeek)
	}

	// Handle specific dates (e.g., 1st and 15th of month)
	if len(rt.FrequencyData.SpecificDates) > 0 {
		return s.findNextSpecificDate(baseDate, rt.FrequencyData.SpecificDates)
	}

	// Default fallback
	return baseDate.AddDate(0, 0, rt.FrequencyInterval)
}

// findNthWeekdayOfMonth finds the nth occurrence of a weekday in a month
func (s *RecurringTransactionService) findNthWeekdayOfMonth(baseDate time.Time, dayOfWeek, weekOfMonth int) time.Time {
	// Move to next month
	nextMonth := baseDate.AddDate(0, 1, 0)
	firstDay := time.Date(nextMonth.Year(), nextMonth.Month(), 1, baseDate.Hour(), baseDate.Minute(), baseDate.Second(), baseDate.Nanosecond(), baseDate.Location())

	// Find the first occurrence of the target weekday
	daysUntilTarget := (dayOfWeek - int(firstDay.Weekday()) + 7) % 7
	firstOccurrence := firstDay.AddDate(0, 0, daysUntilTarget)

	// Calculate the nth occurrence
	return firstOccurrence.AddDate(0, 0, (weekOfMonth-1)*7)
}

// findLastWeekdayOfMonth finds the last occurrence of a weekday in a month
func (s *RecurringTransactionService) findLastWeekdayOfMonth(baseDate time.Time, dayOfWeek int) time.Time {
	// Move to next month
	nextMonth := baseDate.AddDate(0, 1, 0)
	lastDay := time.Date(nextMonth.Year(), nextMonth.Month()+1, 0, baseDate.Hour(), baseDate.Minute(), baseDate.Second(), baseDate.Nanosecond(), baseDate.Location())

	// Find the last occurrence of the target weekday
	daysBack := (int(lastDay.Weekday()) - dayOfWeek + 7) % 7
	return lastDay.AddDate(0, 0, -daysBack)
}

// findNextSpecificDate finds the next specific date in the month
func (s *RecurringTransactionService) findNextSpecificDate(baseDate time.Time, specificDates []int) time.Time {
	nextMonth := baseDate.AddDate(0, 1, 0)
	currentDay := baseDate.Day()

	// Find the next date in the current month or next month
	for _, date := range specificDates {
		if date > currentDay {
			return time.Date(baseDate.Year(), baseDate.Month(), date, baseDate.Hour(), baseDate.Minute(), baseDate.Second(), baseDate.Nanosecond(), baseDate.Location())
		}
	}

	// If no date found in current month, use the first date of next month
	if len(specificDates) > 0 {
		return time.Date(nextMonth.Year(), nextMonth.Month(), specificDates[0], baseDate.Hour(), baseDate.Minute(), baseDate.Second(), baseDate.Nanosecond(), baseDate.Location())
	}

	return baseDate.AddDate(0, 1, 0)
}

// GenerateRecurringInstance creates a transaction instance from a recurring template
func (s *RecurringTransactionService) GenerateRecurringInstance(ctx context.Context, rt *RecurringTransaction) (*repository.Transaction, error) {
	isExternal := false

	transactionParams := repository.CreateTransactionParams{
		Amount:                rt.Amount,
		Type:                  rt.Type,
		AccountID:             rt.AccountID,
		CategoryID:            rt.CategoryID,
		DestinationAccountID:  rt.DestinationAccountID,
		Description:           rt.Description,
		TransactionDatetime:   pgtype.Timestamptz{Valid: true, Time: rt.NextDueDate},
		TransactionCurrency:   "", // Will be populated from account
		OriginalAmount:        rt.Amount,
		Details:               nil, // TODO: Convert domain Details to dto.Details
		ProviderTransactionID: nil,
		IsExternal:            &isExternal,
		CreatedBy:             &rt.UserID,
	}

	transaction, err := s.transactionSvc.CreateTransaction(ctx, transactionParams)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// ProcessDueRecurringTransactions processes all due recurring transactions
func (s *RecurringTransactionService) ProcessDueRecurringTransactions(ctx context.Context) error {
	now := time.Now()
	dueTransactions, err := s.repo.GetDueRecurringTransactions(ctx, now)
	if err != nil {
		return err
	}

	for _, rt := range dueTransactions {
		if rt.AutoPost {
			// Auto-post the transaction
			_, err := s.GenerateRecurringInstance(ctx, &rt)
			if err != nil {
				// Log error but continue processing other transactions
				continue
			}
		}
		// For manual confirmation, we'll send notifications (not implemented in this scope)
	}

	return nil
}

// GetRecurringInstances generates projected instances for a date range
func (s *RecurringTransactionService) GetRecurringInstances(ctx context.Context, userID uuid.UUID, req GetRecurringInstancesRequest) (*RecurringInstancesResponse, error) {
	recurringTransactions, err := s.repo.ListRecurringTransactions(ctx, userID, RecurringTransactionFilters{})
	if err != nil {
		return nil, err
	}

	var instances []RecurringInstance
	totalAmount := decimal.Zero
	pendingCount := 0
	postedCount := 0

	for _, rt := range recurringTransactions {
		if rt.IsPaused {
			continue
		}

		// Generate instances for this recurring transaction within the date range
		currentDate := rt.NextDueDate
		for currentDate.Before(req.EndDate) || currentDate.Equal(req.EndDate) {
			if currentDate.After(req.StartDate) || currentDate.Equal(req.StartDate) {
				instance := RecurringInstance{
					DueDate:     currentDate,
					Amount:      rt.Amount,
					Description: rt.Description,
					Status:      "pending",
					IsProjected: true,
					CanModify:   true,
				}
				instances = append(instances, instance)
				totalAmount = totalAmount.Add(rt.Amount)
				pendingCount++
			}

			// Calculate next date
			rt.NextDueDate = currentDate
			currentDate = s.GenerateNextDueDate(&rt)
		}
	}

	return &RecurringInstancesResponse{
		Instances: instances,
		Summary: struct {
			TotalCount   int             `json:"total_count"`
			PendingCount int             `json:"pending_count"`
			PostedCount  int             `json:"posted_count"`
			SkippedCount int             `json:"skipped_count"`
			TotalAmount  decimal.Decimal `json:"total_amount"`
		}{
			TotalCount:   len(instances),
			PendingCount: pendingCount,
			PostedCount:  postedCount,
			SkippedCount: 0,
			TotalAmount:  totalAmount,
		},
	}, nil
}

// ValidateRecurringTransaction validates a recurring transaction request
func (s *RecurringTransactionService) ValidateRecurringTransaction(req CreateRecurringTransactionRequest) error {
	if req.Amount.IsZero() || req.Amount.IsNegative() {
		return fmt.Errorf("amount must be positive")
	}

	if req.FrequencyInterval < 1 {
		return fmt.Errorf("frequency interval must be at least 1")
	}

	if req.EndDate != nil && req.EndDate.Before(req.StartDate) {
		return fmt.Errorf("end date must be after start date")
	}

	if req.MaxOccurrences != nil && *req.MaxOccurrences < 1 {
		return fmt.Errorf("max occurrences must be at least 1")
	}

	return nil
}

