package jwt

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// SQLCTokenRepository adapts the sqlc-generated queries to implement the TokenRepository interface
type SQLCTokenRepository struct {
	queries *repository.Queries
}

// NewSQLCTokenRepository creates a new repository adapter for sqlc-generated queries
func NewSQLCTokenRepository(queries *repository.Queries) *SQLCTokenRepository {
	return &SQLCTokenRepository{
		queries: queries,
	}
}

// SaveToken stores a token in the database
func (r *SQLCTokenRepository) SaveToken(ctx context.Context, session SessionInfo, refreshToken string, expiresAt time.Time) error {
	err := r.queries.SaveUserToken(ctx, repository.SaveUserTokenParams{
		UserID:       session.UserID,
		UserAgent:    session.UserAgent,
		OsName:       session.OsName,
		IpAddress:    session.IpAddress,
		Location:     session.Location,
		BrowserName:  session.BrowserName,
		DeviceName:   session.DeviceName,
		RefreshToken: refreshToken,
		ExpiresAt:    pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return err
	}
	return nil
}

// GetToken retrieves a token from the database
func (r *SQLCTokenRepository) GetToken(ctx context.Context, userID uuid.UUID, refreshToken string) (TokenInfo, error) {
	token, err := r.queries.GetRefreshToken(ctx, repository.GetRefreshTokenParams{
		UserID:       userID,
		RefreshToken: refreshToken,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return TokenInfo{}, ErrNoTokenFound
		}
		return TokenInfo{}, err
	}

	return TokenInfo{
		ID:           token.ID,
		UserID:       token.UserID,
		RefreshToken: token.RefreshToken,
		ExpiresAt:    token.ExpiresAt,
		LastUsedAt:   token.LastUsedAt,
	}, nil
}

// DeleteExpiredTokens removes expired tokens from the database
func (r *SQLCTokenRepository) DeleteExpiredTokens(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DeleteExpiredTokens(ctx, userID)
}

// UpdateTokenLastUsed updates the last used timestamp of a token
func (r *SQLCTokenRepository) UpdateTokenLastUsed(ctx context.Context, tokenID uuid.UUID) error {
	return r.queries.UpdateTokenTimeSTamp(ctx, tokenID)
}

// DeleteUserTokens removes all tokens for a user
func (r *SQLCTokenRepository) DeleteUserTokens(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DeleteUserToken(ctx, userID)
}

func (r *SQLCTokenRepository) GetTokens(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error) {
	return r.queries.GetSessions(ctx, userID)
}

func (r *SQLCTokenRepository) RevokeToken(ctx context.Context, id uuid.UUID) error {
	return r.queries.RevokeSession(ctx, id)
}
