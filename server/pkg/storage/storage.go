package storage

import (
	"context"
	"errors"
	"io"
	"time"
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
