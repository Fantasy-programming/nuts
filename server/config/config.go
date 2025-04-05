package config

type Config struct {
	Auth
	Cors
	Api
	DB
	Storage
}

func New() *Config {
	return &Config{
		Auth:         AUTH(),
		Cors:         NewCors(),
		Api:          API(),
		Storage:      NewStorage(),
		DB:           DataStore(),
	}
}
