package tags

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/message"
	"github.com/google/uuid"
)

func validateColor(input string) (repository.COLORENUM, error) {
	var color repository.COLORENUM
	if err := color.Scan(input); err != nil || !color.Valid() {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func validateNullColor(input *string) (repository.NullCOLORENUM, error) {
	var color repository.NullCOLORENUM
	if err := color.Scan(input); err != nil {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func parseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.URL.Query().Get(paramName)
	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}
	return uuid.Parse(idStr)
}
