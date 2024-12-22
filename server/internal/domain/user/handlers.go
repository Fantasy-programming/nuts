package user

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (u *User) GetInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, message.ErrInternalError)
		return
	}

	user, err := u.queries.GetUserById(r.Context(), id)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, err)
	}

	respond.Json(w, http.StatusOK, &GetUserResponse{
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	})
}

func (u *User) UpdateInfo(w http.ResponseWriter, r *http.Request) {}

func (u *User) DeleteInfo(w http.ResponseWriter, r *http.Request) {}
