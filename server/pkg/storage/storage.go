package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/Fantasy-Programming/nuts/config"
	"github.com/rs/zerolog"
)

var ErrOperationNotSupported = errors.New("operation not supported by this storage type")

// Store defines the interface for interacting with different storage backends.
type Storage interface {
	// Upload uploads data from the reader to the specified bucket and key.
	Upload(ctx context.Context, bucket, key string, size int64, body io.Reader) error
	// Download retrieves the object from the specified bucket and key.
	// The caller is responsible for closing the returned io.ReadCloser.
	Download(ctx context.Context, bucket, key string) (io.ReadCloser, error)
	// Delete removes the object from the specified bucket and key.
	Delete(ctx context.Context, bucket, key string) error
	// ListObjects lists objects in the specified bucket with the given prefix.
	ListObjects(ctx context.Context, bucket, prefix string) ([]string, error)
	// GenerateGetSignedURL creates a presigned URL for getting an object.
	GenerateGetSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error)
	// GeneratePutSignedURL creates a presigned URL for putting an object.
	GeneratePutSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error)
	// GenerateDeleteSignedURL creates a presigned URL for deleting an object.
	GenerateDeleteSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error)
	// BucketExists checks if a bucket exists.
	BucketExists(ctx context.Context, bucket string) (bool, error)
	// CreatePublicBucket creates a bucket (semantics depend on implementation, S3 won't make it world-readable by default).
	CreatePublicBucket(ctx context.Context, bucket, region string) error
	// CreateSecureBucket creates a bucket with stricter security settings (e.g., encryption, access blocks for S3).
	CreateSecureBucket(ctx context.Context, bucket, region string) error
}

func NewStorageProvider(cfg config.Storage, logger *zerolog.Logger) (Storage, error) {
	switch cfg.Host {
	case "Fs":
		if cfg.FSPath == "" {
			return nil, fmt.Errorf("missing STORAGE_FS_PATH for host 'Fs' set in ENV")
		}

		strg, err := NewFS(cfg.FSPath)
		if err != nil {
			return nil, err
		}

		return strg, nil
	case "Minio":
		if cfg.AccessKey == "" {
			return nil, fmt.Errorf("missing STORAGE_ACCESS_KEY in env for host 'Minio'")
		}

		if cfg.Region == "" {
			return nil, fmt.Errorf("missing STORAGE_REGION in env for host 'Minio'")
		}

		if cfg.SecretKey == "" {
			return nil, fmt.Errorf("missing STORAGE_SECRET_KEY in env for host 'Minio'")
		}

		strg, err := NewMinio(context.Background(), cfg.MinioEndpoint, cfg.Region, cfg.AccessKey, cfg.SecretKey, cfg.MinioSSL)
		if err != nil {
			return nil, err
		}
		return strg, nil
	case "S3":
		if cfg.AccessKey == "" {
			return nil, fmt.Errorf("missing STORAGE_ACCESS_KEY in env for host 'S3'")
		}

		if cfg.Region == "" {
			return nil, fmt.Errorf("missing STORAGE_REGION in env for host 'S3'")
		}

		if cfg.SecretKey == "" {
			return nil, fmt.Errorf("missing STORAGE_SECRET_KEY in env for host 'S3'")
		}

		strg, err := NewS3(context.Background(), cfg.Region, cfg.AccessKey, cfg.SecretKey)
		if err != nil {
			return nil, err
		}
		return strg, nil

	case "R2":
		if cfg.AccessKey == "" {
			return nil, fmt.Errorf("missing STORAGE_ACCESS_KEY in env for host 'R2'")
		}

		if cfg.Region == "" {
			return nil, fmt.Errorf("missing STORAGE_REGION in env for host 'R2'")
		}

		if cfg.SecretKey == "" {
			return nil, fmt.Errorf("missing STORAGE_SECRET_KEY in env for host 'R2'")
		}

		if cfg.R2AccountID == "" {
			return nil, fmt.Errorf("missing STORAGE_R2_ACCOUNT_ID in env for host 'R2'")
		}

		strg, err := NewR2(context.Background(), cfg.R2AccountID, cfg.AccessKey, cfg.SecretKey)
		if err != nil {
			return nil, err
		}

		return strg, nil

	default:
		return nil, fmt.Errorf("unsupported storage host: %s", cfg.Host)
	}
}
