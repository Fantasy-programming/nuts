package server

import (
	"context"
	"embed"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/Fantasy-Programming/nuts/pkg/router"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5"
)

var embedMigrations embed.FS

type Server struct {
	cfg        *config.Config
	cors       *cors.Cors
	db         *pgx.Conn
	router     *router.Router
	httpServer *http.Server
	Version    string
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
		log.Printf("Starting API version: %s\n", version)
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
	s.NewRouter()
	s.NewDatabase()
	s.setGlobalMiddleware()
	s.RegisterDomain()
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

func (s *Server) ListRoutes() {
	routes := s.router.ListRoutes()
	for _, route := range routes {
		fmt.Println(route)
	}
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

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err := conn.Ping(context.Background()); err != nil {
		log.Fatal(err)
	}

	s.db = conn
}

func (s *Server) NewRouter() {
	r := router.NewRouter()
	r.Prefix("/api")

	s.router = r
}

func (s *Server) setGlobalMiddleware() {
	s.router.Use(s.cors.Handler)
	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(middleware.Logger)
	s.router.Use(middleware.Recoverer)

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
	s.httpServer = &http.Server{
		Addr:              s.cfg.Api.Host + ":" + s.cfg.Api.Port,
		Handler:           s.router.ServeMux,
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

	log.Println("Shutting down...")

	ctx, shutdown := context.WithTimeout(ctx, s.Config().GracefulTimeout*time.Second)
	defer shutdown()

	err := s.httpServer.Shutdown(ctx)
	if err != nil {
		log.Println(err)
	}

	s.closeResources(ctx)

	return nil
}

func (s *Server) closeResources(ctx context.Context) {
	_ = s.db.Close(ctx)
}

func start(s *Server) {
	log.Printf("Serving at %s:%s\n", s.cfg.Api.Host, s.cfg.Api.Port)
	err := s.httpServer.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
