package llm

import (
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	// Provider type: "local" or "remote"
	Provider string `required:"false" default:"local"`
	
	// Local provider settings (Ollama)
	LocalModel    string `required:"false" split_words:"true" default:"gemma2:2b"`
	LocalEndpoint string `required:"false" split_words:"true" default:"http://localhost:11434"`
	
	// Remote provider settings
	RemoteProvider string `required:"false" split_words:"true" default:"gemini"`
	RemoteAPIKey   string `required:"false" split_words:"true"`
	RemoteModel    string `required:"false" split_words:"true" default:"gemini-1.5-flash"`
	
	// General settings
	MaxTokens     int     `required:"false" split_words:"true" default:"1000"`
	Temperature   float32 `required:"false" default:"0.1"`
	TimeoutSec    int     `required:"false" split_words:"true" default:"30"`
}

func NewConfig() Config {
	var cfg Config
	envconfig.MustProcess("LLM", &cfg)
	return cfg
}