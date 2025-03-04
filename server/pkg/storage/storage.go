package storage

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Support R2, s3, minio and fs

// minio
type Storage struct {
	client *s3.Client
	bucket string
}

func NewMinio(bucket string) *Storage {
	client := s3.NewFromConfig(aws.Config{Region: "us-east-1"}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("http://127.0.0.1:9000")
		o.Credentials = credentials.NewStaticCredentialsProvider("minioadmin", "minioadmin", "")
	})

	return &Storage{client, bucket}
}
