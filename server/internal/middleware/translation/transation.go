package translation

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/Fantasy-Programming/nuts/lib/validation"
	ut "github.com/go-playground/universal-translator"
)

func I18nMiddleware(v *validation.Validator, langFunc func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			trans := GetTranslator(r, v, langFunc)
			ctx := context.WithValue(r.Context(), "translator", trans)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetTranslator(r *http.Request, v *validation.Validator, langFunc func(*http.Request) string) ut.Translator {
	// Try from user preferences first
	lang := r.Header.Get("Accept-Language")

	if lang == "" && langFunc != nil {
		// Check user preferences from database/session
		lang = langFunc(r)
	}

	if lang != "" {
		// For example, if lang == "en-US,en;q=0.5", split by comma and take the first segment.
		parts := strings.Split(lang, ",")

		if len(parts) > 0 {
			lang = strings.TrimSpace(parts[0])
		}

		// Optionally, normalize to two-letter language code
		if len(lang) > 2 {
			lang = lang[:2]
		}
	}

	trans, err := v.GetTranslator(lang)
	if err != nil {
		log.Printf("Translation fallback: %v", err)
	}
	return trans
}
