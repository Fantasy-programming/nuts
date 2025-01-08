package category

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (c *Category) GetCategories(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	ctx := r.Context()
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	categories, err := c.queries.ListCategories(ctx, id)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
		return
	}

	respond.Json(w, http.StatusOK, categories)
}
func (c *Category) CreateCategories(w http.ResponseWriter, r *http.Request) {}
func (c *Category) UpdateCategory(w http.ResponseWriter, r *http.Request)   {}
func (c *Category) DeleteCategory(w http.ResponseWriter, r *http.Request)   {}
