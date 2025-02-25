package user

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/middleware/jwtauth"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (u *User) GetInfo(w http.ResponseWriter, r *http.Request) {
	id, err := jwtauth.GetID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    nil,
		})
		return
	}

	user, err := u.queries.GetUserById(ctx, id)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     u.log,
			Details:    id,
		})
		return
	}

	respond.Json(w, http.StatusOK, &GetUserResponse{
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, u.log)
}

func (u *User) UpdateInfo(w http.ResponseWriter, r *http.Request) {}

func (u *User) DeleteInfo(w http.ResponseWriter, r *http.Request) {}
