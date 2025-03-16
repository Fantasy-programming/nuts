package categories

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Handler struct {
	validator *validation.Validator
	repo      Repository
	log       *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, logger}
}

func (h *Handler) GetCategories(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	categories, err := h.repo.ListCategories(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, categories, h.log)
}

func (h *Handler) CreateCategories(w http.ResponseWriter, r *http.Request) {
	var req CreateCategoryRequest
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	params := repository.CreateCategoryParams{
		Name:      req.Name,
		ParentID:  req.ParentID,
		IsDefault: nil,
		CreatedBy: userID,
	}

	category, err := h.repo.CreateCategory(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    params,
		})
		return
	}

	respond.Json(w, http.StatusCreated, category, h.log)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	var req UpdateCategoryRequest
	ctx := r.Context()

	// Get category ID from URL
	categoryID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	params := repository.UpdateCategoryParams{
		ID:        categoryID,
		Name:      req.Name,
		ParentID:  req.ParentID,
		UpdatedBy: &userID,
	}

	category, err := h.repo.UpdateCategory(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    params,
		})
		return
	}

	respond.Json(w, http.StatusOK, category, h.log)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get category ID from URL
	categoryID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	err = h.repo.DeleteCategory(ctx, categoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    categoryID,
		})
		return
	}

	respond.Status(w, http.StatusNoContent)
}
