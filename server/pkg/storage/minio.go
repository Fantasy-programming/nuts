package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/minio/minio-go/v7/pkg/sse"
)

type MinioStore struct {
	Client *minio.Client
}

// NewMinio creates a new Store implementation for MinIO (S3 compatible).
func NewMinio(ctx context.Context, endpoint, region, accessKey, secretKey string, useSSL bool) (Storage, error) {
	// Custom resolver to handle MinIO endpoint
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to load minio config: %w", err)
	}

	return &MinioStore{
		Client: minioClient,
	}, nil
}

func (s *MinioStore) Upload(ctx context.Context, bucket, key string, size int64, body io.Reader) error {
	_, err := s.Client.PutObject(ctx, bucket, key, body, size, minio.PutObjectOptions{})
	if err != nil {
		return fmt.Errorf("minio upload failed: %w", err)
	}
	return nil
}

func (s *MinioStore) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	resp, err := s.Client.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("minio download failed: %w", err)
	}
	return resp, nil
}

func (s *MinioStore) Delete(ctx context.Context, bucket, key string) error {
	err := s.Client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("s3 delete failed: %w", err)
	}
	return nil
}

func (s *MinioStore) ListObjects(ctx context.Context, bucket, prefix string) ([]string, error) {
	var keys []string

	for object := range s.Client.ListObjects(ctx, bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}) {

		if object.Err != nil {
			return nil, fmt.Errorf("s3 list objects failed: %w", object.Err)
		}

		keys = append(keys, object.Key)
	}

	return keys, nil
}

func (s *MinioStore) GenerateGetSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	// Set request parameters
	reqParams := make(url.Values)
	reqParams.Set("response-content-disposition", "attachment; filename=\"your-filename.txt\"")

	// Gernerate presigned get object url.
	presignedURL, err := s.Client.PresignedGetObject(ctx, bucket, key, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("minio presign get failed: %w", err)
	}

	// TODO: Check this
	return presignedURL.Path, nil
}

func (s *MinioStore) GeneratePutSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	presignedURL, err := s.Client.PresignedPutObject(ctx, bucket, key, expires)
	if err != nil {
		return "", fmt.Errorf("s3 presign put failed: %w", err)
	}
	return presignedURL.Path, nil
}

// TODO: Fix this
func (s *MinioStore) GenerateDeleteSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	// presignedURL, err := s.Client.PresignedDeleteObject(ctx, bucket, key, expires, reqParams)
	// if err != nil {
	// 	return "", fmt.Errorf("s3 presign put failed: %w", err)
	// }
	return "", nil
}

func (s *MinioStore) BucketExists(ctx context.Context, bucket string) (bool, error) {
	exist, err := s.Client.BucketExists(ctx, bucket)

	if err == nil && exist {
		return true, nil
	}

	return false, fmt.Errorf("minio failed to check bucket existance: %w", err)
}

func (s *MinioStore) CreatePublicBucket(ctx context.Context, bucket, region string) error {
	err := s.Client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{
		Region: region,
	})

	return err
}

func (s *MinioStore) CreateSecureBucket(ctx context.Context, bucket, region string) error {
	// 1. Create the bucket itself
	err := s.Client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{
		Region: region,
	})
	if err != nil {
		return err
	}

	// 2. Apply Default Server-Side Encryption (AES256)
	// Note: R2 enables encryption by default and may not support this call.
	err = s.Client.SetBucketEncryption(context.Background(), bucket, sse.NewConfigurationSSES3())

	return err
}
