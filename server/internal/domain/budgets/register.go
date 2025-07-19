package budgets

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func RegisterHTTPHandlers(db *pgxpool.Pool, validate *validation.Validator, tkn *jwt.Service, logger *zerolog.Logger) http.Handler {
	queries := repository.New(db)
	repo := NewRepository(queries, db)

	h := NewHandler(validate, tkn, repo, logger)

	// Create the auth verify middleware
	middleware := jwt.NewMiddleware(tkn)

	router := router.NewRouter()
	router.Use(middleware.Verify)

	// Budget CRUD operations
	router.Post("/budgets", h.CreateBudget)
	router.Get("/budgets/{id}", h.GetBudget)
	router.Put("/budgets/{id}", h.UpdateBudget)
	router.Delete("/budgets/{id}", h.DeleteBudget)
	router.Get("/budgets/progress", h.GetBudgetProgress)

	// Budget mode management
	router.Get("/budgets/modes", h.GetBudgetModes)
	router.Get("/budgets/by-mode", h.GetBudgetsByMode)
	router.Put("/budgets/mode", h.UpdateBudgetMode)

	// Budget templates for percentage-based budgeting
	router.Get("/budgets/templates", h.GetBudgetTemplates)
	router.Get("/budgets/templates/{id}", h.GetBudgetTemplate)

	return router
}
