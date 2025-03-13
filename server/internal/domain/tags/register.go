package tags

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

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

func (t *Tags) GetTags(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
			Details:    r.URL.Path,
		})
		return
	}

	tags, err := t.queries.GetTagsByUserId(ctx, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Json(w, http.StatusOK, "[]", t.log)
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, tags, t.log)
}

func (t *Tags) CreateTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req TagRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     t.log,
			Details:    r.Body,
		})
		return
	}

	// Validate tags
	if err := t.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     t.log,
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
			Logger:     t.log,
			Details:    req,
		})
		return
	}

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
			Details:    nil,
		})
		return
	}

	newTag, err := t.queries.CreateTag(ctx, repository.CreateTagParams{
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
			Logger:     t.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, newTag, t.log)
}

func (t *Tags) UpdateTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tagID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     t.log,
			Details:    tagID,
		})
		return
	}

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
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
			Logger:     t.log,
			Details:    r.Body,
		})
		return
	}

	// Validate tags
	if err := t.v.Validator.Struct(req); err != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     t.log,
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
			Logger:     t.log,
			Details:    req,
		})
		return
	}

	newTag, err := t.queries.UpdateTag(ctx, repository.UpdateTagParams{
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
			Logger:     t.log,
			Details:    req,
		})
		return
	}

	respond.Json(w, http.StatusOK, newTag, t.log)
}

func (t *Tags) DeleteTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tagID, err := parseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     t.log,
			Details:    tagID,
		})
		return
	}

	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
			Details:    nil,
		})
		return
	}

	if err = t.queries.DeleteTag(ctx, repository.DeleteTagParams{
		UserID: userID,
		ID:     tagID,
	}); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     t.log,
			Details:    tagID,
		})
		return

	}

	respond.Status(w, http.StatusNoContent)
}
