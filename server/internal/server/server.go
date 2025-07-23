package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/i18n"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/mailer"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/Fantasy-Programming/nuts/server/pkg/storage"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
)

type Server struct {
	Version string
	cfg     *config.Config
	logger  *zerolog.Logger
	jwt     *jwt.Service

	db      *pgxpool.Pool
	storage storage.Storage
	mailer  mailer.Service

	cors        *cors.Cors
	router      router.Router
	jobsManager *jobs.Service
	validator   *validation.Validator
	i18n        *i18n.I18n

	openfinance *finance.ProviderManager

	httpServer *http.Server
}

type Options func(opts *Server) error

func New(opts ...Options) *Server {
	s := defaultServer()

	for _, opt := range opts {
		err := opt(s)
		if err != nil {
			log.Fatalln(err)
		}
	}

	return s
}

func WithVersion(version string) Options {
	return func(opts *Server) error {
		opts.Version = version
		return nil
	}
}

func defaultServer() *Server {
	return &Server{
		cfg:    config.New(),
		router: router.NewRouter(),
	}
}

func (s *Server) Init() {
	s.setCors()
	s.NewLogger()
	s.NewDatabase()
	s.NewStorage()
	s.NewMailer()
	s.NewOPFinanceManager()
	// s.SetupPaymentProcessors()

	s.NewTokenService()
	s.NewJobService()
	s.NewValidator()
	s.NewI18n()
	s.NewRouter()
	s.setGlobalMiddleware()
	s.RegisterDomain()
}

func (s *Server) setRequestLogger() {
	s.router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			logger := s.logger.With().
				Str("method", r.Method).
				Str("url", r.URL.String()).
				Str("remote_addr", r.RemoteAddr).
				Logger()

			logger.Info().Msg("Request started")
			next.ServeHTTP(w, r)
			logger.Info().Dur("duration", time.Since(start)).Msg("Request completed")
		})
	})
}

func (s *Server) NewLogger() {
	logLevel := zerolog.TraceLevel // will be changed to info

	env := os.Getenv("ENVIRONMENT")

	if env == "test" {
		logLevel = zerolog.Disabled
	}

	zerolog.SetGlobalLevel(logLevel)

	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	if true {
		logger = logger.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	s.logger = &logger
}

func (s *Server) NewTokenService() {
	queries := repository.New(s.db)

	tokenRepo := jwt.NewSQLCTokenRepository(queries)

	jwtConfig := jwt.Config{
		AccessTokenDuration:  15 * time.Minute,   // Adjust as needed
		RefreshTokenDuration: 7 * 24 * time.Hour, // 7 days, adjust as needed
		SigningKey:           s.cfg.SigningKey,
	}

	// Create the JWT service
	s.jwt = jwt.NewService(tokenRepo, jwtConfig, s.logger)
}

func (s *Server) NewStorage() {
	storage, err := storage.NewStorageProvider(s.cfg.Storage, s.logger)
	if err != nil {
		s.logger.Panic().Err(err).Msg("INIT: Failed to setup storage")
	}

	s.storage = storage

	if s.cfg.Storage.Host == "Fs" {
		return
	}

	// Setup buckets
	exist, err := s.storage.BucketExists(context.Background(), s.cfg.PublicBucketName)
	if err != nil {
		s.logger.Err(err).Msg("INIT: Failed to check public bucket existance")
	}

	if !exist {
		err = s.storage.CreatePublicBucket(context.Background(), s.cfg.PublicBucketName, s.cfg.Region)
		if err != nil {
			s.logger.Panic().Err(err).Interface("env", s.cfg.Storage).Msg("INIT: Failed to create public bucket")
		}
	}

	// Setup buckets
	exist, err = s.storage.BucketExists(context.Background(), s.cfg.PrivateBucketName)
	if err != nil {
		s.logger.Err(err).Msg("Failed to check private bucket existance")
	}

	if !exist {
		err = s.storage.CreateSecureBucket(context.Background(), s.cfg.PrivateBucketName, s.cfg.Region)
		if err != nil {
			s.logger.Panic().Err(err).Interface("env", s.cfg.Storage).Msg("Failed to create secure bucket")
		}
	}
}

func (s *Server) setCors() {
	s.cors = cors.New(
		cors.Options{
			// Just to test
			AllowedOrigins: []string{"https://*", "http://*"},
			AllowedMethods: []string{
				http.MethodOptions,
				http.MethodHead,
				http.MethodGet,
				http.MethodPost,
				http.MethodPut,
				http.MethodPatch,
				http.MethodDelete,
			},
			AllowedHeaders:   []string{"*"},
			AllowCredentials: true,
		})
}

// TODO: Restore that
func (s *Server) ListRoutes() {
	s.router.ListRoutes()
}

func (s *Server) NewDatabase() {
	dsn := fmt.Sprintf("postgres://%s:%d/%s?sslmode=%s&user=%s&password=%s",
		s.cfg.DB.Host,
		s.cfg.DB.Port,
		s.cfg.DB.Name,
		s.cfg.SslMode,
		s.cfg.DB.User,
		s.cfg.DB.Pass,
	)

	conn, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to connect to the db")
	}

	if err := conn.Ping(context.Background()); err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to ping the db")
	}

	s.logger.Info().Msg("Connected to the database")

	s.db = conn
}

func (s *Server) NewRouter() {
	r := router.NewRouter()
	r.Prefix("/api")

	s.router = r
}

func (s *Server) NewValidator() {
	s.validator = validation.New()
}

func (s *Server) NewI18n() {
	var localesDir string

	if os.Getenv("ENVIRONMENT") == "production" {
		localesDir = filepath.Join(os.Getenv("PWD"), "locales")
	} else {
		projectRoot := filepath.Dir(os.Getenv("PWD"))
		localesDir = filepath.Join(projectRoot, "server", "locales")
	}

	i18nInstance, err := i18n.New(i18n.Config{
		DefaultLanguage: "en",
		LocalesDir:      localesDir,
	})
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to initialize i18n")
	}

	s.i18n = i18nInstance
}

// TODO: If the error is that there is no provider then ignore
func (s *Server) NewOPFinanceManager() {
	manager, err := finance.NewProviderManager(s.cfg.Integrations, s.logger)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to setup Open finance Manager")
	}
	s.openfinance = manager
}

func (s *Server) setGlobalMiddleware() {
	s.router.Use(chiMiddleware.RequestID)
	s.router.Use(chiMiddleware.RealIP)
	s.router.Use(chiMiddleware.Recoverer)
	s.router.Use(chiMiddleware.Timeout(60 * time.Second))
	s.router.Use(i18n.I18nMiddleware(s.i18n, nil))

	if s.cfg.RequestLog {
		s.setRequestLogger()
	}

	// s.router.Use(func(w http.ResponseWriter, r *http.Request) {
	// })

	s.router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"message": "endpoint not found"}`))
	})
}

func (s *Server) NewJobService() {
	jobService, err := jobs.NewService(s.db, s.logger, s.openfinance, s.cfg.EncryptionSecretKeyHex)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to setup job service")
	}
	s.jobsManager = jobService
}

func (s *Server) NewMailer() {
	mailerConfig := mailer.Config{
		Host:      s.cfg.SMTP.Host,
		Port:      s.cfg.SMTP.Port,
		Username:  s.cfg.SMTP.Username,
		Password:  s.cfg.SMTP.Password,
		FromEmail: s.cfg.SMTP.FromEmail,
		FromName:  s.cfg.SMTP.FromName,
		MailGeneratorURL: "http://localhost:3001", // TODO: Make this configurable
	}
	
	s.mailer = mailer.NewService(mailerConfig)
	s.logger.Info().Msg("Mailer service initialized")
}

func (s *Server) Config() *config.Config {
	return s.cfg
}

func (s *Server) Run() {
	var handler http.Handler = s.router

	if s.cors != nil {
		handler = s.cors.Handler(handler)
	}

	s.httpServer = &http.Server{
		Addr:              s.cfg.Api.Host + ":" + s.cfg.Api.Port,
		Handler:           handler,
		ReadHeaderTimeout: s.cfg.ReadHeaderTimeout,
	}

	go func() {
		start(s)
	}()

	go func() {
		if err := s.jobsManager.Start(context.Background()); err != nil {
			s.logger.Error().Err(err).Msg("Failed to start job processor")
		}
	}()

	_ = gracefulShutdown(context.Background(), s)
}

func gracefulShutdown(ctx context.Context, s *Server) error {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit

	s.logger.Info().Msgf("Shutting down server %v", s.httpServer.Addr)

	ctx, shutdown := context.WithTimeout(ctx, s.Config().GracefulTimeout*time.Second)
	defer shutdown()

	err := s.httpServer.Shutdown(ctx)
	if err != nil {
		s.logger.Err(err).Msg("Server shutdown failure")
	}

	s.closeResources()

	return nil
}

func (s *Server) closeResources() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := s.jobsManager.Stop(ctx); err != nil {
		s.logger.Error().Err(err).Msg("Error stopping job processor")
	}

	s.db.Close()
}

func start(s *Server) {
	s.logger.Info().Msgf("Starting API version: %s", s.Version)
	s.logger.Info().Msgf("Serving at %s:%s\n", s.cfg.Api.Host, s.cfg.Api.Port)

	err := s.httpServer.ListenAndServe()
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to start the server")
	}
}
