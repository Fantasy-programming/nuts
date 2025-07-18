package server

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/categories"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/meta"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/preferences"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/rules"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/tags"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/webhooks"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
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
	s.initRules()
	s.initVersion()
	s.initHealth()
}

func (s *Server) initAuth() {
	AuthDomain := auth.RegisterHTTPHandlers(s.db, s.storage, s.validator, s.jwt, s.cfg, s.logger)
	s.router.Mount("/auth", AuthDomain)
}

func (s *Server) initUser() {
	UserDomain := user.RegisterHTTPHandlers(s.cfg, s.db, s.storage, s.validator, s.jwt, s.logger)
	s.router.Mount("/users", UserDomain)
}

func (s *Server) initAccount() {
	AccountDomain := accounts.RegisterHTTPHandlers(s.cfg, s.db, s.validator, s.jwt, s.openfinance, s.jobsManager, s.logger)
	s.router.Mount("/accounts", AccountDomain)
}

func (s *Server) initTransaction() {
	// Create queries and transaction repository
	queries := repository.New(s.db)
	transRepo := transactions.NewRepository(s.db, queries)
	
	// Create rules service
	rulesRepo := rules.NewRepository(s.db)
	rulesService := rules.NewService(rulesRepo, transRepo, s.logger)
	
	// Create transaction handler with rules integration
	TransactionDomain := transactions.RegisterHTTPHandlersWithRules(s.db, s.validator, s.jwt, rulesService, s.logger)
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

func (s *Server) initRules() {
	// Create transaction repository to pass to rules service
	queries := repository.New(s.db)
	transRepo := transactions.NewRepository(s.db, queries)
	
	RulesDomain := rules.RegisterHTTPHandlers(s.db, s.validator, s.jwt, transRepo, s.logger)
	s.router.Mount("/rules", RulesDomain)
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
