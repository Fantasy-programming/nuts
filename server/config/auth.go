package config

import "github.com/kelseyhightower/envconfig"

type Auth struct {
	SigningKey string `required:"true"`
	RefreshKey string `required:"true"`
}

func AUTH() Auth {
	var auth Auth
	envconfig.MustProcess("AUTH", &auth)
	return auth
}
