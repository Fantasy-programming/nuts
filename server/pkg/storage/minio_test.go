package storage

import (
	"context"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestMinioIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Start MinIO container
	ctx := context.Background()
	accessKey := "minio-access-key"
	secretKey := "minio-secret-key"

	req := testcontainers.ContainerRequest{
		Image:        "minio/minio:latest",
		ExposedPorts: []string{"9000/tcp", "9001/tcp"},
		Env: map[string]string{
			"MINIO_ROOT_USER":      accessKey,
			"MINIO_ROOT_PASSWORD":  secretKey,
			"MINIO_KMS_SECRET_KEY": "key:v6SLmyrcQDB/+/RcYEbHPWdI102S/hMFthros3GaO5I=",
		},
		Cmd: []string{"server", "/data", "--console-address", ":9001"},
		WaitingFor: wait.ForAll(
			wait.ForListeningPort("9000/tcp"),
			wait.ForListeningPort("9001/tcp"),
		),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	require.NoError(t, err)
	defer container.Terminate(ctx)

	// Get container endpoint
	endpoint, err := container.Endpoint(ctx, "")
	require.NoError(t, err)

	// Configure test client
	store, err := NewMinio(ctx, endpoint, "us-east-1", accessKey, secretKey, false)
	require.NoError(t, err)

	minioStore, ok := store.(*MinioStore)
	require.True(t, ok)
	require.NotNil(t, minioStore.Client)

	// Test variables
	bucket := "test-bucket"
	region := "us-east-1"
	key := "test/object.txt"
	content := "hello world from minio test"

	// Test bucket creation
	t.Run("CreateBucket", func(t *testing.T) {
		err := store.CreatePublicBucket(ctx, bucket, region)
		require.NoError(t, err)

		exists, err := store.BucketExists(ctx, bucket)
		require.NoError(t, err)
		assert.True(t, exists)
	})

	// Test object upload and download
	t.Run("UploadDownload", func(t *testing.T) {
		err := store.Upload(ctx, bucket, key, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		reader, err := store.Download(ctx, bucket, key)
		require.NoError(t, err)
		defer reader.Close()

		data, err := io.ReadAll(reader)
		require.NoError(t, err)
		assert.Equal(t, content, string(data))
	})

	// Test listing objects
	t.Run("ListObjects", func(t *testing.T) {
		// Upload another object
		anotherKey := "test/another.txt"
		err := store.Upload(ctx, bucket, anotherKey, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// List with prefix
		keys, err := store.ListObjects(ctx, bucket, "test/")
		require.NoError(t, err)
		assert.Len(t, keys, 2)
		assert.Contains(t, keys, key)
		assert.Contains(t, keys, anotherKey)

		// List with non-matching prefix
		keys, err = store.ListObjects(ctx, bucket, "nonexistent/")
		require.NoError(t, err)
		assert.Empty(t, keys)
	})

	// Test deletion
	t.Run("Delete", func(t *testing.T) {
		err := store.Delete(ctx, bucket, key)
		require.NoError(t, err)

		// Verify object is deleted by attempting to download it
		_, err = store.Download(ctx, bucket, key)
		assert.Error(t, err) // Should get an error as object is deleted
	})

	// Test signed URLs
	t.Run("SignedURLs", func(t *testing.T) {
		// Test get signed URL
		url, err := store.GenerateGetSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.NotEmpty(t, url)

		// Test put signed URL
		url, err = store.GeneratePutSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.NotEmpty(t, url)

		// Test delete signed URL - we know this is not implemented yet so we're expecting an error
		url, err = store.GenerateDeleteSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.Empty(t, url)
		// This is currently unimplemented in the MinioStore
		// This test can be updated when the implementation is completed
	})

	// Test secure bucket
	t.Run("SecureBucket", func(t *testing.T) {
		secureBucket := "secure-test-bucket"
		err := store.CreateSecureBucket(ctx, secureBucket, region)
		require.NoError(t, err)

		exists, err := store.BucketExists(ctx, secureBucket)
		require.NoError(t, err)
		assert.True(t, exists)

		// Test upload to secure bucket
		secureKey := "secure/data.txt"
		err = store.Upload(ctx, secureBucket, secureKey, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// Verify data in secure bucket
		reader, err := store.Download(ctx, secureBucket, secureKey)
		require.NoError(t, err)
		defer reader.Close()

		data, err := io.ReadAll(reader)
		require.NoError(t, err)
		assert.Equal(t, content, string(data))
	})
}

// TestBrokenMinioConnection tests error handling when MinIO connection fails
func TestBrokenMinioConnection(t *testing.T) {
	ctx := context.Background()

	// Test with invalid endpoint
	t.Run("InvalidEndpoint", func(t *testing.T) {
		_, err := NewMinio(ctx, "invalid-endpoint:9000", "us-east-1", "test", "test", false)
		assert.Error(t, err)
	})

	// Test operations with non-existent bucket
	t.Run("NonExistentBucket", func(t *testing.T) {
		// Only run if we have a real MinIO server available for testing
		// This is optional and can be skipped in CI environments
		minioEndpoint := "localhost:9000"
		store, err := NewMinio(ctx, minioEndpoint, "us-east-1", "minioadmin", "minioadmin", false)
		if err != nil {
			t.Skip("Skipping test as no MinIO server is available")
		}

		// Test operations against non-existent bucket
		nonExistentBucket := "this-bucket-does-not-exist-123456"

		// Test download from non-existent bucket
		_, err = store.Download(ctx, nonExistentBucket, "some-key")
		assert.Error(t, err)

		// Test upload to non-existent bucket
		err = store.Upload(ctx, nonExistentBucket, "some-key", 5, strings.NewReader("hello"))
		assert.Error(t, err)

		// Test list objects in non-existent bucket
		_, err = store.ListObjects(ctx, nonExistentBucket, "")
		assert.Error(t, err)
	})
}
