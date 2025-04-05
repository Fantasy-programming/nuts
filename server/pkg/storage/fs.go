package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// --- Filesystem Implementation ---

// FSStore implements the Store interface using the local filesystem.
type FSStore struct {
	BasePath string
}

// NewFS creates a new Store implementation using the local filesystem.
// The path provided will be the root directory under which buckets are created as subdirectories.
func NewFS(path string) (Storage, error) {
	// Ensure base path exists
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path for '%s': %w", path, err)
	}
	err = os.MkdirAll(absPath, 0755) // Use 0755 for permissions
	if err != nil {
		return nil, fmt.Errorf("failed to create base directory '%s': %w", absPath, err)
	}
	return &FSStore{BasePath: absPath}, nil
}

// resolveFSPath helper to get the full path for a bucket/key.
func (fs *FSStore) resolveFSPath(bucket, key string) (string, error) {
	if bucket == "" {
		return "", errors.New("bucket name cannot be empty for FS store")
	}
	// Basic sanitization to prevent path traversal outside the BasePath/bucket
	cleanBucket := filepath.Clean(bucket)
	cleanKey := filepath.Clean(key)
	if strings.HasPrefix(cleanBucket, "..") || strings.Contains(cleanBucket, string(filepath.Separator)) {
		return "", fmt.Errorf("invalid bucket name: %s", bucket)
	}
	if strings.HasPrefix(cleanKey, "..") {
		return "", fmt.Errorf("invalid key name: %s", key)
	}

	// Bucket becomes a directory under BasePath
	bucketPath := filepath.Join(fs.BasePath, cleanBucket)
	fullPath := filepath.Join(bucketPath, cleanKey)

	// Ensure the resolved path is still within the intended base path (security check)
	absBasePath, _ := filepath.Abs(fs.BasePath) // Already absolute from constructor
	absFullPath, err := filepath.Abs(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to resolve absolute path for key '%s': %w", key, err)
	}
	if !strings.HasPrefix(absFullPath, absBasePath) {
		return "", fmt.Errorf("invalid key '%s', attempts to escape base path", key)
	}

	return fullPath, nil
}

// resolveFSBucketPath helper to get the full path for a bucket.
func (fs *FSStore) resolveFSBucketPath(bucket string) (string, error) {
	if bucket == "" {
		return "", errors.New("bucket name cannot be empty for FS store")
	}
	cleanBucket := filepath.Clean(bucket)
	if strings.HasPrefix(cleanBucket, "..") || strings.Contains(cleanBucket, string(filepath.Separator)) {
		return "", fmt.Errorf("invalid bucket name: %s", bucket)
	}
	return filepath.Join(fs.BasePath, cleanBucket), nil
}

func (fs *FSStore) Upload(ctx context.Context, bucket, key string, size int64, body io.Reader) error {
	filePath, err := fs.resolveFSPath(bucket, key)
	if err != nil {
		return err
	}

	// Ensure the directory for the key exists within the bucket dir
	dirPath := filepath.Dir(filePath)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("fs failed to create directories '%s': %w", dirPath, err)
	}

	// Create the file
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("fs failed to create file '%s': %w", filePath, err)
	}
	defer file.Close()

	// Copy data
	_, err = io.Copy(file, body)
	if err != nil {
		// Attempt to remove partially written file on error
		os.Remove(filePath)
		return fmt.Errorf("fs failed to copy data to '%s': %w", filePath, err)
	}

	return nil
}

func (fs *FSStore) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	filePath, err := fs.resolveFSPath(bucket, key)
	if err != nil {
		return nil, err
	}

	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Map os.IsNotExist to a more generic not found error if desired, or keep specific
			return nil, fmt.Errorf("fs file not found '%s': %w", filePath, err)
		}
		return nil, fmt.Errorf("fs failed to open file '%s': %w", filePath, err)
	}
	// Caller is responsible for closing the file
	return file, nil
}

func (fs *FSStore) Delete(ctx context.Context, bucket, key string) error {
	filePath, err := fs.resolveFSPath(bucket, key)
	if err != nil {
		return err
	}

	err = os.Remove(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Consider deleting a non-existent file a success (idempotent) or an error
			log.Printf("fs delete: file '%s' not found, considering delete successful", filePath)
			return nil // Or return fmt.Errorf("fs file not found '%s': %w", filePath, err)
		}
		return fmt.Errorf("fs failed to remove file '%s': %w", filePath, err)
	}

	// Optional: Clean up empty parent directories? This can be complex and might
	// interfere if other processes use the directories. Generally avoided unless needed.

	return nil
}

func (fs *FSStore) ListObjects(ctx context.Context, bucket, prefix string) ([]string, error) {
	bucketPath, err := fs.resolveFSBucketPath(bucket)
	if err != nil {
		return nil, err
	}

	// Check if bucket directory exists first
	if _, err := os.Stat(bucketPath); os.IsNotExist(err) {
		// If the bucket dir doesn't exist, return empty list, consistent with S3 ListObjects on non-existent bucket
		return []string{}, nil
	} else if err != nil {
		return nil, fmt.Errorf("fs failed to stat bucket path '%s': %w", bucketPath, err)
	}

	var keys []string
	prefixPath := filepath.Join(bucketPath, prefix)
	rootPathToList := bucketPath // By default, list relative to the bucket root

	// If prefix is directory-like, adjust the root path and prefix matching
	if fi, err := os.Stat(prefixPath); err == nil && fi.IsDir() {
		// If the prefix itself points to an existing directory, list inside it
		rootPathToList = prefixPath
	}

	err = filepath.WalkDir(rootPathToList, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			// Log or handle permissions errors etc. during walk
			log.Printf("Warning: Error walking path %s: %v", path, err)
			// Potentially skip this entry or stop the walk based on error type
			if os.IsPermission(err) {
				return nil // Skip permission errors
			}
			return err // Stop walk on other errors
		}

		// We only want files, not directories themselves in the list
		if !d.IsDir() {
			// Get the path relative to the BUCKET path
			relPath, err := filepath.Rel(bucketPath, path)
			if err != nil {
				log.Printf("Warning: Could not get relative path for %s against %s: %v", path, bucketPath, err)
				return nil // Skip this file
			}

			// Check if the relative path starts with the desired prefix
			// Convert to forward slashes for consistent prefix matching like S3
			relPathFwd := filepath.ToSlash(relPath)
			prefixFwd := filepath.ToSlash(prefix)
			if strings.HasPrefix(relPathFwd, prefixFwd) {
				keys = append(keys, relPathFwd)
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("fs failed to walk directory '%s': %w", rootPathToList, err)
	}

	return keys, nil
}

func (fs *FSStore) GenerateGetSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	// Signed URLs are not applicable to a standard local filesystem.
	return "", ErrOperationNotSupported
}

func (fs *FSStore) GeneratePutSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	return "", ErrOperationNotSupported
}

func (fs *FSStore) GenerateDeleteSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	return "", ErrOperationNotSupported
}

func (fs *FSStore) BucketExists(ctx context.Context, bucket string) (bool, error) {
	bucketPath, err := fs.resolveFSBucketPath(bucket)
	if err != nil {
		// Invalid bucket name (e.g., containing '..')
		return false, err
	}
	info, err := os.Stat(bucketPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil // Does not exist
		}
		return false, fmt.Errorf("fs failed to stat bucket path '%s': %w", bucketPath, err) // Other error (e.g., permissions)
	}
	// Check if it's actually a directory as expected
	if !info.IsDir() {
		return false, fmt.Errorf("fs path exists but is not a directory for bucket '%s'", bucket)
	}
	return true, nil
}

func (fs *FSStore) CreatePublicBucket(ctx context.Context, bucket, region string) error {
	// Region is ignored for FS store.
	// Public vs Secure distinction doesn't map directly to FS permissions here.
	// We just create the directory representing the bucket.
	bucketPath, err := fs.resolveFSBucketPath(bucket)
	if err != nil {
		return err
	}
	err = os.MkdirAll(bucketPath, 0755) // Use suitable permissions
	if err != nil {
		// Don't error if it already exists as a directory
		if info, statErr := os.Stat(bucketPath); statErr == nil && info.IsDir() {
			log.Printf("FS Bucket directory '%s' already exists.", bucketPath)
			return nil // Already exists, success
		}
		return fmt.Errorf("fs failed to create bucket directory '%s': %w", bucketPath, err)
	}
	log.Printf("FS Bucket directory '%s' created.", bucketPath)
	return nil
}

func (fs *FSStore) CreateSecureBucket(ctx context.Context, bucket, region string) error {
	// For FS, "Secure" doesn't have the same meaning as S3 (Encryption, Access Blocks).
	// We perform the same action as CreatePublicBucket: ensure the directory exists.
	// Filesystem-level security (permissions, encryption like LUKS/Bitlocker) is outside
	// the scope of this storage abstraction.
	return fs.CreatePublicBucket(ctx, bucket, region) // Delegate to the same logic
}
