package server

import (
	"github.com/Fantasy-Programming/nuts/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/internal/domain/auth"
)

func (s *Server) RegisterDomain() {
	AuthDomain := auth.Init(s.db, s.cfg)
	AccountDomain := accounts.Init(s.db, s.cfg)

	s.router.Mount("/auth", AuthDomain.Register())
	s.router.Mount("/account", AccountDomain.Register())
	s.router.Mount("/transaction", AccountDomain.Register())
}
