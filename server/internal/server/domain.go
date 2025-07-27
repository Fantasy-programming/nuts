package server

import (
	"net/http"

	accHandler "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/handlers"
	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	athHandler "github.com/Fantasy-Programming/nuts/server/internal/domain/auth/handlers"
	athRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/auth/repository"
	athService "github.com/Fantasy-Programming/nuts/server/internal/domain/auth/service"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/mail"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/meta"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/tags"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/webhooks"

	accService "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/service"

	ctgHandler "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/handlers"
	ctgRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	ctgService "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/service"
	trcHandler "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/handlers"
	trcRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	trcService "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
	usrHandler "github.com/Fantasy-Programming/nuts/server/internal/domain/user/handlers"
	usrRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/user/repository"
	usrService "github.com/Fantasy-Programming/nuts/server/internal/domain/user/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
)

func (s *Server) RegisterDomain() {
	s.initAuth()
	s.initUser()
	s.initAccount()
	s.initTransaction()
	s.initCategory()
	s.initTags()
	s.initMeta()
	s.initWebHooks()
	s.initMail()
	s.initVersion()
	s.initHealth()
}

func (s *Server) initAuth() {
	encrypter, err := encrypt.NewEncrypter(s.cfg.EncryptionSecretKeyHex)
	if err != nil {
		s.logger.Panic().Err(err).Msg("Failed to setup encrypter")
	}

	usersRepo := usrRepo.NewRepository(s.db)
	authRepo := athRepo.NewRepository(s.db)
	categoriesRepo := ctgRepo.NewRepository(s.db)
	userService := usrService.New(s.db, s.storage, s.cfg, usersRepo, authRepo, categoriesRepo)

	authService := athService.New(s.db, authRepo, usersRepo, userService, s.jwt, encrypter)
	AuthDomain := athHandler.RegisterHTTPHandlers(authService, s.jwt, s.cfg, s.validator, s.logger)

	s.router.Mount("/auth", AuthDomain)
}

func (s *Server) initUser() {
	usersRepo := usrRepo.NewRepository(s.db)
	authRepo := athRepo.NewRepository(s.db)
	categoriesRepo := ctgRepo.NewRepository(s.db)
	userService := usrService.New(s.db, s.storage, s.cfg, usersRepo, authRepo, categoriesRepo)

	UserDomain := usrHandler.RegisterHTTPHandlers(userService, s.jwt, s.validator, s.logger)
	s.router.Mount("/users", UserDomain)
}

func (s *Server) initAccount() {
	encrypter, err := encrypt.NewEncrypter(s.cfg.EncryptionSecretKeyHex)
	if err != nil {
		s.logger.Panic().Err(err).Msg("Failed to setup encrypter")
	}

	accountsRepo := accRepo.NewRepository(s.db)
	transactionsRepo := trcRepo.NewRepository(s.db)
	categoriesRepo := ctgRepo.NewRepository(s.db)
	accountsService := accService.New(s.db, encrypter, s.openfinance, s.jobsManager, accountsRepo, transactionsRepo, categoriesRepo, s.logger)

	AccountDomain := accHandler.RegisterHTTPHandlers(accountsService, s.validator, s.jwt, s.logger)
	s.router.Mount("/accounts", AccountDomain)
}

func (s *Server) initTransaction() {
	transactionsRepo := trcRepo.NewRepository(s.db)
	accountsRepo := accRepo.NewRepository(s.db)
	llmService, err := llm.NewService(s.cfg.LLM, s.logger)
	if err != nil {
		s.logger.Panic().Err(err).Msg("Failed to setup llm service")
	}

	transactionsService := trcService.New(s.db, transactionsRepo, accountsRepo, llmService, s.jobsManager, s.logger)
	TransactionDomain := trcHandler.RegisterHTTPHandlers(transactionsService, s.jwt, s.validator, s.logger)
	s.router.Mount("/transactions", TransactionDomain)
}

func (s *Server) initCategory() {
	categoriesRepo := ctgRepo.NewRepository(s.db)
	categoriesService := ctgService.New(s.db, categoriesRepo)
	CategoryDomain := ctgHandler.RegisterHTTPHandlers(categoriesService, s.jwt, s.validator, s.logger)
	s.router.Mount("/categories", CategoryDomain)
}

func (s *Server) initTags() {
	TagsDomain := tags.RegisterHTTPHandlers(s.db, s.validator, s.logger)
	s.router.Mount("/tags", TagsDomain)
}

func (s *Server) initWebHooks() {
	hooksDomain := webhooks.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.logger)
	s.router.Mount("/webhooks", hooksDomain)
}

func (s *Server) initMail() {
	MailDomain := mail.RegisterHTTPHandlers(s.db, s.validator, s.jwt, s.mailer, s.logger)
	s.router.Mount("/mail", MailDomain)
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
