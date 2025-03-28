package storage

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Support R2, s3, minio and fs
type Storage struct {
	Client *s3.Client
	Bucket string
}

// TODO: Remove hard-coded vars
// minio
func NewMinio(bucket string) *Storage {
	client := s3.NewFromConfig(aws.Config{Region: "us-east-1"}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("http://127.0.0.1:9000")
		o.Credentials = credentials.NewStaticCredentialsProvider("minioadmin", "minioadmin", "")
	})

	return &Storage{client, bucket}
}

// CloudFlare R2
func NewR2(accountID, accessKey, secretKey, bucket string) (*Storage, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		log.Fatal(err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})

	return &Storage{client, bucket}, nil
}
