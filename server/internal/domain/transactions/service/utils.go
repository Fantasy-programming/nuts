package service

import (
	"sort"
	"strings"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/google/uuid"
)

func groupEnhancedTransactions(transactionsData []transactions.EnhancedTransaction) (group []transactions.Group, err error) {
	// We'll group by a formatted date string.
	groupsMap := make(map[string]*transactions.Group)

	for _, t := range transactionsData {
		// Format the date as desired (adjust the format string as needed)
		dateKey := t.TransactionDatetime.Format("January 2 2006")

		if group, ok := groupsMap[dateKey]; ok {
			group.Transactions = append(group.Transactions, t)
		} else {
			groupsMap[dateKey] = &transactions.Group{
				ID:           uuid.New().String(),
				Date:         dateKey,
				Transactions: []transactions.EnhancedTransaction{t},
			}
		}
	}

	// Convert the map into a slice and compute totals.
	groups := []transactions.Group{}
	for _, group := range groupsMap {
		var sum float64
		for _, t := range group.Transactions {
			val, err := types.NumericToFloat64(t.Amount)
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
