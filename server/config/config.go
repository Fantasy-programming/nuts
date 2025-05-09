package config

type Config struct {
	Auth
	Cors
	Api
	DB
	Storage
	Integrations
}

func New() *Config {
	return &Config{
		Auth:         AUTH(),
		Cors:         NewCors(),
		Api:          API(),
		Storage:      NewStorage(),
		DB:           DataStore(),
		Integrations: INTEGRATIONS(),
	}
}
