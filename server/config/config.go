package config

type Config struct {
	Auth
	Cors
	Api
	Database
}

func New() *Config {
	return &Config{
		Auth:     AUTH(),
		Cors:     NewCors(),
		Api:      API(),
		Database: DataStore(),
	}
}
