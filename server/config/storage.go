package config

import (
	"github.com/kelseyhightower/envconfig"
)

type Storage struct {
	Host              string `required:"true" default:"Fs"`
	Region            string `required:"false"`
	PublicBucketName  string `required:"false" split_words:"true" default:"nuts_public"`
	PrivateBucketName string `required:"false" split_words:"true" default:"nuts_private"`
	AccessKey         string `required:"false" split_words:"true"`
	SecretKey         string `required:"false" split_words:"true"`
	MinioEndpoint     string `required:"false" split_words:"true" default:"localhost:9000"`
	MinioSSL          bool   `required:"false" split_words:"true" default:"false"`
	R2AccountID       string `required:"false" split_words:"true"`
	FSPath            string `required:"false" split_words:"true"`
}

func NewStorage() Storage {
	var db Storage
	envconfig.MustProcess("STORAGE", &db)

	return db
}
