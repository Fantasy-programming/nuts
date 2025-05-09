package config

import (
	"time"

	"github.com/kelseyhightower/envconfig"
)

type DB struct {
	Driver                 string        `required:"true"`
	Host                   string        `default:"localhost"`
	Name                   string        `default:"postgres"`
	TestName               string        `split_words:"true" default:"test"`
	User                   string        `default:"postgres"`
	Pass                   string        `default:"password"`
	SslMode                string        `split_words:"true" default:"disable"`
	MaxConnectionPool      int           `split_words:"true" default:"4"`
	MaxIdleConnections     int           `split_words:"true" default:"4"`
	ConnectionsMaxLifeTime time.Duration `split_words:"true" default:"300s"`
	Port                   uint16        `default:"5432"`
}

func DataStore() DB {
	var db DB
	envconfig.MustProcess("DB", &db)

	return db
}
