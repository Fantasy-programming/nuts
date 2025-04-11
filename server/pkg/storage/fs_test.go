package storage

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFSStore(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "fs-store-test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a new FSStore
	store, err := NewFS(tempDir)
	if err != nil {
		t.Fatalf("Failed to create FSStore: %v", err)
	}

	ctx := context.Background()
	bucket := "test-bucket"
	key := "test/object.txt"
	content := "hello world"

	// Test bucket creation
	t.Run("CreateBucket", func(t *testing.T) {
		err = store.CreatePublicBucket(ctx, bucket, "")
		require.NoError(t, err)

		// Verify bucket exists
		exists, err := store.BucketExists(ctx, bucket)
		require.NoError(t, err)
		assert.True(t, exists)

		// Check actual directory was created
		bucketPath := filepath.Join(tempDir, bucket)
		info, err := os.Stat(bucketPath)
		require.NoError(t, err)
		assert.True(t, info.IsDir())
	})

	// Test object upload and download
	t.Run("UploadDownload", func(t *testing.T) {
		// Upload object
		err = store.Upload(ctx, bucket, key, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// Verify file was created
		filePath := filepath.Join(tempDir, bucket, key)
		_, err := os.Stat(filePath)
		require.NoError(t, err)

		// Download object
		reader, err := store.Download(ctx, bucket, key)
		require.NoError(t, err)
		defer reader.Close()

		// Read and verify content
		downloadedContent, err := io.ReadAll(reader)
		require.NoError(t, err)
		assert.Equal(t, content, string(downloadedContent))
	})

	// Test list objects
	t.Run("ListObjects", func(t *testing.T) {
		// Add another object
		key2 := "test/another.txt"
		err = store.Upload(ctx, bucket, key2, int64(len(content)), strings.NewReader(content))
		require.NoError(t, err)

		// List objects with prefix
		objects, err := store.ListObjects(ctx, bucket, "test/")
		require.NoError(t, err)
		assert.Len(t, objects, 2)
		assert.ElementsMatch(t, []string{"test/object.txt", "test/another.txt"}, objects)

		// List with different prefix
		objects, err = store.ListObjects(ctx, bucket, "nonexistent/")
		require.NoError(t, err)
		assert.Empty(t, objects)
	})

	// Test delete object
	t.Run("DeleteObject", func(t *testing.T) {
		// Delete object
		err = store.Delete(ctx, bucket, key)
		require.NoError(t, err)

		// Verify object was deleted
		_, err = store.Download(ctx, bucket, key)
		assert.Error(t, err)

		// Verify file is physically gone
		filePath := filepath.Join(tempDir, bucket, key)
		_, err = os.Stat(filePath)
		assert.True(t, os.IsNotExist(err))
	})

	// Test not supported operations
	t.Run("UnsupportedOperations", func(t *testing.T) {
		_, err := store.GenerateGetSignedURL(ctx, bucket, key, 3600)
		assert.ErrorIs(t, err, ErrOperationNotSupported)

		_, err = store.GeneratePutSignedURL(ctx, bucket, key, 3600)
		assert.ErrorIs(t, err, ErrOperationNotSupported)

		_, err = store.GenerateDeleteSignedURL(ctx, bucket, key, 3600)
		assert.ErrorIs(t, err, ErrOperationNotSupported)
	})

	// Test secure bucket (should be same as public for FS)
	t.Run("SecureBucket", func(t *testing.T) {
		secureBucket := "secure-bucket"
		err = store.CreateSecureBucket(ctx, secureBucket, "")
		require.NoError(t, err)

		// Verify bucket exists
		exists, err := store.BucketExists(ctx, secureBucket)
		require.NoError(t, err)
		assert.True(t, exists)

		// Check directory was created (same behavior as public bucket for FS)
		secureBucketPath := filepath.Join(tempDir, secureBucket)
		info, err := os.Stat(secureBucketPath)
		require.NoError(t, err)
		assert.True(t, info.IsDir())
	})

	// Test invalid paths
	t.Run("InvalidPaths", func(t *testing.T) {
		// Try to escape base path
		_, err = store.Download(ctx, bucket, "../escaped")
		assert.Error(t, err)

		// Invalid bucket name
		_, err = store.Download(ctx, "../invalid", "file.txt")
		assert.Error(t, err)
	})
}
