package router

import (
	"fmt"
	"net/http"
	p "path"
	"slices"
	"strings"
)

type Middleware func(http.Handler) http.Handler

type RouterOption func(*Router)

type Router struct {
	notFound http.Handler
	*http.ServeMux
	toplevel   string
	middleware []Middleware
	routes     []string
}

func NewRouter(opts ...RouterOption) *Router {
	r := &Router{
		ServeMux:   http.NewServeMux(),
		middleware: make([]Middleware, 0),
		routes:     make([]string, 0),
	}

	for _, opt := range opts {
		opt(r)
	}

	return r
}

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
func (r *Router) Prefix(pathStr string) {
	r.toplevel = p.Join(r.toplevel, pathStr)
}

func (r *Router) Route(pathStr string, fn func(r *Router)) *Router {
	if pathStr == "" {
		panic("router: path cannot be empty")
	}

	route := &Router{
		ServeMux:   r.ServeMux,
		toplevel:   p.Join(r.toplevel, pathStr),
		middleware: slices.Clone(r.middleware),
		routes:     r.routes, // Inherit the routes
	}

	fn(route)
	return route
}

func (r *Router) Mount(pathStr string, handler http.Handler) {
	if pathStr == "" {
		panic("router: mount path cannot be empty")
	}

	// Clean and join the path with toplevel
	mountPath := p.Clean(p.Join(r.toplevel, pathStr))

	// Ensure the path ends with a trailing slash if it's not root
	if mountPath != "/" {
		mountPath += "/"
	}

	wrappedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		originalPath := r.URL.Path

		r.URL.Path = strings.TrimPrefix(r.URL.Path, mountPath)
		if !strings.HasPrefix(r.URL.Path, "/") {
			r.URL.Path = "/" + r.URL.Path
		}

		handler.ServeHTTP(w, r)

		// Restore original path
		r.URL.Path = originalPath
	})

	// Apply middleware to the wrapped handler
	finalHandler := r.wrap(wrappedHandler.ServeHTTP, nil)

	// Register the handler for both the exact path and any paths underneath it
	r.Handle(mountPath, finalHandler)
	r.Handle(mountPath+"*", finalHandler)

	// If the mounted handler is a Router, copy its routes
	if subRouter, ok := handler.(*Router); ok {
		subRoutes := subRouter.ListRoutes()
		for _, route := range subRoutes {
			// Split the route into method and path
			parts := strings.SplitN(route, " ", 2)
			if len(parts) != 2 {
				continue
			}
			method, routePath := parts[0], parts[1]

			// Join the mount path with the subroute path
			// Remove the leading slash from routePath to avoid double slashes
			routePath = strings.TrimPrefix(routePath, "/")
			fullPath := p.Join(mountPath, routePath)

			// Add the combined route to the parent router's routes
			r.routes = append(r.routes, fmt.Sprintf("%s %s", method, fullPath))
		}
	}
}

func (r *Router) Get(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodGet, path, fn, mx)
}

func (r *Router) Post(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodPost, path, fn, mx)
}

func (r *Router) Put(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodPut, path, fn, mx)
}

func (r *Router) Delete(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodDelete, path, fn, mx)
}

func (r *Router) Head(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodHead, path, fn, mx)
}

func (r *Router) Options(path string, fn http.HandlerFunc, mx ...Middleware) {
	r.handle(http.MethodOptions, path, fn, mx)
}

func (r *Router) All(path string, fn http.HandlerFunc, mx ...Middleware) {
	p := p.Clean(r.toplevel + path)
	r.Handle(p, r.wrap(fn, mx))
}

func (r *Router) handle(method, path string, fn http.HandlerFunc, mx []Middleware) {
	p := p.Clean(r.toplevel + path)

	r.Handle(method+" "+p, r.wrap(fn, mx))
	r.routes = append(r.routes, method+" "+p)
}

func (r *Router) ListRoutes() []string {
	return slices.Clone(r.routes)
}

func (r *Router) wrap(fn http.HandlerFunc, mx []Middleware) (out http.Handler) {
	out, mx = http.Handler(fn), append(slices.Clone(r.middleware), mx...)

	slices.Reverse(mx)

	for _, m := range mx {
		out = m(out)
	}

	return
}

func (r *Router) NotFound(fn http.HandlerFunc) {
	r.All("/", fn)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	handler := r.ServeMux

	if handler == nil {
		handler = http.DefaultServeMux
	}

	finalHandler := http.Handler(handler)
	middlewareCopy := slices.Clone(r.middleware)
	slices.Reverse(middlewareCopy)

	for _, m := range middlewareCopy {
		finalHandler = m(finalHandler)
	}

	finalHandler.ServeHTTP(w, req)
}
