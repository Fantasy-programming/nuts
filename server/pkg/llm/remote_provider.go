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

// RemoteProvider implements the Provider interface for remote LLM services
type RemoteProvider struct {
	config     Config
	httpClient *http.Client
	logger     *zerolog.Logger
}

// NewRemoteProvider creates a new remote provider instance
func NewRemoteProvider(config Config, logger *zerolog.Logger) *RemoteProvider {
	return &RemoteProvider{
		config: config,
		httpClient: &http.Client{
			Timeout: time.Duration(config.TimeoutSec) * time.Second,
		},
		logger: logger,
	}
}

// GeminiRequest represents the request structure for Google Gemini API
type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
	GenerationConfig GeminiGenerationConfig `json:"generationConfig"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiGenerationConfig struct {
	Temperature   float32 `json:"temperature,omitempty"`
	MaxOutputTokens int   `json:"maxOutputTokens,omitempty"`
}

// GeminiResponse represents the response from Gemini API
type GeminiResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
}

type GeminiCandidate struct {
	Content GeminiContent `json:"content"`
}

// OpenAIRequest represents the request structure for OpenAI-compatible APIs
type OpenAIRequest struct {
	Model       string           `json:"model"`
	Messages    []OpenAIMessage  `json:"messages"`
	Temperature float32          `json:"temperature,omitempty"`
	MaxTokens   int              `json:"max_tokens,omitempty"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIResponse represents the response from OpenAI-compatible APIs
type OpenAIResponse struct {
	Choices []OpenAIChoice `json:"choices"`
	Model   string         `json:"model"`
	Usage   OpenAIUsage    `json:"usage,omitempty"`
}

type OpenAIChoice struct {
	Message OpenAIMessage `json:"message"`
}

type OpenAIUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// GenerateCompletion sends a prompt to the configured remote provider
func (p *RemoteProvider) GenerateCompletion(ctx context.Context, prompt string) (string, error) {
	switch p.config.RemoteProvider {
	case "gemini":
		return p.generateGeminiCompletion(ctx, prompt)
	case "openai", "claude", "openrouter":
		return p.generateOpenAICompatibleCompletion(ctx, prompt)
	default:
		return "", fmt.Errorf("unsupported remote provider: %s", p.config.RemoteProvider)
	}
}

// generateGeminiCompletion handles Gemini API requests
func (p *RemoteProvider) generateGeminiCompletion(ctx context.Context, prompt string) (string, error) {
	request := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: prompt},
				},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			Temperature:     p.config.Temperature,
			MaxOutputTokens: p.config.MaxTokens,
		},
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal gemini request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", 
		p.config.RemoteModel, p.config.RemoteAPIKey)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create gemini request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	p.logger.Debug().
		Str("provider", "gemini").
		Str("model", p.config.RemoteModel).
		Msg("Sending request to Gemini API")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send gemini request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini API returned status code: %d", resp.StatusCode)
	}

	var response GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode gemini response: %w", err)
	}

	if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content in gemini response")
	}

	return response.Candidates[0].Content.Parts[0].Text, nil
}

// generateOpenAICompatibleCompletion handles OpenAI-compatible API requests
func (p *RemoteProvider) generateOpenAICompatibleCompletion(ctx context.Context, prompt string) (string, error) {
	request := OpenAIRequest{
		Model: p.config.RemoteModel,
		Messages: []OpenAIMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: p.config.Temperature,
		MaxTokens:   p.config.MaxTokens,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal openai request: %w", err)
	}

	var url string
	switch p.config.RemoteProvider {
	case "openai":
		url = "https://api.openai.com/v1/chat/completions"
	case "claude":
		url = "https://api.anthropic.com/v1/messages"
	case "openrouter":
		url = "https://openrouter.ai/api/v1/chat/completions"
	default:
		return "", fmt.Errorf("unknown provider for OpenAI-compatible API: %s", p.config.RemoteProvider)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	
	// Set appropriate authorization header based on provider
	switch p.config.RemoteProvider {
	case "openai", "openrouter":
		req.Header.Set("Authorization", "Bearer "+p.config.RemoteAPIKey)
	case "claude":
		req.Header.Set("x-api-key", p.config.RemoteAPIKey)
		req.Header.Set("anthropic-version", "2023-06-01")
	}

	p.logger.Debug().
		Str("provider", p.config.RemoteProvider).
		Str("model", p.config.RemoteModel).
		Str("url", url).
		Msg("Sending request to remote LLM provider")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s API returned status code: %d", p.config.RemoteProvider, resp.StatusCode)
	}

	var response OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode %s response: %w", p.config.RemoteProvider, err)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no choices in %s response", p.config.RemoteProvider)
	}

	return response.Choices[0].Message.Content, nil
}

// GetModelInfo returns information about the current remote model
func (p *RemoteProvider) GetModelInfo() ModelInfo {
	return ModelInfo{
		Name:     p.config.RemoteModel,
		Provider: p.config.RemoteProvider,
		Type:     "remote",
	}
}