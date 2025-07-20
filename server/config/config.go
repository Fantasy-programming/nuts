package config

type Config struct {
	Auth
	Cors
	Api
	DB
	Storage
	Cache
	Integrations
	SMTP
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
	}
}
