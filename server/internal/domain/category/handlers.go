package category

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (c *Category) GetCategories(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	categories, err := c.queries.ListCategories(r.Context(), id)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}

	payload, err := json.Marshal(categories)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}
	respond.Json(w, http.StatusOK, payload)
}
func (c *Category) CreateCategories(w http.ResponseWriter, r *http.Request) {}
func (c *Category) UpdateCategory(w http.ResponseWriter, r *http.Request)   {}
func (c *Category) DeleteCategory(w http.ResponseWriter, r *http.Request)   {}
