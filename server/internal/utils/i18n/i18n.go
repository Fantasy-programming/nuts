package i18n

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

// I18n is a wrapper around github.com/nicksnyder/go-i18n
type I18n struct {
	bundle       *i18n.Bundle
	localizers   map[string]*i18n.Localizer
	defaultLang  string
	localizerMux sync.RWMutex
}

// Config holds configuration for i18n initialization
type Config struct {
	DefaultLanguage string
	LocalesDir      string
}

// New creates a new i18n instance
func New(config Config) (*I18n, error) {
	if config.DefaultLanguage == "" {
		config.DefaultLanguage = "en"
	}

	bundle := i18n.NewBundle(language.Make(config.DefaultLanguage))
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

	i := &I18n{
		bundle:      bundle,
		localizers:  make(map[string]*i18n.Localizer),
		defaultLang: config.DefaultLanguage,
	}

	// Load translation files from locales directory
	if config.LocalesDir != "" {
		err := i.loadTranslationFiles(config.LocalesDir)
		if err != nil {
			return nil, err
		}
	}

	return i, nil
}

// loadTranslationFiles loads all translation files from the given directory
func (i *I18n) loadTranslationFiles(dir string) error {
	return filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		// Only process JSON or TOML files
		ext := strings.ToLower(filepath.Ext(path))
		if ext != ".json" {
			return nil
		}

		// Load the translation file
		_, err = i.bundle.LoadMessageFile(path)
		if err != nil {
			return fmt.Errorf("failed to load message file %s: %w", path, err)
		}

		return nil
	})
}

// GetLocalizer returns a localizer for the given language
func (i *I18n) GetLocalizer(lang string) *i18n.Localizer {
	if lang == "" {
		lang = i.defaultLang
	}

	// Normalize language code (e.g., "en-US" -> "en")
	langParts := strings.Split(lang, "-")
	normalizedLang := langParts[0]

	i.localizerMux.RLock()
	l, exists := i.localizers[normalizedLang]
	i.localizerMux.RUnlock()

	if exists {
		return l
	}

	i.localizerMux.Lock()
	defer i.localizerMux.Unlock()

	// Check again in case another goroutine created the localizer while we were waiting
	if l, exists := i.localizers[normalizedLang]; exists {
		return l
	}

	// Create a new localizer for this language
	l = i18n.NewLocalizer(i.bundle, normalizedLang, i.defaultLang)
	i.localizers[normalizedLang] = l

	return l
}

// T translates a message using a language, message ID, and optional template data
func (i *I18n) T(lang, messageID string, templateData map[string]any) string {
	localizer := i.GetLocalizer(lang)
	msg, err := localizer.Localize(&i18n.LocalizeConfig{
		MessageID:    messageID,
		TemplateData: templateData,
	})
	if err != nil {
		// If translation fails, return the messageID as a fallback
		return messageID
	}

	return msg
}
