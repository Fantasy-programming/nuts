package server

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/internal/domain/category"
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
	AuthDomain := auth.Init(s.db, s.cfg, s.validator, s.i18n, s.logger, s.jwt)
	s.router.Mount("/auth", AuthDomain.Register())
}

func (s *Server) initUser() {
	UserDomain := user.Init(s.db, s.storage, s.jwt, s.validator, s.cfg, s.logger)
	s.router.Mount("/users", UserDomain.Register())
}

func (s *Server) initAccount() {
	AccountDomain := accounts.Init(s.db, s.cfg, s.validator, s.jwt, s.logger)
	s.router.Mount("/accounts", AccountDomain.Register())
}

func (s *Server) initTransaction() {
	TransactionDomain := transactions.Init(s.db, s.cfg, s.jwt, s.validator, s.logger)
	s.router.Mount("/transactions", TransactionDomain.Register())
}

func (s *Server) initCategory() {
	CategoryDomain := category.Init(s.db, s.cfg, s.jwt, s.validator, s.logger)
	s.router.Mount("/categories", CategoryDomain.Register())
}

func (s *Server) initPreferences() {
	Preferences := preferences.Init(s.db, s.cfg, s.validator, s.jwt, s.logger)
	s.router.Mount("/preferences", Preferences.Register())
}

func (s *Server) initTags() {
	TagsDomain := tags.Init(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/tags", TagsDomain.Register())
}

func (s *Server) initWebHooks() {
	hooksDomain := webhooks.Init(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/webhooks", hooksDomain.Register())
}

func (s *Server) initMeta() {
	MetaDomain := meta.Init(s.db, s.logger)
	s.router.Mount("/meta", MetaDomain.Register())
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
