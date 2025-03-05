package meta

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (m *Meta) GetSupportedCurrencies(w http.ResponseWriter, r *http.Request) {
	currencies, err := m.queries.GetCurrencies(r.Context())
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     m.log,
			Details:    nil,
		})
		return
	}

	respond.Json(w, http.StatusOK, currencies, m.log)
}

func (m *Meta) GetSupportedLanguages(w http.ResponseWriter, r *http.Request) {
}
