package i18n

import (
	"context"
	"net/http"
	"strings"
)

type I18Key string

const (
	// I18nContextKey is the key used to store the i18n translator in the context
	I18nContextKey I18Key = "i18n"
	// LangContextKey is the key used to store the current language in the context
	LangContextKey I18Key = "lang"
)

func I18nMiddleware(i18n *I18n, languageExtractor func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get language from custom extractor if provided
			lang := ""

			if languageExtractor != nil {
				lang = languageExtractor(r)
			}

			// If no language from extractor, try from Accept-Language header
			if lang == "" {
				lang = extractLanguageFromHeader(r)
			}

			// Store i18n and language in the context
			ctx := context.WithValue(r.Context(), I18nContextKey, i18n)
			ctx = context.WithValue(ctx, LangContextKey, lang)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extractLanguageFromHeader extracts the language from Accept-Language header
func extractLanguageFromHeader(r *http.Request) string {
	lang := r.Header.Get("Accept-Language")

	if lang == "" {
		return ""
	}

	// Extract the primary language tag (e.g., "en-US,en;q=0.9" -> "en")
	parts := strings.Split(lang, ",")

	if len(parts) > 0 {
		primary := parts[0]
		subParts := strings.Split(primary, ";")
		lang = subParts[0]

		// Strip region code if present (e.g., "en-US" -> "en")
		if dashIndex := strings.Index(lang, "-"); dashIndex > 0 {
			lang = lang[:dashIndex]
		}
	}

	return lang
}

// FromContext retrieves the i18n instance from the request context
func FromContext(ctx context.Context) (*I18n, string) {
	i18nInstance, _ := ctx.Value(I18nContextKey).(*I18n)
	lang, _ := ctx.Value(LangContextKey).(string)
	return i18nInstance, lang
}

// T translates a message using i18n instance from context
func T(ctx context.Context, messageID string, templateData map[string]interface{}) string {
	i18nInstance, lang := FromContext(ctx)

	if i18nInstance == nil {
		return messageID
	}
	return i18nInstance.T(lang, messageID, templateData)
}
