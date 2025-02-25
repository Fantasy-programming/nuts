package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRouter(t *testing.T) {
	t.Run("basic routing", func(t *testing.T) {
		r := NewRouter()
		called := false

		r.Get("/test", func(w http.ResponseWriter, r *http.Request) {
			called = true
		})

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, called)
	})

	t.Run("middleware", func(t *testing.T) {
		r := NewRouter()
		order := []string{}

		middleware1 := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				order = append(order, "m1")
				next.ServeHTTP(w, r)
			})
		}

		middleware2 := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				order = append(order, "m2")
				next.ServeHTTP(w, r)
			})
		}

		r.Use(middleware1)
		r.Use(middleware2)
		r.Get("/test", func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "handler")
		})

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, []string{"m1", "m2", "handler"}, order)
	})

	t.Run("mount", func(t *testing.T) {
		r := NewRouter()
		sub := NewRouter()

		called := false
		sub.Get("/test", func(w http.ResponseWriter, r *http.Request) {
			called = true
		})

		r.Mount("/api", sub)

		req := httptest.NewRequest("GET", "/api/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, called)
	})

	t.Run("not found", func(t *testing.T) {
		r := NewRouter()
		notFoundCalled := false

		r.NotFound(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			notFoundCalled = true
		}))

		req := httptest.NewRequest("GET", "/notexist", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, notFoundCalled)
	})

	t.Run("HTTP methods", func(t *testing.T) {
		methods := []struct {
			method      string
			routerFunc  func(r *Router, path string, h http.HandlerFunc) error
			requestFunc func(path string) *http.Request
		}{
			{
				method: "GET",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Get(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("GET", path, nil)
				},
			},
			{
				method: "POST",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Post(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("POST", path, nil)
				},
			},
			{
				method: "PUT",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Put(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("PUT", path, nil)
				},
			},
			{
				method: "DELETE",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Delete(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("DELETE", path, nil)
				},
			},
			{
				method: "HEAD",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Head(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("HEAD", path, nil)
				},
			},
			{
				method: "OPTIONS",
				routerFunc: func(r *Router, path string, h http.HandlerFunc) error {
					return r.Options(path, h)
				},
				requestFunc: func(path string) *http.Request {
					return httptest.NewRequest("OPTIONS", path, nil)
				},
			},
		}

		for _, m := range methods {
			t.Run(m.method, func(t *testing.T) {
				r := NewRouter()
				called := false

				err := m.routerFunc(r, "/test", func(w http.ResponseWriter, r *http.Request) {
					called = true
				})

				assert.NoError(t, err)

				req := m.requestFunc("/test")
				w := httptest.NewRecorder()
				r.ServeHTTP(w, req)

				assert.True(t, called, "Handler was not called for %s request", m.method)
			})
		}
	})

	t.Run("prefix", func(t *testing.T) {
		r := NewRouter()
		r.Prefix("/api")

		called := false
		r.Get("/users", func(w http.ResponseWriter, r *http.Request) {
			called = true
		})

		req := httptest.NewRequest("GET", "/api/users", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, called)
	})

	t.Run("group", func(t *testing.T) {
		r := NewRouter()
		called := false
		called2 := false

		r.Group(func(g *Router) {
			g.Prefix("/api")
			g.Get("/users", func(w http.ResponseWriter, r *http.Request) {
				called = true
			})
		})

		r.Get("/outside", func(w http.ResponseWriter, r *http.Request) {
			called2 = true
		})

		req := httptest.NewRequest("GET", "/api/users", nil)
		req2 := httptest.NewRequest("GET", "/outside", nil)
		w := httptest.NewRecorder()
		w2 := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		r.ServeHTTP(w2, req2)

		assert.True(t, called)
		assert.True(t, called2)
	})

	t.Run("route", func(t *testing.T) {
		r := NewRouter()
		called := false

		r.Route("/api", func(api *Router) {
			api.Route("/v1", func(v1 *Router) {
				v1.Get("/users", func(w http.ResponseWriter, r *http.Request) {
					called = true
				})
			})
		})

		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.True(t, called)
	})

	t.Run("middleware scoping", func(t *testing.T) {
		r := NewRouter()

		// Create middlewares that track execution
		log := []string{}
		authMiddleware := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				log = append(log, "auth")
				next.ServeHTTP(w, r)
			})
		}

		loggingMiddleware := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				log = append(log, "logging")
				next.ServeHTTP(w, r)
			})
		}

		apiMiddleware := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				log = append(log, "api")
				next.ServeHTTP(w, r)
			})
		}

		// Apply global middleware
		r.Use(loggingMiddleware)

		// Public endpoint
		r.Get("/public", func(w http.ResponseWriter, r *http.Request) {
			log = append(log, "public-handler")
		})

		// API endpoints with additional middleware
		r.Route("/api", func(api *Router) {
			api.Use(authMiddleware)
			api.Use(apiMiddleware)

			api.Get("/users", func(w http.ResponseWriter, r *http.Request) {
				log = append(log, "users-handler")
			})
		})

		// First test public endpoint
		log = []string{}
		req := httptest.NewRequest("GET", "/public", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, []string{"logging", "public-handler"}, log)

		// Then test API endpoint with additional middleware
		log = []string{}
		req = httptest.NewRequest("GET", "/api/users", nil)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, []string{"logging", "auth", "api", "users-handler"}, log)
	})

	t.Run("mount with path manipulations", func(t *testing.T) {
		r := NewRouter()
		subHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// The path should be relative to the mount point
			assert.Equal(t, "/users", r.URL.Path)
			w.WriteHeader(http.StatusOK)
		})

		err := r.Mount("/api", subHandler)
		assert.NoError(t, err)

		req := httptest.NewRequest("GET", "/api/users", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Result().StatusCode)
	})

	t.Run("error handling", func(t *testing.T) {
		r := NewRouter()

		// Test nil handler
		err := r.Mount("/test", nil)
		assert.Error(t, err)
		assert.Equal(t, ErrNilHandler, err)

		// Test empty path
		assert.Panics(t, func() {
			r.handle("GET", "", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
		})

		// Test empty mount path
		err = r.Mount("", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
		assert.Error(t, err)
		assert.Equal(t, ErrInvalidMount, err)
	})

	t.Run("router options", func(t *testing.T) {
		middlewareCalled := false
		middleware := func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				middlewareCalled = true
				next.ServeHTTP(w, r)
			})
		}

		notFoundCalled := false
		notFound := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			notFoundCalled = true
		})

		r := NewRouter(
			WithMiddleware(middleware),
			WithNotFound(notFound),
		)

		// Test middleware option
		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		r.Get("/test", func(w http.ResponseWriter, r *http.Request) {})
		r.ServeHTTP(w, req)
		assert.True(t, middlewareCalled)

		// Test not found option
		req = httptest.NewRequest("GET", "/notexist", nil)
		w = httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.True(t, notFoundCalled)
	})
}
