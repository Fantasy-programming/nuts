package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/user/service"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/rs/zerolog"
)

type Handler struct {
	service   service.Users
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Users, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{service, validator, logger}
}

func (h *Handler) GetInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	info, err := h.service.GetUserInfo(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	respond.Json(w, http.StatusOK, info, h.logger)
}

func (h *Handler) UpdateInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	var req user.UpdateUserRequest

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
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

	params := repository.UpdateUserParams{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		ID:        id,
	}

	// Only set email if it's not empty to avoid overwriting existing email
	if req.Email != "" {
		params.Email = &req.Email
	}

	user, err := h.service.UpdateUserInfo(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	respond.Json(w, http.StatusOK, user, h.logger)
}

func (h *Handler) DeleteInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	err = h.service.DeleteUser(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    id,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

// UploadAvatar handles avatar image uploads
func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	id, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Parse multipart form with 5MB max size
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "Failed to parse form",
		})
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("avatar")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    "No avatar file found in request",
		})
		return
	}
	defer file.Close()

	url, err := h.service.UpdateUserAvatar(ctx, id, handler.Filename, handler.Size, file)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	// Return success response with avatar URL
	respond.Json(w, http.StatusOK, map[string]string{
		"avatar_url": url,
	}, h.logger)
}
