package server

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/internal/domain/category"
	"github.com/Fantasy-Programming/nuts/internal/domain/preferences"
	"github.com/Fantasy-Programming/nuts/internal/domain/tags"
	"github.com/Fantasy-Programming/nuts/internal/domain/transactions"
)

func (s *Server) RegisterDomain() {
	AuthDomain := auth.Init(s.db, s.cfg)
	AccountDomain := accounts.Init(s.db, s.cfg)
	TransactionDomain := transactions.Init(s.db, s.cfg)
	CategoryDomain := category.Init(s.db)
	Preferences := preferences.Init(s.db)
	TagsDomain := tags.Init(s.db)

	s.router.Mount("/auth", AuthDomain.Register())
	s.router.Mount("/account", AccountDomain.Register())
	s.router.Mount("/transaction", TransactionDomain.Register())
	s.router.Mount("/category", CategoryDomain.Register())
	s.router.Mount("/preferences", Preferences.Register())
	s.router.Mount("/tags", TagsDomain.Register())
	s.router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}
