package config

import "github.com/kelseyhightower/envconfig"

type Auth struct {
	SigningKey string `required:"true"`
	RefreshKey string `required:"true"`

	GoogleAuthEnabled  bool   `split_words:"true" required:"false" default:"false"`
	GoogleClientID     string `split_words:"true" required:"false"`
	GoogleClientSecret string `split_words:"true" required:"false"`
	GoogleCallbackURL  string `split_words:"true" required:"false"`
}

func AUTH() Auth {
	var auth Auth
	envconfig.MustProcess("AUTH", &auth)
	return auth
}
