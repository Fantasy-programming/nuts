package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog"
)

// LocalProvider implements the Provider interface for local Ollama models
type LocalProvider struct {
	config     Config
	httpClient *http.Client
	logger     *zerolog.Logger
}

// NewLocalProvider creates a new local provider instance
func NewLocalProvider(config Config, logger *zerolog.Logger) *LocalProvider {
	return &LocalProvider{
		config: config,
		httpClient: &http.Client{
			Timeout: time.Duration(config.TimeoutSec) * time.Second,
		},
		logger: logger,
	}
}

// OllamaRequest represents the request structure for Ollama API
type OllamaRequest struct {
	Model       string  `json:"model"`
	Prompt      string  `json:"prompt"`
	Stream      bool    `json:"stream"`
	Options     Options `json:"options,omitempty"`
}

type Options struct {
	Temperature *float32 `json:"temperature,omitempty"`
	NumPredict  *int     `json:"num_predict,omitempty"`
}

// OllamaResponse represents the response from Ollama API
type OllamaResponse struct {
	Model              string    `json:"model"`
	CreatedAt          time.Time `json:"created_at"`
	Response           string    `json:"response"`
	Done               bool      `json:"done"`
	Context            []int     `json:"context,omitempty"`
	TotalDuration      int64     `json:"total_duration,omitempty"`
	LoadDuration       int64     `json:"load_duration,omitempty"`
	PromptEvalDuration int64     `json:"prompt_eval_duration,omitempty"`
	EvalCount          int       `json:"eval_count,omitempty"`
	EvalDuration       int64     `json:"eval_duration,omitempty"`
}

// GenerateCompletion sends a prompt to the local Ollama instance
func (p *LocalProvider) GenerateCompletion(ctx context.Context, prompt string) (string, error) {
	request := OllamaRequest{
		Model:  p.config.LocalModel,
		Prompt: prompt,
		Stream: false,
		Options: Options{
			Temperature: &p.config.Temperature,
			NumPredict:  &p.config.MaxTokens,
		},
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/api/generate", p.config.LocalEndpoint)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	p.logger.Debug().
		Str("model", p.config.LocalModel).
		Str("endpoint", url).
		Msg("Sending request to local LLM provider")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	p.logger.Debug().
		Str("model", response.Model).
		Int("eval_count", response.EvalCount).
		Int64("total_duration_ms", response.TotalDuration/1000000).
		Msg("Received response from local LLM provider")

	return response.Response, nil
}

// GetModelInfo returns information about the current local model
func (p *LocalProvider) GetModelInfo() ModelInfo {
	return ModelInfo{
		Name:     p.config.LocalModel,
		Provider: "ollama",
		Type:     "local",
	}
}