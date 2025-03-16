package tags

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Handler struct {
	v    *validation.Validator
	repo Repository
	log  *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, logger}
}

type TagRequest struct {
	Name  string `json:"name" validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type TagUpdateRequest struct {
	Name  *string `json:"name" validate:"required,min=1,max=50"`
	Color *string `json:"color" validate:"required,hexcolor"`
}

type TagResponse struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Color string    `json:"color"`
}

func (h *Handler) GetTags(w http.ResponseWriter, r *http.Request) {
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

	tags, err := h.repo.GetTags(ctx, userID)
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

	respond.Json(w, http.StatusOK, tags, h.log)
}

func (h *Handler) CreateTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req TagRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	// Validate tags
	if err := h.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	color, err := validateColor(req.Color)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrColorTypeInvalid,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
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
			Details:    nil,
		})
		return
	}

	newTag, err := h.repo.CreateTag(ctx, repository.CreateTagParams{
		UserID: userID,
		Name:   req.Name,
		Color:  color,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, newTag, h.log)
}

func (h *Handler) UpdateTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tagID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    tagID,
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
			Details:    nil,
		})
		return
	}

	var req TagUpdateRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	// Validate tags
	if err := h.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	color, err := validateNullColor(req.Color)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  ErrColorTypeInvalid,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	newTag, err := h.repo.UpdateTag(ctx, repository.UpdateTagParams{
		UserID: userID,
		ID:     tagID,
		Name:   req.Name,
		Color:  color,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, newTag, h.log)
}

func (h *Handler) DeleteTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tagID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    tagID,
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
			Details:    nil,
		})
		return
	}

	if err = h.repo.DeleteTag(ctx, repository.DeleteTagParams{
		UserID: userID,
		ID:     tagID,
	}); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    tagID,
		})
		return

	}

	respond.Status(w, http.StatusNoContent)
}
