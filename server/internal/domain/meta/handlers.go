package meta

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/rs/zerolog"
)

type Handler struct {
	repo Repository
	log  *zerolog.Logger
}

func NewHandler(repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{repo, logger}
}

func (h *Handler) GetSupportedCurrencies(w http.ResponseWriter, r *http.Request) {
	currencies, err := h.repo.GetCurrencies(r.Context())
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

	respond.Json(w, http.StatusOK, currencies, h.log)
}

func (h *Handler) GetSupportedLanguages(w http.ResponseWriter, r *http.Request) {
}
