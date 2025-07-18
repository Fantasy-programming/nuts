package router

import (
	"fmt"
	"net/http"
	"net/url"
	"reflect"
	"strings"
)

var _ Router = &Mux{}

type Mux struct {
	mux         *http.ServeMux
	notFound    http.Handler
	prefix      string
	middlewares []func(http.Handler) http.Handler
}

func NewMux() *Mux {
	mux := &Mux{mux: http.NewServeMux()}
	return mux
}

func (mx *Mux) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_, pattern := mx.mux.Handler(r)

	if pattern == "" {
		mx.handleNotFound(w, r)
		return
	}

	mx.mux.ServeHTTP(w, r)
}

func (mx *Mux) mwsHandler(pattern string, h http.Handler) http.Handler {
	h2 := mwWildcards(pattern, h)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		chain(mx.middlewares, h2).ServeHTTP(w, r)
	})
}

func mwWildcards(pattern string, next http.Handler) http.Handler {
	wilds := uniWildcards(pattern)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		wcs := wildcardsFromContext(ctx)
		for _, ws := range wilds {
			wcs[ws] = r.PathValue(ws)
		}
		ctx = withWildcards(ctx, wcs)
		r = r.WithContext(ctx)
		for k, v := range wcs {
			r.SetPathValue(k, v)
		}
		next.ServeHTTP(w, r)
	})
}

// Use appends a middleware handler to the Mux middleware stack.
//
// The middleware stack for any Mux will execute before searching for a matching
// route to a specific handler, which provides opportunity to respond early,
// change the course of the request execution, or set request-scoped values for
// the next http.Handler.
func (mx *Mux) Use(middlewares ...func(http.Handler) http.Handler) {
	mx.middlewares = append(mx.middlewares, middlewares...)
}

// Handle adds the route `pattern` that matches any http method to
// execute the `handler` http.Handler.
func (mx *Mux) Handle(pattern string, handler http.Handler) {
	parts := strings.SplitN(pattern, " ", 2)
	if len(parts) == 2 {
		mx.Method(parts[0], parts[1], handler)
		return
	}

	mx.handle(mALL, pattern, handler)
}

// HandleFunc adds the route `pattern` that matches any http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) HandleFunc(pattern string, handlerFn http.HandlerFunc) {
	parts := strings.SplitN(pattern, " ", 2)
	if len(parts) == 2 {
		mx.Method(parts[0], parts[1], handlerFn)
		return
	}

	mx.handle(mALL, pattern, handlerFn)
}

// Method adds the route `pattern` that matches `method` http method to
// execute the `handler` http.Handler.
func (mx *Mux) Method(method, pattern string, handler http.Handler) {
	m, ok := methodMap[strings.ToUpper(method)]
	if !ok {
		panic(fmt.Sprintf("router: '%s' http method is not supported.", method))
	}
	mx.handle(m, pattern, handler)
}

// MethodFunc adds the route `pattern` that matches `method` http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) MethodFunc(method, pattern string, handlerFn http.HandlerFunc) {
	mx.Method(method, pattern, handlerFn)
}

// Connect adds the route `pattern` that matches a CONNECT http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Connect(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mCONNECT, pattern, handlerFn)
}

// Delete adds the route `pattern` that matches a DELETE http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Delete(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mDELETE, pattern, handlerFn)
}

// Get adds the route `pattern` that matches a GET http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Get(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mGET, pattern, handlerFn)
}

// Head adds the route `pattern` that matches a HEAD http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Head(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mHEAD, pattern, handlerFn)
}

// Options adds the route `pattern` that matches an OPTIONS http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Options(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mOPTIONS, pattern, handlerFn)
}

// Patch adds the route `pattern` that matches a PATCH http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Patch(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mPATCH, pattern, handlerFn)
}

// Post adds the route `pattern` that matches a POST http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Post(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mPOST, pattern, handlerFn)
}

// Put adds the route `pattern` that matches a PUT http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Put(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mPUT, pattern, handlerFn)
}

// Trace adds the route `pattern` that matches a TRACE http method to
// execute the `handlerFn` http.HandlerFunc.
func (mx *Mux) Trace(pattern string, handlerFn http.HandlerFunc) {
	mx.handle(mTRACE, pattern, handlerFn)
}

// With adds inline middlewares for an endpoint handler.
func (mx *Mux) With(middlewares ...func(http.Handler) http.Handler) Router {
	mws := append(mx.middlewares, middlewares...)

	im := &Mux{
		mux:         mx.mux,
		middlewares: mws,
	}

	return im
}

// Group creates a new inline-Mux with a copy of middleware stack. It's useful
// for a group of handlers along the same routing path that use an additional
// set of middlewares. See _examples/.
func (mx *Mux) Group(fn func(r Router)) Router {
	im := mx.With()
	if fn != nil {
		fn(im)
	}
	return im
}

// Route creates a new Mux and mounts it along the `pattern` as a subrouter.
// Effectively, this is a short-hand call to Mount. See _examples/.
func (mx *Mux) Route(pattern string, fn func(r Router)) Router {
	if fn == nil {
		panic(fmt.Sprintf("router: attempting to Route() a nil subrouter on '%s'", pattern))
	}
	subRouter := NewRouter()
	fn(subRouter)
	mx.Mount(pattern, subRouter)
	return subRouter
}

// Mount attaches another http.Handler as a subrouter along a routing
// path. It's very useful to split up a large API as many independent routers and
// compose them as a single service using Mount.
//
// Note that Mount() simply sets a wildcard along the `pattern` that will continue
// routing at the `handler`, which in most cases is another stdchi.Router. As a result,
// if you define two Mount() routes on the exact same pattern the mount will panic.
func (mx *Mux) Mount(pattern string, handler http.Handler) {
	if handler == nil {
		panic(fmt.Sprintf("router: attempting to Mount() a nil handler on '%s'", pattern))
	}

	// For http.ServeMux, patterns ending in '/' match subpaths.
	// This router's Mount implies matching the prefix and all subpaths.
	mountPattern := pattern
	if mountPattern == "" || (mountPattern[len(mountPattern)-1] != '/' && !strings.HasSuffix(mountPattern, "...}")) {
		mountPattern += "/"
	}

	// Calculate the full prefix that needs to be stripped from the request path
	// before it's passed to the mounted handler.
	// This accounts for the current Mux's own prefix as well.
	fullStripPrefix := mx.prefix + strings.TrimSuffix(mountPattern, "/")

	// Create a handler that strips the `fullStripPrefix` from the request URL's Path and RawPath
	// before serving the original handler. This is essential for sub-routers.
	strippedHandler := http.StripPrefix(fullStripPrefix, handler)

	// Register this stripped handler with the Mux's internal router.
	// The `handle` method will ensure it's registered for all necessary HTTP methods.
	mx.handle(mALL, mountPattern, strippedHandler)
}

func (mx *Mux) Prefix(prefix string) *Mux {
	// Normalize the prefix
	if prefix == "" {
		return mx
	}

	// Ensure prefix starts with a slash and doesn't end with a slash
	if !strings.HasPrefix(prefix, "/") {
		prefix = "/" + prefix
	}
	mx.prefix = strings.TrimSuffix(prefix, "/")
	return mx
}

func (r *Mux) handleNotFound(w http.ResponseWriter, req *http.Request) {
	if r.notFound != nil {
		r.notFound.ServeHTTP(w, req)
		return
	}
	http.Error(w, "404 page not found", http.StatusNotFound)
}

// StripSegments works like http.StripPrefix, but skips entire segments (including wildcards) and provides path values ​​to subrouters.
func StripSegments(prefix string, pat string, h http.Handler) http.Handler {
	wilds := wildcards(pat)

	if len(wilds) == 0 {
		return h
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var p string
		var rp string

		if prefix != "" {
			p = strings.TrimPrefix(r.URL.Path, prefix)
			rp = strings.TrimPrefix(r.URL.Path, prefix)
		}

		p = stripToLastSlash(p, len(wilds))
		rp = stripToLastSlash(rp, len(wilds))
		if len(p) < len(r.URL.Path) && (r.URL.RawPath == "" || len(rp) < len(r.URL.RawPath)) {
			r2 := new(http.Request)
			*r2 = *r
			r2.URL = new(url.URL)
			*r2.URL = *r.URL
			r2.URL.Path = p
			r2.URL.RawPath = rp

			ctx := r.Context()
			wcs := wildcardsFromContext(ctx)
			for _, ws := range wilds {
				if ws == "" {
					continue
				}
				wcs[ws] = r.PathValue(ws)
			}
			ctx = withWildcards(ctx, wcs)
			r2 = r2.WithContext(ctx)

			h.ServeHTTP(w, r2)
		} else {
			h.ServeHTTP(w, r)
		}
	})
}

// Middlewares returns a slice of middleware handler functions.
func (mx *Mux) Middlewares() Middlewares {
	return mx.middlewares
}

func (mx *Mux) NotFound(handler http.HandlerFunc) {
	mx.notFound = handler
}

func (mx *Mux) ListRoutes() {
	// Get the value of the internal mux
	muxValue := reflect.ValueOf(mx.mux).Elem()

	// Access the patterns slice
	patternsValue := muxValue.FieldByName("patterns")
	if !patternsValue.IsValid() {
		fmt.Println("Could not access patterns")
		return
	}

	// Iterate through the patterns slice
	for i := range patternsValue.Len() {
		pattern := patternsValue.Index(i).Elem()

		// Get the original pattern string
		str := pattern.FieldByName("str").String()

		fmt.Printf("Route: %s\n", str)

	}
}

// handle registers a http.Handler in the routing tree for a particular http method
// and routing pattern.
func (mx *Mux) handle(method methodTyp, pattern string, handler http.Handler) {
	fullPattern := pattern
	if mx.prefix != "" {
		fullPattern = mx.prefix + pattern
	}

	if len(fullPattern) == 0 || fullPattern[0] != '/' {
		panic(fmt.Sprintf("router: routing pattern must begin with '/' in '%s'", fullPattern))
	}

	// Always iterate through all supported methods and register the handler for each.
	// This ensures http.ServeMux correctly handles patterns with wildcards
	// and populates r.PathValue for all registered routes.
	for k, v := range methodMap {
		if method&v == v { // Check if the current method `v` is included in the `method` bitmask
			p := fmt.Sprintf("%s %s", k, fullPattern)
			mx.mux.Handle(p, mx.mwsHandler(fullPattern, handler))
		}
	}
}
