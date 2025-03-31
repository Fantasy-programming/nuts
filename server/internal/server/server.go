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

	"github.com/Fantasy-Programming/nuts/config"
	i18nMiddleware "github.com/Fantasy-Programming/nuts/internal/middleware/i18n"
	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/i18n"
	"github.com/Fantasy-Programming/nuts/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/pkg/logger"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/Fantasy-Programming/nuts/pkg/storage"
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

	db        *pgxpool.Pool
	storage   *storage.Storage
	cors      *cors.Cors
	router    router.Router
	validator *validation.Validator
	i18n      *i18n.I18n

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
	s.NewTokenService()
	s.NewValidator()
	s.NewI18n()
	s.NewRouter()
	s.setGlobalMiddleware()
	s.setRequestLogger()
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
	zerolog.SetGlobalLevel(logLevel)

	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	if true {
		logger = logger.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	s.logger = &logger
}

// TODO: Abstract the logger entirely
func (s *Server) NewTokenService() {
	queries := repository.New(s.db)

	tokenRepo := jwt.NewSQLCTokenRepository(queries)

	loggerAdapter := logger.NewZerologAdapter(s.logger)

	jwtConfig := jwt.Config{
		AccessTokenDuration:  15 * time.Minute,   // Adjust as needed
		RefreshTokenDuration: 7 * 24 * time.Hour, // 7 days, adjust as needed
		SigningKey:           s.cfg.SigningKey,
	}

	// Create the JWT service
	s.jwt = jwt.NewService(tokenRepo, jwtConfig, loggerAdapter)
}

func (s *Server) NewStorage() {
	strg := storage.NewMinio("nuts")
	s.storage = strg
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
		s.cfg.Database.Host,
		s.cfg.Database.Port,
		s.cfg.Database.Name,
		s.cfg.SslMode,
		s.cfg.User,
		s.cfg.Pass,
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

func (s *Server) setGlobalMiddleware() {
	s.router.Use(chiMiddleware.RequestID)
	s.router.Use(chiMiddleware.RealIP)
	s.router.Use(chiMiddleware.Recoverer)
	s.router.Use(i18nMiddleware.I18nMiddleware(s.i18n, nil))

	if s.cfg.RequestLog {
	}

	s.router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"message": "endpoint not found"}`))
	})
}

func (s *Server) Config() *config.Config {
	return s.cfg
}

func (s *Server) Run() {
	// Apply CORS handler *before* the main router
	var handler http.Handler = s.router
	if s.cors != nil { // Check if cors is configured
		handler = s.cors.Handler(handler) // Wrap the router
	}

	s.httpServer = &http.Server{
		Addr:              s.cfg.Api.Host + ":" + s.cfg.Api.Port,
		Handler:           handler,
		ReadHeaderTimeout: s.cfg.ReadHeaderTimeout,
	}

	go func() {
		start(s)
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
