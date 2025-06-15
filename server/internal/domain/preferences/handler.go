package preferences

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
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

// UserPreferences holds the user preferences data structure
type UpdateUserPreferencesReq struct {
	Currency          *string `json:"currency"`
	Locale            *string `json:"locale"`
	Theme             *string `json:"theme"`
	Timezone          *string `json:"timezone"`
	TimeFormat        *string `json:"time_format"`
	DateFormat        *string `json:"date_format"`
	StartWeekOnMonday *bool   `json:"start_week_on_monday"`
	DarkSidebar       *bool   `json:"dark_sidebar"`
}

func (h *Handler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized, // Changed from ErrInternalError to ErrUnauthorized
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Get preferences from database
	prefs, err := h.repo.GetPreferencesByUserId(r.Context(), userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	respond.Json(w, http.StatusOK, prefs, h.log)
}

func (h *Handler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized, // Changed from ErrInternalError to ErrUnauthorized
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Parse request body
	var req UpdateUserPreferencesReq

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
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

	// Validate the request
	if err := h.v.Validator.Struct(req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	// Update preferences in database
	params := repository.UpdatePreferencesParams{
		UserID:            userID,
		Currency:          req.Currency,
		Locale:            req.Locale,
		Theme:             req.Theme,
		Timezone:          req.Timezone,
		TimeFormat:        req.TimeFormat,
		DateFormat:        req.DateFormat,
		StartWeekOnMonday: req.StartWeekOnMonday,
		DarkSidebar:       req.DarkSidebar,
	}

	updatedPrefs, err := h.repo.UpdatePreferences(r.Context(), params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	respond.Json(w, http.StatusOK, updatedPrefs, h.log)
}
