package pass

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		params   *Params
		wantErr  bool
	}{
		{
			name:     "valid password with default params",
			password: "mysecurepassword",
			params:   nil,
			wantErr:  false,
		},
		{
			name:     "empty password",
			password: "",
			params:   DefaultParams,
			wantErr:  true,
		},
		{
			name:     "invalid params - low memory",
			password: "password",
			params:   &Params{Memory: 1024, Iterations: 3, Parallelism: 2, SaltLength: 16, KeyLength: 32},
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password, tt.params)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Empty(t, hash)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, hash)
			}
		})
	}
}

func TestComparePassAndHash(t *testing.T) {
	password := "mysecurepassword"
	hash, err := HashPassword(password, nil)
	require.NoError(t, err)

	tests := []struct {
		name     string
		password string
		hash     string
		want     bool
		wantErr  bool
	}{
		{
			name:     "matching password",
			password: password,
			hash:     hash,
			want:     true,
			wantErr:  false,
		},
		{
			name:     "wrong password",
			password: "wrongpassword",
			hash:     hash,
			want:     false,
			wantErr:  false,
		},
		{
			name:     "invalid hash format",
			password: password,
			hash:     "invalid$hash$format",
			want:     false,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			match, err := ComparePassAndHash(tt.password, tt.hash)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, match)
			}
		})
	}
}

func TestValidateParams(t *testing.T) {
	tests := []struct {
		name    string
		params  *Params
		wantErr bool
	}{
		{
			name:    "valid default params",
			params:  DefaultParams,
			wantErr: false,
		},
		{
			name: "invalid memory - too low",
			params: &Params{
				Memory:      1024,
				Iterations:  3,
				Parallelism: 2,
				SaltLength:  16,
				KeyLength:   32,
			},
			wantErr: true,
		},
		{
			name: "invalid iterations - too high",
			params: &Params{
				Memory:      64 * 1024,
				Iterations:  101,
				Parallelism: 2,
				SaltLength:  16,
				KeyLength:   32,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateParams(tt.params)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
