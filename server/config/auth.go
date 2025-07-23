package config

import "github.com/kelseyhightower/envconfig"

type Auth struct {
	SigningKey string `required:"true"`
	RefreshKey string `required:"true"`

	RedirectSecure string `split_words:"true" required:"false" default:"http://localhost:5173/dashboard"`

	GoogleAuthEnabled  bool   `split_words:"true" required:"false" default:"false"`
	GoogleClientID     string `split_words:"true" required:"false"`
	GoogleClientSecret string `split_words:"true" required:"false"`
	GoogleCallbackURL  string `split_words:"true" required:"false"`

	GithubAuthEnabled  bool   `split_words:"true" required:"false" default:"false"`
	GithubClientID     string `split_words:"true" required:"false"`
	GithubClientSecret string `split_words:"true" required:"false"`
	GithubCallbackURL  string `split_words:"true" required:"false"`

	EncryptionSecretKeyHex string `split_words:"true" required:"true"`
}

func AUTH() Auth {
	var auth Auth
	envconfig.MustProcess("AUTH", &auth)
	return auth
}
