package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// --- S3 Implementation (Handles S3, R2, MinIO) ---

// S3Store implements the Store interface using the AWS S3 SDK.
type S3Store struct {
	Client        *s3.Client
	PresignClient *s3.PresignClient
	uploader      *manager.Uploader
	downloader    *manager.Downloader
	// defaultRegion is useful for bucket creation if not otherwise specified.
	defaultRegion string
}

// NewS3 creates a new Store implementation for AWS S3.
func NewS3(ctx context.Context, region, accessKey, secretKey string) (Storage, error) {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load S3 config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	return &S3Store{
		Client:        client,
		PresignClient: s3.NewPresignClient(client),
		uploader:      manager.NewUploader(client),
		downloader:    manager.NewDownloader(client),
		defaultRegion: region,
	}, nil
}

// NewR2 creates a new Store implementation for Cloudflare R2.
func NewR2(ctx context.Context, accountID, accessKey, secretKey string) (Storage, error) {
	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		// R2 uses a specific endpoint format
		return aws.Endpoint{
			URL:           fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID),
			SigningRegion: "auto", // R2 typically uses 'auto' region
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithRegion("auto"), // R2 uses 'auto' or specific region hints like 'wnam', 'enam', 'apac'
		config.WithEndpointResolverWithOptions(resolver),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load R2 config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	return &S3Store{
		Client:        client,
		PresignClient: s3.NewPresignClient(client),
		uploader:      manager.NewUploader(client),
		downloader:    manager.NewDownloader(client),
		// R2 region concept is slightly different, 'auto' is often used
		defaultRegion: "auto",
	}, nil
}

// func NewR2(accountID, accessKey, secretKey string) (*Storage, error) {
// 	cfg, err := config.LoadDefaultConfig(context.TODO(),
// 		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
// 		config.WithRegion("auto"),
// 	)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
//
// 	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
// 		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
// 	})
//
// 	return &Storage{Client: client}, nil
// }

func (s *S3Store) Upload(ctx context.Context, bucket, key string, size int64, body io.Reader) error {
	_, err := s.uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   body,
	})
	if err != nil {
		return fmt.Errorf("s3 upload failed: %w", err)
	}
	return nil
}

func (s *S3Store) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	// Use GetObject directly for streaming benefits if large files are expected
	// Using the downloader with WriteAtBuffer is simpler for smaller files but loads all into memory.
	// Let's switch to GetObject for better memory efficiency.
	resp, err := s.Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("s3 download failed: %w", err)
	}
	// The caller is responsible for closing resp.Body
	return resp.Body, nil

	/* // Alternative using manager.Downloader (loads full object into memory first)
	buf := manager.NewWriteAtBuffer([]byte{})
	_, err := s.downloader.Download(ctx, buf, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("s3 download failed: %w", err)
	}
	return io.NopCloser(bytes.NewReader(buf.Bytes())), nil
	*/
}

func (s *S3Store) Delete(ctx context.Context, bucket, key string) error {
	_, err := s.Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("s3 delete failed: %w", err)
	}
	return nil
}

func (s *S3Store) ListObjects(ctx context.Context, bucket, prefix string) ([]string, error) {
	var keys []string
	paginator := s3.NewListObjectsV2Paginator(s.Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("s3 list objects failed: %w", err)
		}
		for _, obj := range page.Contents {
			if obj.Key != nil {
				keys = append(keys, *obj.Key)
			}
		}
	}

	return keys, nil
}

func (s *S3Store) GenerateGetSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	req, err := s.PresignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("s3 presign get failed: %w", err)
	}
	return req.URL, nil
}

func (s *S3Store) GeneratePutSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	req, err := s.PresignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("s3 presign put failed: %w", err)
	}
	return req.URL, nil
}

func (s *S3Store) GenerateDeleteSignedURL(ctx context.Context, bucket, key string, expires time.Duration) (string, error) {
	req, err := s.PresignClient.PresignDeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", fmt.Errorf("s3 presign delete failed: %w", err)
	}
	return req.URL, nil
}

func (s *S3Store) BucketExists(ctx context.Context, bucket string) (bool, error) {
	_, err := s.Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucket),
	})
	if err != nil {
		var nf *types.NoSuchBucket
		var nfFound *types.NotFound // Some S3-compatibles might return this

		if errors.As(err, &nf) || errors.As(err, &nfFound) {
			return false, nil // Not found is not an error in this context
		}
		return false, fmt.Errorf("s3 head bucket failed: %w", err)
	}
	return true, nil
}

// createBucketInternal is a helper for S3 bucket creation.
func (s *S3Store) createBucketInternal(ctx context.Context, bucket, region string) error {
	// Determine the location constraint
	var createCfg *types.CreateBucketConfiguration
	// Buckets in us-east-1 (the default/classic region) should not have a LocationConstraint specified.
	// Also handle R2's 'auto' region.
	if region != "" && region != "us-east-1" && region != "auto" {
		createCfg = &types.CreateBucketConfiguration{
			LocationConstraint: types.BucketLocationConstraint(region),
		}
	}

	_, err := s.Client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket:                    aws.String(bucket),
		CreateBucketConfiguration: createCfg,
		// ObjectLockEnabledForBucket: aws.Bool(false), // Optional: uncomment to configure object lock
	})
	if err != nil {
		// Don't fail if the bucket already exists and is owned by us.
		var bae *types.BucketAlreadyOwnedByYou
		if errors.As(err, &bae) {
			log.Printf("Bucket %s already exists and is owned by you.", bucket)
			return nil // Considered success
		}
		// Handle case where bucket exists but owned by someone else (more specific error).
		var baeExists *types.BucketAlreadyExists
		if errors.As(err, &baeExists) {
			// This is a more definite error than BucketAlreadyOwnedByYou for cross-account cases
			return fmt.Errorf("bucket %s already exists (possibly owned by another account): %w", bucket, err)
		}
		return fmt.Errorf("s3 create bucket failed: %w", err)
	}
	log.Printf("Bucket %s created successfully or already existed.", bucket)
	return nil
}

func (s *S3Store) CreatePublicBucket(ctx context.Context, bucket, region string) error {
	// 1. Create the bucket itself
	err := s.createBucketInternal(ctx, bucket, region)
	if err != nil {
		return err // Error already wrapped in helper
	}

	// 2. Public Bucket specific settings (Optional, depends on definition of 'public')
	// By default, S3 buckets are private. Making a bucket truly *public*
	// usually involves setting a Bucket Policy or ACLs.
	// This function *creates* the bucket but doesn't apply policies to make it world-readable.
	// It specifically avoids applying the strict Public Access Blocks used in CreateSecureBucket.

	// Example: If you wanted to remove *some* public access blocks (Use with extreme caution!):
	/*
	   _, err = s.Client.PutPublicAccessBlock(ctx, &s3.PutPublicAccessBlockInput{
	       Bucket: aws.String(bucket),
	       PublicAccessBlockConfiguration: &types.PublicAccessBlockConfiguration{
	           BlockPublicAcls:       aws.Bool(false), // Allow public ACLs
	           IgnorePublicAcls:      aws.Bool(false), // Don't ignore public ACLs
	           BlockPublicPolicy:     aws.Bool(false), // Allow public policies
	           RestrictPublicBuckets: aws.Bool(false), // Don't restrict if policy/ACLs allow public access
	       },
	   })
	   if err != nil {
	       return fmt.Errorf("failed to configure public access block for public bucket %s: %w", bucket, err)
	   }
	   log.Printf("Applied permissive public access block settings to bucket %s. Ensure bucket policy/ACLs are set appropriately if public access is desired.", bucket)
	*/

	// Typically, for "public" assets, you'd either use Signed URLs or apply a specific
	// bucket policy allowing public GetObject actions, e.g.:
	/*
	   publicReadPolicy := fmt.Sprintf(`{
	       "Version": "2012-10-17",
	       "Statement": [
	           {
	               "Sid": "PublicReadGetObject",
	               "Effect": "Allow",
	               "Principal": "*",
	               "Action": "s3:GetObject",
	               "Resource": "arn:aws:s3:::%s/*"
	           }
	       ]
	   }`, bucket)
	   _, err = s.Client.PutBucketPolicy(ctx, &s3.PutBucketPolicyInput{
	       Bucket: aws.String(bucket),
	       Policy: aws.String(publicReadPolicy),
	   })
	    if err != nil {
	       return fmt.Errorf("failed to apply public read policy to bucket %s: %w", bucket, err)
	    }
	   log.Printf("Applied public read bucket policy to %s", bucket)
	*/
	log.Printf("Public bucket %s created (or already existed). Default S3 permissions apply (private). Further policy/ACL changes required for public access.", bucket)
	return nil
}

func (s *S3Store) CreateSecureBucket(ctx context.Context, bucket, region string) error {
	// 1. Create the bucket itself
	err := s.createBucketInternal(ctx, bucket, region)
	if err != nil {
		return err // Error already wrapped in helper
	}

	// 2. Apply Default Server-Side Encryption (AES256)
	// Note: R2 enables encryption by default and may not support this call.
	// MinIO support depends on its configuration.
	_, err = s.Client.PutBucketEncryption(ctx, &s3.PutBucketEncryptionInput{
		Bucket: aws.String(bucket),
		ServerSideEncryptionConfiguration: &types.ServerSideEncryptionConfiguration{
			Rules: []types.ServerSideEncryptionRule{
				{
					ApplyServerSideEncryptionByDefault: &types.ServerSideEncryptionByDefault{
						SSEAlgorithm: types.ServerSideEncryptionAes256,
						// KMSMasterKeyID should only be set if using SSE-KMS
					},
					BucketKeyEnabled: aws.Bool(true), // Enable S3 Bucket Key for cost savings if using KMS, optional for AES256
				},
			},
		},
	})
	if err != nil {
		// Log error but potentially continue, as R2 might reject this but is already encrypted.
		log.Printf("Warning: Failed to apply default bucket encryption (SSE-AES256) to %s: %v. This might be expected for some providers like R2.", bucket, err)
		// Consider checking error type/message for specific provider behavior if needed.
	} else {
		log.Printf("Applied default server-side encryption (AES256) to bucket %s", bucket)
	}

	// 3. Apply Public Access Block (Restrict all public access)
	_, err = s.Client.PutPublicAccessBlock(ctx, &s3.PutPublicAccessBlockInput{
		Bucket: aws.String(bucket),
		PublicAccessBlockConfiguration: &types.PublicAccessBlockConfiguration{
			BlockPublicAcls:       aws.Bool(true),
			IgnorePublicAcls:      aws.Bool(true),
			BlockPublicPolicy:     aws.Bool(true),
			RestrictPublicBuckets: aws.Bool(true),
		},
	})
	if err != nil {
		// R2 enables this by default and may not support the call.
		log.Printf("Warning: Failed to apply public access block to %s: %v. This might be expected for some providers like R2.", bucket, err)
	} else {
		log.Printf("Applied strict public access block settings to bucket %s", bucket)
	}

	// 4. Apply Bucket Policy to enforce SSL/TLS transport
	// Note: This might be redundant if network-level controls enforce HTTPS.
	// R2 enforces TLS by default. MinIO depends on deployment.
	sslPolicy := fmt.Sprintf(
		`{
			"Id": "RequireTLS",
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AllowSSLRequestsOnly",
					"Action": "s3:*",
					"Effect": "Deny",
					"Resource": [
						"arn:aws:s3:::%s/*",
						"arn:aws:s3:::%s"
					],
					"Condition": {
						"Bool": {
							"aws:SecureTransport": "false"
						}
					},
					"Principal": "*"
				}
			]
		}`,
		bucket, bucket,
	)
	_, err = s.Client.PutBucketPolicy(ctx, &s3.PutBucketPolicyInput{
		Bucket: aws.String(bucket),
		Policy: aws.String(sslPolicy),
	})
	if err != nil {
		// Log error but potentially continue.
		log.Printf("Warning: Failed to apply RequireTLS bucket policy to %s: %v. This might be expected for some providers or configurations.", bucket, err)
	} else {
		log.Printf("Applied RequireTLS bucket policy to %s", bucket)
	}

	log.Printf("Secure bucket %s created (or already existed) and configured.", bucket)
	return nil
}
