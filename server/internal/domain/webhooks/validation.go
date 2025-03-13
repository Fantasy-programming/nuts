package webhooks

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/google/uuid"
)

func parseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.URL.Query().Get(paramName)
	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}
	return uuid.Parse(idStr)
}
