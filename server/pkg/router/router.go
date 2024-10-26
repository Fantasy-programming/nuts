package router

import (
	"fmt"
	"net/http"
	"path"
	p "path"
	"slices"
	"strings"
)

type Middleware func(http.Handler) http.Handler

type Router struct {
	*http.ServeMux
	toplevel   string
	middleware []Middleware
	routes     []string
	notFound   http.Handler
}

func NewRouter(mx ...Middleware) *Router {
	return &Router{
		ServeMux:   &http.ServeMux{},
		middleware: mx,
		toplevel:   "",
		routes:     []string{},
	}
}

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

func (r *Router) Route(pathStr string, fn func(r *Router)) *Router {
	route := &Router{
		ServeMux:   r.ServeMux,
		toplevel:   path.Join(r.toplevel, pathStr),
		middleware: slices.Clone(r.middleware),
		routes:     r.routes, // Inherit the routes
	}

	fn(route)
	return route
}

func (r *Router) Mount(pathStr string, handler http.Handler) {
	// Clean and join the path with toplevel
	mountPath := path.Clean(path.Join(r.toplevel, pathStr))

	// Ensure the path ends with a trailing slash if it's not root
	if mountPath != "/" {
		mountPath += "/"
	}

	// Create a wrapper handler that will:
	// 1. Strip the prefix
	// 2. Apply middleware
	// 3. Handle both the exact path and paths underneath it
	wrappedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip the mount path prefix from the request URL path
		r.URL.Path = strings.TrimPrefix(r.URL.Path, mountPath)

		// Ensure the stripped path starts with a slash
		if !strings.HasPrefix(r.URL.Path, "/") {
			r.URL.Path = "/" + r.URL.Path
		}

		handler.ServeHTTP(w, r)
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
			fullPath := path.Join(mountPath, routePath)

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
	handler := http.Handler(r.ServeMux) // Default ServeMux handler

	// Apply all middleware defined through Use
	slices.Reverse(r.middleware)
	for _, m := range r.middleware {
		handler = m(handler)
	}

	// Call the handler
	handler.ServeHTTP(w, req)
}
