package transactions

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/message"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Extract pathParam & parse into uuid
func parseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.URL.Query().Get(paramName)
	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}
	return uuid.Parse(idStr)
}

type EnhancedTransaction struct {
	repository.ListTransactionsRow
	DestinationAccount *repository.GetAccountsRow `json:"destination_account,omitempty"`
}

type Group struct {
	ID           string                `json:"id"`
	Date         string                `json:"date"`  // e.g., "October 19 2029 - 2"
	Total        float64               `json:"total"` // e.g., "$700.00"
	Transactions []EnhancedTransaction `json:"transactions"`
}

// createAccountMap creates a map of account IDs to account objects for efficient lookups
func createAccountMap(accounts []repository.GetAccountsRow) map[uuid.UUID]repository.GetAccountsRow {
	accountMap := make(map[uuid.UUID]repository.GetAccountsRow, len(accounts))
	for _, account := range accounts {
		accountMap[account.ID] = account
	}
	return accountMap
}

// enhanceTransactionsWithDestAccounts replaces destination account IDs with actual account objects
func enhanceTransactionsWithDestAccounts(
	transactions []repository.ListTransactionsRow,
	accountMap map[uuid.UUID]repository.GetAccountsRow,
) []EnhancedTransaction {
	enhanced := make([]EnhancedTransaction, len(transactions))

	for i, t := range transactions {
		enhanced[i] = EnhancedTransaction{
			ListTransactionsRow: t,
		}

		// If there's a destination account ID, look it up in the map
		if t.DestinationAccountID != nil {
			if destAcc, ok := accountMap[*t.DestinationAccountID]; ok {
				enhanced[i].DestinationAccount = &destAcc
			}
		}
	}

	return enhanced
}

func groupEnhancedTransactions(transactions []EnhancedTransaction) (group []Group, err error) {
	// We'll group by a formatted date string.
	groupsMap := make(map[string]*Group)

	for _, t := range transactions {
		// Format the date as desired (adjust the format string as needed)
		dateKey := t.TransactionDatetime.Format("January 2 2006")

		if group, ok := groupsMap[dateKey]; ok {
			group.Transactions = append(group.Transactions, t)
		} else {
			groupsMap[dateKey] = &Group{
				ID:           uuid.New().String(),
				Date:         dateKey,
				Transactions: []EnhancedTransaction{t},
			}
		}
	}

	// Convert the map into a slice and compute totals.
	groups := []Group{}
	for _, group := range groupsMap {
		var sum float64
		for _, t := range group.Transactions {
			val, err := numericToFloat64(t.Amount)
			if err != nil {
				return nil, err
			}
			sum += val
		}

		group.Total = sum
		groups = append(groups, *group)
	}

	// Optionally, sort groups by date (most recent first)
	sort.Slice(groups, func(i, j int) bool {
		// Parse the date from the Date field (ignoring the "- count" part)
		dateI, _ := time.Parse("January 2 2006", strings.Split(groups[i].Date, " - ")[0])
		dateJ, _ := time.Parse("January 2 2006", strings.Split(groups[j].Date, " - ")[0])
		return dateI.After(dateJ)
	})

	return groups, nil
}

// numericToFloat64 converts a pgtype.Numeric to a float64 using Float64Value().
func numericToFloat64(n pgtype.Numeric) (float64, error) {
	f8, err := n.Float64Value()
	if err != nil {
		return 0, fmt.Errorf("error converting pgtype.Numeric to float64: %w", err)
	}
	if !f8.Valid {
		return 0, fmt.Errorf("numeric value is not valid")
	}
	return f8.Float64, nil
}
