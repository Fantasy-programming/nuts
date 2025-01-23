package router

import (
	"net/http"
	"path"
	"slices"
	"strings"
	"sync"
)

type (
	Middleware   func(http.Handler) http.Handler
	RouterOption func(*Router)
)

type Route struct {
	Method string
	Path   string
}

type Router struct {
	notFound http.Handler
	*http.ServeMux
	routes      map[string]struct{}
	prefix      string
	middleware  []Middleware
	routesMutex sync.RWMutex
}

// Create a new router instance
func NewRouter(opts ...RouterOption) *Router {
	r := &Router{
		ServeMux:   http.NewServeMux(),
		middleware: make([]Middleware, 0),
		routes:     make(map[string]struct{}),
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

// Router option to create router with given top middleware
func WithMiddleware(mw ...Middleware) RouterOption {
	return func(r *Router) {
		r.middleware = append(r.middleware, mw...)
	}
}

// Add a middleware to the router stack
func (r *Router) Use(mx ...Middleware) {
	r.middleware = append(r.middleware, mx...)
}

func (r *Router) Group(fn func(r *Router)) {
	router := &Router{
		ServeMux:   r.ServeMux,
		middleware: slices.Clone(r.middleware),
		routes:     r.routes,
	}

	fn(router)
}

// Add a toplevel prefix
func (r *Router) Prefix(prefix string) {
	r.prefix = path.Clean(r.prefix + "/" + prefix)
}

// Create a subrouter
func (r *Router) Route(pathStr string, fn func(r *Router)) *Router {
	if pathStr == "" {
		panic("router: path cannot be empty")
	}

	subRouter := &Router{
		ServeMux:   r.ServeMux,
		prefix:     path.Join(r.prefix, pathStr),
		middleware: slices.Clone(r.middleware),
		routes:     r.routes,
	}

	fn(subRouter)
	return subRouter
}

func (r *Router) Mount(pathStr string, handler http.Handler) {
	if pathStr == "" {
		panic("router: mount path cannot be empty")
	}

	mountPath := path.Clean(path.Join(r.prefix, pathStr))

	// Ensure the path ends with a trailing slash if it's not root
	if mountPath != "/" {
		mountPath += "/"
	}

	wrappedHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		originalPath := req.URL.Path
		req.URL.Path = strings.TrimPrefix(req.URL.Path, mountPath)

		if !strings.HasPrefix(req.URL.Path, "/") {
			req.URL.Path = "/" + req.URL.Path
		}

		handler.ServeHTTP(w, req)
		req.URL.Path = originalPath
	})

	finalHandler := r.wrap(wrappedHandler, nil)

	// Register the handler for both the exact path and any paths underneath it
	r.Handle(mountPath, finalHandler)
	r.Handle(mountPath+"*", finalHandler)

	// If the mounted handler is a Router, copy its routes
	if subRouter, ok := handler.(*Router); ok {
		subRouter.routesMutex.RLock()
		defer subRouter.routesMutex.RUnlock()

		for route := range subRouter.routes {
			methodPath := strings.SplitN(route, " ", 2)
			if len(methodPath) != 2 {
				continue
			}
			method, routePath := methodPath[0], methodPath[1]
			fullPath := path.Join(mountPath, strings.TrimPrefix(routePath, "/"))
			r.addRoute(method, fullPath)

		}

	}
}

// Router Get Method
func (r *Router) Get(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodGet, path, fn, mx)
}

// Router Post method
func (r *Router) Post(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodPost, path, fn, mx)
}

// Router Put method
func (r *Router) Put(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodPut, path, fn, mx)
}

// Router Delete method
func (r *Router) Delete(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodDelete, path, fn, mx)
}

// Router Head method
func (r *Router) Head(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodHead, path, fn, mx)
}

// Router Options method
func (r *Router) Options(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodOptions, path, fn, mx)
}

// Router All method
func (r *Router) All(pathStr string, fn http.HandlerFunc, mx ...Middleware) {
	cleanPath := path.Clean(r.prefix + pathStr)
	r.Handle(cleanPath, r.wrap(fn, mx))
}

func (r *Router) handle(method, pathStr string, fn http.HandlerFunc, mx []Middleware) {
	cleanPath := path.Clean(r.prefix + pathStr)
	r.Handle(method+" "+cleanPath, r.wrap(fn, mx))
	r.addRoute(method, cleanPath)
}

func (r *Router) addRoute(method, path string) {
	r.routesMutex.Lock()
	defer r.routesMutex.Unlock()
	r.routes[method+" "+path] = struct{}{}
}

func (r *Router) ListRoutes() []string {
	r.routesMutex.RLock()
	defer r.routesMutex.RUnlock()

	routes := make([]string, 0, len(r.routes))
	for route := range r.routes {
		routes = append(routes, route)
	}
	return routes
}

func (r *Router) wrap(fn http.HandlerFunc, mw []Middleware) http.Handler {
	handler := http.Handler(fn)

	for i := len(mw) - 1; i >= 0; i-- {
		handler = mw[i](handler)
	}

	for i := len(r.middleware) - 1; i >= 0; i-- {
		handler = r.middleware[i](handler)
	}

	return handler
}

func (r *Router) NotFound(fn http.HandlerFunc) {
	r.notFound = fn
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	handler, pattern := r.ServeMux.Handler(req)

	if pattern == "" {
		if r.notFound != nil {
			r.notFound.ServeHTTP(w, req)
		} else {
			http.Error(w, "404 page not found", http.StatusNotFound)
		}
		return
	}

	finalHandler := handler

	for i := len(r.middleware) - 1; i >= 0; i-- {
		finalHandler = r.middleware[i](finalHandler)
	}

	finalHandler.ServeHTTP(w, req)
}
