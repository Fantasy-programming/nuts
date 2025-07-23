package config

import "github.com/kelseyhightower/envconfig"

type SMTP struct {
	Host     string `envconfig:"SMTP_HOST" default:"localhost"`
	Port     int    `envconfig:"SMTP_PORT" default:"587"`
	Username string `envconfig:"SMTP_USERNAME"`
	Password string `envconfig:"SMTP_PASSWORD"`
	FromEmail string `envconfig:"SMTP_FROM_EMAIL" default:"noreply@nuts.app"`
	FromName  string `envconfig:"SMTP_FROM_NAME" default:"Nuts App"`
}

func NewSMTP() SMTP {
	var smtp SMTP
	envconfig.MustProcess("", &smtp)
	return smtp
}