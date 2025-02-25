package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (c *Category) GetCategories(w http.ResponseWriter, r *http.Request) {
	userID, err := jwtauth.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
			Details:    r.URL.Path,
		})
		return
	}

	categories, err := c.queries.ListCategories(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     c.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, categories, c.log)
}
func (c *Category) CreateCategories(w http.ResponseWriter, r *http.Request) {}
func (c *Category) UpdateCategory(w http.ResponseWriter, r *http.Request)   {}
func (c *Category) DeleteCategory(w http.ResponseWriter, r *http.Request)   {}
