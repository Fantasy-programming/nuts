package preferences

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
)

// UserPreferences holds the user preferences data structure
type UpdateUserPreferencesReq struct {
	Currency *string `json:"currency"`
	Locale   *string `json:"locale"`
	Theme    *string `json:"theme"`
}

func (c *Preferences) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
		})
		return
	}

	// Get preferences from database
	prefs, err := c.queries.GetPreferencesByUserId(r.Context(), userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
		})
		return
	}

	respond.Json(w, http.StatusOK, prefs, c.log)
}

func (c *Preferences) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
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
			Logger:     c.log,
		})
		return
	}

	// Validate the request
	if err := c.validate.Validator.Struct(req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     c.log,
		})
		return
	}

	// Update preferences in database
	params := repository.UpdatePreferencesParams{
		UserID:   userID,
		Currency: req.Currency,
		Locale:   req.Locale,
		Theme:    req.Theme,
	}

	updatedPrefs, err := c.queries.UpdatePreferences(r.Context(), params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
		})
		return
	}

	respond.Json(w, http.StatusOK, updatedPrefs, c.log)
}
