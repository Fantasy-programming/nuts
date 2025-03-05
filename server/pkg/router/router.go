package router

import (
	"fmt"
	"net/http"
	"path"
	"reflect"
	"slices"
	"strings"
	"sync"
)

// Common errors that can occur during routing operations
var (
	ErrEmptyPath    = fmt.Errorf("router: path cannot be empty")
	ErrNilHandler   = fmt.Errorf("router: handler cannot be nil")
	ErrInvalidPath  = fmt.Errorf("router: path must start with /")
	ErrInvalidMount = fmt.Errorf("router: mount path must not be empty or whitespace")
)

// Middleware defines a function that wraps an http.Handler
type Middleware func(http.Handler) http.Handler

// RouterOption defines a function that configures a Router
type RouterOption func(*Router)

// Router represents an HTTP router with middleware support
// that leverages Go 1.22's enhanced ServeMux capabilities
type Router struct {
	mux        *http.ServeMux
	notFound   http.Handler
	prefix     string
	middleware []Middleware
	mu         sync.RWMutex
}

// NewRouter creates a new router instance with optional configuration
func NewRouter(opts ...RouterOption) *Router {
	r := &Router{
		mux:        http.NewServeMux(),
		middleware: make([]Middleware, 0, 10),
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

// WithMiddleware returns a RouterOption that adds middleware to the router
func WithMiddleware(mw ...Middleware) RouterOption {
	return func(r *Router) {
		r.middleware = append(r.middleware, mw...)
	}
}

// WithNotFound returns a RouterOption that sets the not found handler
func WithNotFound(handler http.Handler) RouterOption {
	return func(r *Router) {
		r.notFound = handler
	}
}

// Add a middleware to the router stack
func (r *Router) Use(mw ...Middleware) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.middleware = append(r.middleware, mw...)
}

// Group creates a new router group with the given middleware and prefix
func (r *Router) Group(fn func(r *Router)) {
	router := &Router{
		mux:        r.mux,
		notFound:   r.notFound,
		prefix:     r.prefix,
		middleware: slices.Clone(r.middleware),
	}

	fn(router)
}

// Add a prefix to the router
func (r *Router) Prefix(prefix string) {
	r.prefix = path.Clean(r.prefix + "/" + prefix)
}

// Create a subrouter
func (r *Router) Route(pathStr string, fn func(r *Router)) *Router {
	if pathStr == "" {
		panic("router: path cannot be empty")
	}

	subRouter := &Router{
		mux:        r.mux,
		prefix:     path.Join(r.prefix, pathStr),
		middleware: slices.Clone(r.middleware),
	}

	fn(subRouter)
	return subRouter
}

func (r *Router) Mount(pathStr string, handler http.Handler) error {
	if handler == nil {
		return ErrNilHandler
	}

	if strings.TrimSpace(pathStr) == "" {
		return ErrInvalidMount
	}

	// Ensure the path starts with /
	if pathStr[0] != '/' {
		pathStr = "/" + pathStr
	}

	mountPath := path.Clean(path.Join(r.prefix, pathStr))

	// Ensure the path ends with a trailing slash if it's not root
	if mountPath != "/" {
		mountPath += "/"
	}

	// Create a wrapper that adjusts the request path before passing to the handler
	wrappedHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		// Save original path
		originalPath := req.URL.Path

		// Strip the mount path prefix from the request path
		req.URL.Path = strings.TrimPrefix(req.URL.Path, mountPath)

		// Ensure the modified path starts with a slash
		if !strings.HasPrefix(req.URL.Path, "/") {
			req.URL.Path = "/" + req.URL.Path
		}

		// Call the handler with the modified path
		handler.ServeHTTP(w, req)

		// Restore original path
		req.URL.Path = originalPath
	})

	// Apply middleware to the wrapped handler
	finalHandler := r.wrap(wrappedHandler)

	// Register the handler for both exact path and wildcard pattern
	r.mux.Handle(mountPath, finalHandler)
	r.mux.Handle(mountPath+"*", finalHandler)

	return nil
}

// Router Get Method
func (r *Router) Get(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodGet, path, fn)
}

// Router Post method
func (r *Router) Post(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodPost, path, fn)
}

// Router Put method
func (r *Router) Put(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodPut, path, fn)
}

// Router Delete method
func (r *Router) Delete(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodDelete, path, fn)
}

// Router Head method
func (r *Router) Head(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodHead, path, fn)
}

// Router Options method
func (r *Router) Options(path string, fn http.HandlerFunc) error {
	return r.handle(http.MethodOptions, path, fn)
}

func (r *Router) handle(method, path string, handler http.HandlerFunc) error {
	if path == "" {
		panic(ErrEmptyPath)
	}

	// Ensure path starts with /
	if path[0] != '/' {
		path = "/" + path
	}

	// Use Go 1.22's method-specific pattern
	pattern := method + " " + r.prefix + path
	r.mux.Handle(pattern, r.wrap(handler))
	return nil
}

func (r *Router) ListRoutes() {
	// Get the value of the internal mux
	muxValue := reflect.ValueOf(r.mux).Elem()

	// Access the patterns slice
	patternsValue := muxValue.FieldByName("patterns")
	if !patternsValue.IsValid() {
		fmt.Println("Could not access patterns")
		return
	}

	// Iterate through the patterns slice
	for i := 0; i < patternsValue.Len(); i++ {
		pattern := patternsValue.Index(i).Elem()

		// Get the original pattern string
		str := pattern.FieldByName("str").String()

		fmt.Printf("Route: %s\n", str)

	}
}

func (r *Router) wrap(handler http.Handler) http.Handler {
	r.mu.RLock()
	defer r.mu.RUnlock()

	h := handler

	for i := len(r.middleware) - 1; i >= 0; i-- {
		h = r.middleware[i](h)
	}

	return h
}

func (r *Router) NotFound(fn http.HandlerFunc) {
	r.notFound = fn
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {

	handler, pattern := r.mux.Handler(req)
	if pattern == "" {
		r.handleNotFound(w, req)
		return
	}

	handler.ServeHTTP(w, req)
}

func (r *Router) handleNotFound(w http.ResponseWriter, req *http.Request) {
	if r.notFound != nil {
		r.notFound.ServeHTTP(w, req)
		return
	}
	http.Error(w, "404 page not found", http.StatusNotFound)
}
