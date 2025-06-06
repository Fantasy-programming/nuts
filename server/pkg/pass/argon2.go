package pass

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

var (
	ErrInvalidHash         = errors.New("the encoded hash is not in the correct format")
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
	ErrInvalidPassword     = errors.New("password cannot be empty")

	// Minimum and maximum parameter bounds
	MinMemory      uint32 = 8 * 1024    // 8MB minimum
	MaxMemory      uint32 = 1024 * 1024 // 1GB maximum
	MinIterations  uint32 = 1
	MaxIterations  uint32 = 100
	MinParallelism uint8  = 1
	MaxParallelism uint8  = 255
)

// DefaultParams sets the default parameters for Argon2 hashing.
var DefaultParams = &Params{
	Memory:      64 * 1024,
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

// Params defines the parameters used for Argon2 hashing.
type Params struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

// ValidateParams validates the Argon2 parameters are within acceptable bounds.
func ValidateParams(p *Params) error {
	if p.Memory < MinMemory || p.Memory > MaxMemory {
		return fmt.Errorf("memory must be between %d and %d", MinMemory, MaxMemory)
	}
	if p.Iterations < MinIterations || p.Iterations > MaxIterations {
		return fmt.Errorf("iterations must be between %d and %d", MinIterations, MaxIterations)
	}
	if p.Parallelism < MinParallelism || p.Parallelism > MaxParallelism {
		return fmt.Errorf("parallelism must be between %d and %d", MinParallelism, MaxParallelism)
	}
	if p.SaltLength < 16 || p.KeyLength < 32 {
		return fmt.Errorf("salt length must be at least 16 and key length at least 32")
	}
	return nil
}

// HashPassword hashes a password using Argon2 and the specified parameters.
// It returns the encoded hash or an error if hashing fails.
func HashPassword(password string, params *Params) (string, error) {
	if password == "" {
		return "", ErrInvalidPassword
	}
	if params == nil {
		params = DefaultParams
	}
	if err := ValidateParams(params); err != nil {
		return "", fmt.Errorf("invalid parameters: %w", err)
	}

	// Generate a random salt
	salt, err := generateRandomBytes(params.SaltLength)
	if err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Hash the password using Argon2
	hash := argon2.IDKey([]byte(password), salt, params.Iterations, params.Memory, params.Parallelism, params.KeyLength)

	// encode the hash and password
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)

	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, params.Memory, params.Iterations, params.Parallelism, b64Salt, b64Hash), nil
}

// ComparePassAndHash compares a password to an encoded hash to verify if they match.
// It returns true if the password matches the hash, otherwise false.
func ComparePassAndHash(password, encodedHash string) (bool, error) {
	p, salt, hash, err := decodeHash(encodedHash)
	if err != nil {
		return false, fmt.Errorf("failed to decode hash: %w", err)
	}

	// Generate the hash from the input password using the extracted parameters
	otherHash := argon2.IDKey([]byte(password), salt, p.Iterations, p.Memory, p.Parallelism, p.KeyLength)

	// Use constant time comparison to prevent timing attacks
	return subtle.ConstantTimeCompare(hash, otherHash) == 1, nil
}

// generateRandomBytes generates a slice of random bytes of the specified length.
func generateRandomBytes(length uint32) ([]byte, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to generate random bytes: %w", err)
	}

	return bytes, nil
}

// decodeHash decodes the encoded hash to retrieve the parameters, salt, and hash.
// It returns the parameters, salt, and hash, or an error if decoding fails.
func decodeHash(encodedHash string) (*Params, []byte, []byte, error) {
	parts := strings.Split(encodedHash, "$")

	if len(parts) != 6 {
		return nil, nil, nil, ErrInvalidHash
	}

	// parse the argon2 version
	var version int
	_, err := fmt.Sscanf(parts[2], "v=%d", &version)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to parse version: %w", err)
	}

	if version != argon2.Version {
		return nil, nil, nil, ErrIncompatibleVersion
	}

	params := &Params{}

	_, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &params.Memory, &params.Iterations, &params.Parallelism)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to parse parameters: %w", err)
	}

	salt, err := base64.RawStdEncoding.Strict().DecodeString(parts[4])
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to decode salt: %w", err)
	}

	hash, err := base64.RawStdEncoding.Strict().DecodeString(parts[5])
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to decode hash: %w", err)
	}

	// Set the salt length and key length
	params.SaltLength = uint32(len(salt))
	params.KeyLength = uint32(len(hash))

	return params, salt, hash, nil
}

// GenerateRandomString generates a secure random string of the specified length
func GenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}
