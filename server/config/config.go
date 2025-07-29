package config

import "github.com/Fantasy-Programming/nuts/server/pkg/llm"

type Config struct {
	Auth
	Cors
	Api
	DB
	Storage
	Cache
	Integrations
	SMTP
	LLM llm.Config
	Otel
}

func New() *Config {
	return &Config{
		Auth:         AUTH(),
		Cors:         NewCors(),
		Api:          API(),
		Storage:      NewStorage(),
		Cache:        NewCache(),
		DB:           DataStore(),
		Integrations: INTEGRATIONS(),
		SMTP:         NewSMTP(),
		LLM:          llm.NewConfig(),
		Otel:         OTEL(),
	}
}
