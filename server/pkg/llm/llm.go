package llm

import (
	"fmt"

	"github.com/rs/zerolog"
)

// NewService creates a new neural input service with the given configuration
func NewService(config Config, logger *zerolog.Logger) (Service, error) {
	// Validate configuration
	if err := validateConfig(config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	service, err := NewNeuralInputService(config, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create neural input service: %w", err)
	}

	return service, nil
}

// validateConfig validates the LLM configuration
func validateConfig(config Config) error {
	switch config.Provider {
	case "local":
		if config.LocalEndpoint == "" {
			return fmt.Errorf("local endpoint is required for local provider")
		}
		if config.LocalModel == "" {
			return fmt.Errorf("local model is required for local provider")
		}
	case "remote":
		if config.RemoteProvider == "" {
			return fmt.Errorf("remote provider is required for remote provider")
		}
		if config.RemoteAPIKey == "" {
			return fmt.Errorf("remote API key is required for remote provider")
		}
		if config.RemoteModel == "" {
			return fmt.Errorf("remote model is required for remote provider")
		}
	default:
		return fmt.Errorf("unsupported provider type: %s (must be 'local' or 'remote')", config.Provider)
	}

	if config.MaxTokens <= 0 {
		return fmt.Errorf("max tokens must be positive")
	}

	if config.Temperature < 0.0 || config.Temperature > 2.0 {
		return fmt.Errorf("temperature must be between 0.0 and 2.0")
	}

	if config.TimeoutSec <= 0 {
		return fmt.Errorf("timeout must be positive")
	}

	return nil
}