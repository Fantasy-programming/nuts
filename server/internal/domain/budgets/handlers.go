package budgets

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Handler struct {
	v      *validation.Validator
	tkn    *jwt.Service
	repo   Repository
	logger *zerolog.Logger
}

func NewHandler(validator *validation.Validator, tokenService *jwt.Service, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, tokenService, repo, logger}
}

func (h *Handler) CreateBudget(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()
	// activeContext := middleware.GetActiveSharedFinanceContext(r.Context())

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.RequestURI,
		})
		return
	}

	var req Budget

	valErr, err := h.v.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	res, err := h.repo.CreateBudget(ctx, repository.CreateBudgetParams{
		CategoryID: req.CategoryID,
		Amount:     decimal.NewFromFloat(req.Amount),
		Name:       &req.Name,
		StartDate:  pgtype.Date{Valid: true, Time: req.StartDate},
		EndDate:    pgtype.Date{Valid: true, Time: req.EndDate},
		Frequency:  req.Frequency,
		UserID:     userID,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, res, h.logger)

	// budget.UserID = userID
	// if activeContext.Type == "shared" && activeContext.SharedFinanceID != nil {
	// 	budget.SharedFinanceID = activeContext.SharedFinanceID
	// } else {
	// 	budget.SharedFinanceID = nil
	// }
}

func (h *Handler) UpdateBudget(w http.ResponseWriter, r *http.Request) {
	// userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
	// if err != nil {
	// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	// 	return
	// }
	// activeContext := middleware.GetActiveSharedFinanceContext(r.Context())

	//		vars := mux.Vars(r)
	//		budgetID, err := uuid.Parse(vars["id"])
	//		if err != nil {
	//			http.Error(w, "Invalid budget ID", http.StatusBadRequest)
	//			return
	//		}
	//
	//		var updatedBudget models.Budget
	//		if err := json.NewDecoder(r.Body).Decode(&updatedBudget); err != nil {
	//			http.Error(w, "Invalid request body", http.StatusBadRequest)
	//			return
	//		}
	//
	//		// Verify access to budget (similar to other update/delete handlers)
	//		verifyQuery := `SELECT id FROM budgets`
	//		verifyWhere, verifyArgs, verifyNextArg := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "budgets", 1)
	//		verifyQuery = fmt.Sprintf("%s WHERE id = $%d AND %s", verifyQuery, verifyNextArg, verifyWhere)
	//		verifyArgs = append([]interface{}{budgetID}, verifyArgs...)
	//
	//		var existingBudgetID uuid.UUID
	//		err = db.GetDB().QueryRow(verifyQuery, verifyArgs...).Scan(&existingBudgetID)
	//		if err != nil {
	//			if err == sql.ErrNoRows {
	//				http.Error(w, "Budget not found or unauthorized", http.StatusNotFound)
	//				return
	//			}
	//			config.Log.WithError(err).Error("Failed to verify budget access for update")
	//			http.Error(w, "Internal server error during budget update verification", http.StatusInternalServerError)
	//			return
	//		}
	//
	//		query := `UPDATE budgets SET category_id = $1, amount = $2, name = $3, start_date = $4, end_date = $5, frequency = $6, rollover_enabled = $7, updated_at = $8 WHERE id = $9`
	//		res, err := db.GetDB().Exec(query,
	//			updatedBudget.CategoryID, updatedBudget.Amount, updatedBudget.Name, updatedBudget.StartDate, updatedBudget.EndDate, updatedBudget.Frequency, updatedBudget.RolloverEnabled, time.Now(), budgetID,
	//		)
	//		if err != nil {
	//			config.Log.WithError(err).Error("Failed to update budget")
	//			http.Error(w, "Could not update budget", http.StatusInternalServerError)
	//			return
	//		}
	//		rowsAffected, _ := res.RowsAffected()
	//		if rowsAffected == 0 {
	//			http.Error(w, "Budget not found or unauthorized after verification", http.StatusInternalServerError)
	//			return
	//		}
	//
	//		json.NewEncoder(w).Encode(map[string]string{"message": "Budget updated successfully"})
	//	}
	//
	// // GetBudgetProgress fetches budget progress and potentially generates alerts, now with rollover details.
	//
	//	func (h *Handler) GetBudgetProgress(w http.ResponseWriter, r *http.Request) {
	//		userID, sharedFinanceIDs, err := middleware.GetUserAccessScope(r.Context())
	//		if err != nil {
	//			http.Error(w, "Unauthorized", http.StatusUnauthorized)
	//			return
	//		}
	//		activeContext := middleware.GetActiveSharedFinanceContext(r.Context())
	//
	//		startOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.UTC)
	//		endOfMonth := startOfMonth.AddDate(0, 1, -1)
	//
	//		// Fetch spending for the current budget period
	//		spentQuery := `
	//			SELECT t.category_id, SUM(t.amount) AS spent
	//			FROM transactions t
	//			LEFT JOIN categories c ON t.category_id = c.id
	//		`
	//		spentWhere, spentArgs, nextSpentArg := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "t", 1)
	//		spentQuery = fmt.Sprintf("%s WHERE t.date BETWEEN $%d AND $%d AND (t.type = 'expense' OR c.type = 'expense') AND %s GROUP BY t.category_id", spentQuery, nextSpentArg, nextSpentArg+1, spentWhere)
	//		spentArgs = append(spentArgs, startOfMonth, endOfMonth)
	//
	//		spentRows, err := db.GetDB().Query(spentQuery, spentArgs...)
	//		if err != nil {
	//			config.Log.WithError(err).Error("Failed to query spent amounts for budget progress")
	//			http.Error(w, "Could not retrieve spending data", http.StatusInternalServerError)
	//			return
	//		}
	//		defer spentRows.Close()
	//
	//		spentByCategory := make(map[uuid.UUID]float64)
	//		for spentRows.Next() {
	//			var categoryID uuid.UUID
	//			var spent float64
	//			if err := spentRows.Scan(&categoryID, &spent); err != nil {
	//				config.Log.WithError(err).Warn("Error scanning spent amount for budget progress")
	//				continue
	//			}
	//			spentByCategory[categoryID] = spent
	//		}
	//
	//		// Fetch budgets for the current period
	//		budgetsQuery := `SELECT id, category_id, amount, name, rollover_enabled, last_rollover_amount FROM budgets` // NEW fields
	//		budgetWhere, budgetArgs, nextBudgetArg := db.GetAccessWhereClause(userID, sharedFinanceIDs, activeContext, "budgets", 1)
	//		budgetsQuery = fmt.Sprintf("%s WHERE start_date <= $%d AND end_date >= $%d AND %s", budgetsQuery, nextBudgetArg, nextBudgetArg+1, budgetWhere)
	//		budgetArgs = append(budgetArgs, time.Now(), time.Now())
	//
	//		budgetRows, err := db.GetDB().Query(budgetsQuery, budgetArgs...)
	//		if err != nil {
	//			config.Log.WithError(err).Error("Failed to query budgets for progress")
	//			http.Error(w, "Could not retrieve budget data", http.StatusInternalServerError)
	//			return
	//		}
	//		defer budgetRows.Close()
	//
	//		var progress []models.BudgetProgressItem
	//		for budgetRows.Next() {
	//			var b models.BudgetProgressItem
	//			var categoryID uuid.UUID
	//			var budgetAmount float64
	//			var budgetName string
	//			var rolloverEnabled bool       // NEW
	//			var lastRolloverAmount float64 // NEW
	//
	//			err := budgetRows.Scan(&b.BudgetID, &categoryID, &budgetAmount, &budgetName, &rolloverEnabled, &lastRolloverAmount)
	//			if err != nil {
	//				config.Log.WithError(err).Warn("Error scanning budget for progress")
	//				continue
	//			}
	//
	//			b.BudgetName = budgetName
	//			b.BudgetedAmount = budgetAmount
	//			b.SpentAmount = spentByCategory[categoryID] // Default to 0 if no spending
	//
	//			// Adjust budgeted amount for rollover from previous period
	//			if rolloverEnabled {
	//				b.BudgetedAmount += lastRolloverAmount   // Add unspent from last month
	//				b.RolloverCarryover = lastRolloverAmount // Store for display
	//			} else {
	//				b.RolloverCarryover = 0
	//			}
	//
	//			b.RemainingAmount = b.BudgetedAmount - b.SpentAmount
	//			b.RolloverEnabled = rolloverEnabled // Pass to frontend
	//
	//			if b.BudgetedAmount > 0 {
	//				b.PercentageUsed = (b.SpentAmount / b.BudgetedAmount) * 100
	//			} else {
	//				b.PercentageUsed = 0
	//			}
	//			progress = append(progress, b)
	//
	//			// Generate Budget Alerts (similar logic as before)
	//			if b.PercentageUsed >= 95 && b.PercentageUsed < 100 {
	//				title := fmt.Sprintf("Budget Alert: '%s' Nearing Limit!", b.BudgetName)
	//				message := fmt.Sprintf("You've used %.2f%% of your '%s' budget. Remaining: $%.2f. Be careful not to overspend!", b.PercentageUsed, b.BudgetName, b.RemainingAmount)
	//				CreateNotification(userID, title, message, "budget_alert", &b.BudgetID)
	//			} else if b.PercentageUsed >= 100 {
	//				title := fmt.Sprintf("Budget Alert: '%s' Exceeded!", b.BudgetName)
	//				message := fmt.Sprintf("You've exceeded your '%s' budget by $%.2f. Review your spending!", b.BudgetName, -b.RemainingAmount)
	//				CreateNotification(userID, title, message, "budget_alert", &b.BudgetID)
	//			}
	//		}
	//
	//		if err = budgetRows.Err(); err != nil {
	//			config.Log.WithError(err).Error("Error iterating budget rows for progress")
	//			http.Error(w, "Internal server error", http.StatusInternalServerError)
	//			return
	//		}
	//
	//		json.NewEncoder(w).Encode(progress)
}

// ProcessBudgetRollovers (Internal/Scheduled Function)
// This function performs the rollover logic at the start of a new budget period.
// func ProcessBudgetRollovers() {
// 	config.Log.Info("Starting periodic budget rollover process.")
//
// 	// Define current budget period (e.g., current month)
// 	today := time.Now()
// 	currentMonthStart := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, time.UTC)
// 	lastMonthEnd := currentMonthStart.AddDate(0, 0, -1) // Last day of previous month
// 	lastMonthStart := time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), 1, 0, 0, 0, 0, time.UTC)
//
// 	// Find all budgets that ended last month and are rollover enabled
// 	query := `
//         SELECT b.id, b.user_id, b.shared_finance_id, b.category_id, b.amount, b.name, b.frequency, b.end_date
//         FROM budgets b
//         WHERE b.rollover_enabled = TRUE AND b.end_date = $1
//     `
// 	rows, err := db.GetDB().Query(query, lastMonthEnd)
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to fetch rollover-enabled budgets for processing")
// 		return
// 	}
// 	defer rows.Close()
//
// 	type BudgetToRollover struct {
// 		models.Budget
// 		SpentAmount float64
// 	}
// 	var budgetsToProcess []BudgetToRollover
//
// 	// Iterate through budgets and calculate their unspent amount
// 	for rows.Next() {
// 		var b models.Budget
// 		var sharedFinanceID sql.NullString
// 		var endDate sql.NullTime // For scanning b.end_date
// 		err := rows.Scan(
// 			&b.ID, &b.UserID, &sharedFinanceID, &b.CategoryID, &b.Amount, &b.Name, &b.Frequency, &endDate,
// 		)
// 		if err != nil {
// 			config.Log.WithError(err).Warn("Error scanning budget for rollover process")
// 			continue
// 		}
// 		b.SharedFinanceID = utils.NullStringToUUIDPtr(sharedFinanceID)
// 		b.EndDate = utils.NullTimeToTimePtr(endDate) // Restore end_date
//
// 		// Get spending for this budget's previous period
// 		spendingQuery := `
//             SELECT COALESCE(SUM(t.amount), 0) AS spent
//             FROM transactions t
//             LEFT JOIN categories c ON t.category_id = c.id
//             WHERE t.user_id = $1 AND t.category_id = $2 AND t.date BETWEEN $3 AND $4 AND (t.type = 'expense' OR c.type = 'expense')
//         `
// 		args := []interface{}{b.UserID, b.CategoryID, lastMonthStart, lastMonthEnd}
// 		if b.SharedFinanceID != nil {
// 			spendingQuery += ` AND t.shared_finance_id = $5`
// 			args = append(args, b.SharedFinanceID)
// 		} else {
// 			spendingQuery += ` AND t.shared_finance_id IS NULL`
// 		}
//
// 		var spent float64
// 		err = db.GetDB().QueryRow(spendingQuery, args...).Scan(&spent)
// 		if err != nil {
// 			config.Log.WithError(err).WithField("budgetID", b.ID).Error("Failed to get spending for rollover calculation")
// 			continue
// 		}
//
// 		unspent := b.Amount - spent
// 		if unspent > 0 { // Only rollover positive amounts
// 			budgetsToProcess = append(budgetsToRollover, BudgetToRollover{Budget: b, SpentAmount: spent})
// 		}
// 	}
//
// 	// Now, apply rollovers to the *next* budget period
// 	// This requires creating a new budget for the next period, or updating an existing one.
// 	// Assuming budgets are created monthly/periodically by user or automated.
// 	// If a budget already exists for the next period, update its `last_rollover_amount`.
// 	// If not, it means the system would need to create a new budget for the category.
// 	// For simplicity, we'll only update `last_rollover_amount` on existing budgets.
//
// 	// Begin a transaction for atomic updates
// 	tx, err := db.GetDB().Begin()
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to begin transaction for rollover processing")
// 		return
// 	}
// 	defer tx.Rollback() // Ensure rollback on error
//
// 	rolloverAppliedCount := 0
// 	for _, btr := range budgetsToProcess {
// 		unspentAmount := btr.Amount - btr.SpentAmount // Unspent from previous period
// 		if unspentAmount <= 0 {
// 			continue
// 		} // Ensure positive rollover
//
// 		// Find the next budget for the same category and user/shared_finance_id
// 		// This assumes budgets are created consistently (e.g., month after month)
// 		nextBudgetStartDate := currentMonthStart // Start of current month
//
// 		updateQuery := `
//             UPDATE budgets
//             SET last_rollover_amount = $1, updated_at = $2
//             WHERE user_id = $3 AND category_id = $4 AND start_date = $5 AND rollover_enabled = TRUE
//         `
// 		updateArgs := []interface{}{unspentAmount, time.Now(), btr.UserID, btr.CategoryID, nextBudgetStartDate}
// 		if btr.SharedFinanceID != nil {
// 			updateQuery += ` AND shared_finance_id = $6`
// 			updateArgs = append(updateArgs, btr.SharedFinanceID)
// 		} else {
// 			updateQuery += ` AND shared_finance_id IS NULL`
// 		}
//
// 		res, err := tx.Exec(updateQuery, updateArgs...)
// 		if err != nil {
// 			config.Log.WithError(err).WithField("budgetID", btr.ID).Error("Failed to update next budget with rollover amount")
// 			continue
// 		}
// 		rowsAffected, _ := res.RowsAffected()
// 		if rowsAffected > 0 {
// 			rolloverAppliedCount++
// 			config.Log.WithFields(log.Fields{
// 				"budgetID": btr.ID,
// 				"category": btr.Name,
// 				"unspent":  unspentAmount,
// 			}).Info("Budget rollover applied successfully.")
// 			CreateNotification(btr.UserID, "Budget Rollover Applied!", fmt.Sprintf("You rolled over $%.2f from your '%s' budget to this period.", unspentAmount, btr.Name), "budget_rollover", &btr.ID)
// 		} else {
// 			config.Log.WithFields(log.Fields{
// 				"budgetID":        btr.ID,
// 				"category":        btr.Name,
// 				"nextPeriodStart": nextBudgetStartDate,
// 			}).Warn("No next budget found to apply rollover for. User might need to create one.")
// 		}
// 	}
//
// 	err = tx.Commit()
// 	if err != nil {
// 		config.Log.WithError(err).Error("Failed to commit budget rollover transaction")
// 	} else {
// 		config.Log.Infof("Completed budget rollover process. Applied %d rollovers.", rolloverAppliedCount)
// 	}
// }

func (h *Handler) GetBudget(w http.ResponseWriter, r *http.Request)         {}
func (h *Handler) GetBudgetProgress(w http.ResponseWriter, r *http.Request) {}
func (h *Handler) DeleteBudget(w http.ResponseWriter, r *http.Request)      {}
