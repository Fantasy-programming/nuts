package budgets

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/google/uuid"
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

	var req CreateBudgetRequest

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

	// For now, create budget with basic parameters until SQLC generates new fields
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
}

func (h *Handler) GetBudgetsByMode(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
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

	mode := r.URL.Query().Get("mode")
	if mode == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "mode parameter is required",
		})
		return
	}

	budgets, err := h.repo.GetBudgetsByMode(r.Context(), userID, BudgetMode(mode))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    mode,
		})
		return
	}

	respond.Json(w, http.StatusOK, budgets, h.logger)
}

func (h *Handler) GetBudgetModes(w http.ResponseWriter, r *http.Request) {
	modes := []BudgetModeInfo{
		{
			Mode:        BudgetModeTraditionalCategory,
			Name:        "Traditional Category Budgets",
			Description: "Fixed categories with allocated amounts, similar to YNAB/Mint approach",
			IsEnabled:   true,
		},
		{
			Mode:        BudgetModeFlexBucket,
			Name:        "Flex Bucket System",
			Description: "Single flexible spending pool, similar to Monarch approach",
			IsEnabled:   true,
		},
		{
			Mode:        BudgetModeGlobalLimit,
			Name:        "Global Spending Limit",
			Description: "Simple total spending cap with no category breakdown",
			IsEnabled:   true,
		},
		{
			Mode:        BudgetModeZeroBased,
			Name:        "Zero-Based Budgeting",
			Description: "Every dollar must be assigned, traditional envelope method",
			IsEnabled:   true,
		},
		{
			Mode:        BudgetModePercentageBased,
			Name:        "Percentage-Based Budgeting",
			Description: "Support for 50/30/20 rule and similar frameworks",
			IsEnabled:   true,
		},
	}

	respond.Json(w, http.StatusOK, modes, h.logger)
}

func (h *Handler) UpdateBudgetMode(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
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

	var req UpdateBudgetModeRequest
	valErr, err := h.v.ParseAndValidate(r.Context(), r, &req)
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

	err = h.repo.UpdateUserBudgetMode(r.Context(), userID, req.BudgetMode)
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

	// Also create or update user budget settings
	settings, err := h.repo.CreateOrUpdateUserBudgetSettings(r.Context(), userID, req.BudgetMode, req.Settings)
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

	respond.Json(w, http.StatusOK, settings, h.logger)
}

func (h *Handler) GetBudgetTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.repo.GetBudgetTemplates(r.Context())
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

	respond.Json(w, http.StatusOK, templates, h.logger)
}

func (h *Handler) GetBudgetTemplate(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("id")
	if templateIDStr == "" {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  nil,
			Logger:     h.logger,
			Details:    "template ID is required",
		})
		return
	}

	templateID, err := uuid.Parse(templateIDStr)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    templateIDStr,
		})
		return
	}

	template, err := h.repo.GetBudgetTemplate(r.Context(), templateID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    templateID,
		})
		return
	}

	categories, err := h.repo.GetBudgetTemplateCategories(r.Context(), templateID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    templateID,
		})
		return
	}

	response := map[string]interface{}{
		"template":   template,
		"categories": categories,
	}

	respond.Json(w, http.StatusOK, response, h.logger)
}

func (h *Handler) UpdateBudget(w http.ResponseWriter, r *http.Request)       {}
func (h *Handler) GetBudget(w http.ResponseWriter, r *http.Request)         {}
func (h *Handler) GetBudgetProgress(w http.ResponseWriter, r *http.Request) {}
func (h *Handler) DeleteBudget(w http.ResponseWriter, r *http.Request)      {}
