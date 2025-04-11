package storage

import (
	"context"
	"io"
	"log"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/docker/go-connections/nat"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/localstack"
)

// TestS3Integration tests the S3Store implementation using LocalStack
func TestS3Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Start LocalStack container for S3 testing
	ctx := context.Background()

	container, err := localstack.Run(context.Background(), "localstack/localstack:latest",
		testcontainers.WithEnv(map[string]string{
			"AWS_DEFAULT_REGION":     "us-east-1",
			"SERVICES":               "s3",
			"SKIP_SSL_CERT_DOWNLOAD": "1",
		}),
	)

	require.NoError(t, err)
	defer func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			log.Printf("failed to terminate container: %s", err)
		}
	}()

	// Get container endpoint
	mappedPort, err := container.MappedPort(ctx, nat.Port("4566/tcp"))
	require.NoError(t, err)

	provider, err := testcontainers.NewDockerProvider()
	require.NoError(t, err)
	defer provider.Close()

	host, err := provider.DaemonHost(ctx)
	require.NoError(t, err)

	// Create S3 client using service-specific options
	client := s3.New(s3.Options{
		Credentials:  aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider("test", "test", "")),
		Region:       "us-east-1",
		UsePathStyle: true,
		BaseEndpoint: aws.String("http://" + host + ":" + mappedPort.Port()),
	})

	// Create test S3Store
	store := &S3Store{
		Client:        client,
		PresignClient: s3.NewPresignClient(client),
		uploader:      manager.NewUploader(client),
		downloader:    manager.NewDownloader(client),
		defaultRegion: "us-east-1",
	}

	// Test variables
	bucket := "test-bucket"
	region := "us-east-1"
	key := "test/object.txt"
	content := "hello world"

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

		// Check if object still exists
		_, err = store.Download(ctx, bucket, key)
		assert.Error(t, err) // Should get an error as object is deleted
	})

	// Test signed URLs
	t.Run("SignedURLs", func(t *testing.T) {
		// Test get signed URL
		url, err := store.GenerateGetSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.Contains(t, url, host+":"+mappedPort.Port())
		assert.Contains(t, url, bucket)
		assert.Contains(t, url, key)

		// Test put signed URL
		url, err = store.GeneratePutSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.Contains(t, url, host+":"+mappedPort.Port())
		assert.Contains(t, url, bucket)
		assert.Contains(t, url, key)

		// Test delete signed URL
		url, err = store.GenerateDeleteSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.Contains(t, url, host+":"+mappedPort.Port())
		assert.Contains(t, url, bucket)
		assert.Contains(t, url, key)
	})

	// Test secure bucket
	t.Run("SecureBucket", func(t *testing.T) {
		secureBucket := "secure-test-bucket"
		err := store.CreateSecureBucket(ctx, secureBucket, region)
		require.NoError(t, err)

		exists, err := store.BucketExists(ctx, secureBucket)
		require.NoError(t, err)
		assert.True(t, exists)
	})
}

// TestR2Mock tests the R2 implementation using mocked S3 endpoints
// This is a simplified test that doesn't launch actual containers
// but verifies the R2 constructor works properly
func TestR2Mock(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()

	// Create a mock R2 client
	accountID := "test-account"
	accessKey := "test-access-key"
	secretKey := "test-secret-key"

	// Use NewR2 with mock credentials
	store, err := NewR2(ctx, accountID, accessKey, secretKey)
	require.NoError(t, err)

	// Verify store was created with expected type
	s3Store, ok := store.(*S3Store)
	require.True(t, ok)

	// Verify R2-specific configuration
	assert.Equal(t, "auto", s3Store.defaultRegion)

	// We can't easily test actual R2 operations without a real R2 account,
	// but we can verify the client is properly initialized
	assert.NotNil(t, s3Store.Client)
	assert.NotNil(t, s3Store.PresignClient)
}

func TestR2Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping R2 integration test in short mode")
	}

	// Check for required environment variables
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKey := os.Getenv("R2_ACCESS_KEY")
	secretKey := os.Getenv("R2_SECRET_KEY")

	if accountID == "" || accessKey == "" || secretKey == "" {
		t.Skip("Skipping R2 integration tests. Set R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY environment variables to run")
	}

	// Initialize R2 client
	ctx := context.Background()
	store, err := NewR2(ctx, accountID, accessKey, secretKey)
	require.NoError(t, err)
	require.NotNil(t, store)

	// Test variables - use unique names to avoid conflicts with other test runs
	testTimestamp := time.Now().Format("20060102-150405")
	bucket := "r2-test-bucket-" + testTimestamp
	region := "auto" // R2 uses 'auto' region
	key := "test/r2-object-" + testTimestamp + ".txt"
	content := "hello world from r2 test " + testTimestamp

	// Create test bucket
	t.Run("CreateBucket", func(t *testing.T) {
		// First check if the bucket already exists and skip creation if it does
		exists, err := store.BucketExists(ctx, bucket)
		if err == nil && exists {
			t.Logf("Bucket %s already exists, skipping creation", bucket)
			return
		}

		err = store.CreatePublicBucket(ctx, bucket, region)
		require.NoError(t, err)

		// Verify bucket exists
		exists, err = store.BucketExists(ctx, bucket)
		require.NoError(t, err)
		assert.True(t, exists)
	})

	// Upload an object
	t.Run("Upload", func(t *testing.T) {
		err := store.Upload(ctx, bucket, key, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)
	})

	// Download the object
	t.Run("Download", func(t *testing.T) {
		reader, err := store.Download(ctx, bucket, key)
		require.NoError(t, err)
		defer reader.Close()

		data, err := io.ReadAll(reader)
		require.NoError(t, err)
		assert.Equal(t, content, string(data))
	})

	// List objects
	t.Run("ListObjects", func(t *testing.T) {
		// Upload a second object for listing
		anotherKey := "test/r2-another-" + testTimestamp + ".txt"
		err := store.Upload(ctx, bucket, anotherKey, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// List with prefix
		keys, err := store.ListObjects(ctx, bucket, "test/")
		require.NoError(t, err)
		assert.Contains(t, keys, key)
		assert.Contains(t, keys, anotherKey)

		// List with more specific prefix
		keys, err = store.ListObjects(ctx, bucket, "test/r2-object-")
		require.NoError(t, err)
		assert.Contains(t, keys, key)
		assert.NotContains(t, keys, anotherKey)

		// List with non-matching prefix
		keys, err = store.ListObjects(ctx, bucket, "nonexistent/")
		require.NoError(t, err)
		assert.Empty(t, keys)
	})

	// Generate and test signed URLs
	t.Run("SignedURLs", func(t *testing.T) {
		// Test GET signed URL
		getURL, err := store.GenerateGetSignedURL(ctx, bucket, key, 1*time.Hour)
		require.NoError(t, err)
		assert.NotEmpty(t, getURL)
		t.Logf("Generated GET signed URL: %s", getURL)

		// Test PUT signed URL
		putURL, err := store.GeneratePutSignedURL(ctx, bucket, key+".new", 1*time.Hour)
		require.NoError(t, err)
		assert.NotEmpty(t, putURL)
		t.Logf("Generated PUT signed URL: %s", putURL)

		// Test DELETE signed URL - we expect this might not be implemented for R2
		deleteURL, err := store.GenerateDeleteSignedURL(ctx, bucket, key, 1*time.Hour)
		if err == nil {
			t.Logf("Generated DELETE signed URL: %s", deleteURL)
		} else {
			t.Logf("Delete signed URL generation returned error (may be expected): %v", err)
		}
	})

	// Test secure bucket
	t.Run("SecureBucket", func(t *testing.T) {
		secureBucket := "r2-secure-test-" + testTimestamp

		// First check if the bucket already exists
		exists, err := store.BucketExists(ctx, secureBucket)
		if err == nil && exists {
			t.Logf("Secure bucket %s already exists, skipping creation", secureBucket)
		} else {
			err = store.CreateSecureBucket(ctx, secureBucket, region)
			require.NoError(t, err)

			// Verify bucket exists
			exists, err = store.BucketExists(ctx, secureBucket)
			require.NoError(t, err)
			assert.True(t, exists)
		}

		// Test upload to secure bucket
		secureKey := "secure/r2-data-" + testTimestamp + ".txt"
		err = store.Upload(ctx, secureBucket, secureKey, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// Verify data in secure bucket
		reader, err := store.Download(ctx, secureBucket, secureKey)
		require.NoError(t, err)
		defer reader.Close()

		data, err := io.ReadAll(reader)
		require.NoError(t, err)
		assert.Equal(t, content, string(data))

		// Clean up
		err = store.Delete(ctx, secureBucket, secureKey)
		require.NoError(t, err)
	})

	// Delete the test objects
	t.Run("Delete", func(t *testing.T) {
		// Delete the first object
		err := store.Delete(ctx, bucket, key)
		require.NoError(t, err)

		// Try downloading deleted object (should fail)
		_, err = store.Download(ctx, bucket, key)
		assert.Error(t, err)

		// Delete the second object
		anotherKey := "test/r2-another-" + testTimestamp + ".txt"
		err = store.Delete(ctx, bucket, anotherKey)
		require.NoError(t, err)
	})

	// Note: We intentionally don't delete the test buckets to avoid
	// permissions issues in shared R2 accounts and to preserve test history.
	// In production tests, you might want to add bucket cleanup.
	t.Log("Test buckets were not deleted. You may want to manually clean them up.")
}

func TestR2ErrorHandling(t *testing.T) {
	// Check for required environment variables
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKey := os.Getenv("R2_ACCESS_KEY")
	secretKey := os.Getenv("R2_SECRET_KEY")

	if accountID == "" || accessKey == "" || secretKey == "" {
		t.Skip("Skipping R2 error handling tests. Set R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY environment variables to run")
	}

	ctx := context.Background()

	// Test with invalid credentials
	t.Run("InvalidCredentials", func(t *testing.T) {
		store, err := NewR2(ctx, accountID, "invalid-access-key", "invalid-secret-key")
		if err != nil {
			// Some S3-compatible APIs might fail during client creation
			t.Logf("NewR2 with invalid credentials failed as expected: %v", err)
			return
		}

		// If client creation succeeded, operations should fail
		_, err = store.BucketExists(ctx, "any-bucket-name")
		assert.Error(t, err)
		t.Logf("BucketExists with invalid credentials failed as expected: %v", err)
	})

	// Test with valid client but operations on non-existent bucket
	t.Run("NonExistentBucket", func(t *testing.T) {
		store, err := NewR2(ctx, accountID, accessKey, secretKey)
		require.NoError(t, err)

		// Non-existent bucket with random name to avoid accidental hits
		nonExistentBucket := "r2-non-existent-bucket-" + time.Now().Format("20060102-150405-999999999")

		// Test operations against non-existent bucket
		_, err = store.Download(ctx, nonExistentBucket, "some-key")
		assert.Error(t, err)
		t.Logf("Download from non-existent bucket failed as expected: %v", err)

		err = store.Upload(ctx, nonExistentBucket, "some-key", 5, strings.NewReader("hello"))
		assert.Error(t, err)
		t.Logf("Upload to non-existent bucket failed as expected: %v", err)

		_, err = store.ListObjects(ctx, nonExistentBucket, "")
		assert.Error(t, err)
		t.Logf("ListObjects in non-existent bucket failed as expected: %v", err)
	})
}
