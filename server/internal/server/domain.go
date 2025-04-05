package server

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/internal/domain/categories"
	"github.com/Fantasy-Programming/nuts/internal/domain/meta"
	"github.com/Fantasy-Programming/nuts/internal/domain/preferences"
	"github.com/Fantasy-Programming/nuts/internal/domain/tags"
	"github.com/Fantasy-Programming/nuts/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/internal/domain/webhooks"
	"github.com/Fantasy-Programming/nuts/internal/utility/respond"
)

func (s *Server) RegisterDomain() {
	s.initAuth()
	s.initUser()
	s.initAccount()
	s.initTransaction()
	s.initCategory()
	s.initPreferences()
	s.initTags()
	s.initMeta()
	s.initWebHooks()
	s.initVersion()
	s.initHealth()
}

func (s *Server) initAuth() {
	AuthDomain := auth.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.cfg, s.logger)
	s.router.Mount("/auth", AuthDomain)
}

func (s *Server) initUser() {
	UserDomain := user.RegisterHTTPHandlers(s.cfg, s.db, s.storage, s.validator, s.jwt, s.logger)
	s.router.Mount("/users", UserDomain)
}

func (s *Server) initAccount() {
	AccountDomain := accounts.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/accounts", AccountDomain)
}

func (s *Server) initTransaction() {
	TransactionDomain := transactions.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/transactions", TransactionDomain)
}

func (s *Server) initCategory() {
	CategoryDomain := categories.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/categories", CategoryDomain)
}

func (s *Server) initPreferences() {
	Preferences := preferences.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/preferences", Preferences)
}

func (s *Server) initTags() {
	TagsDomain := tags.RegisterHTTPHandlers(s.db, s.validator, s.logger)
	s.router.Mount("/tags", TagsDomain)
}

func (s *Server) initWebHooks() {
	hooksDomain := webhooks.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/webhooks", hooksDomain)
}

func (s *Server) initMeta() {
	MetaDomain := meta.RegisterHTTPHandlers(s.db, s.logger)
	s.router.Mount("/meta", MetaDomain)
}

func (s *Server) initHealth() {
	s.router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

func (s *Server) initVersion() {
	s.router.Get("/version", func(w http.ResponseWriter, r *http.Request) {
		respond.Json(w, http.StatusOK, map[string]string{"version": s.Version}, s.logger)
	})
}
