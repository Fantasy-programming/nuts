package jwt

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

var (
	ErrUnauthorized     = errors.New("unauthorized")
	ErrTokenExpired     = errors.New("token expired")
	ErrInvalidToken     = errors.New("invalid token")
	ErrNoTokenFound     = errors.New("no token found")
	ErrFailedTokenGen   = errors.New("failed to generate token")
	ErrFailedTokenStore = errors.New("failed to store token")
)

type AuthContextKey string

// Store user information in the request context
var ContextKey AuthContextKey = "user"

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// DefaultConfig returns a default configuration
func DefaultConfig() Config {
	return Config{
		AccessTokenDuration:  15 * time.Minute,
		RefreshTokenDuration: 7 * 24 * time.Hour,
		SigningKey:           "default-signing-key", // Should be overridden
	}
}

// NewService creates a new token service
func NewService(repo TokenRepository, config Config, logger *zerolog.Logger) *Service {
	return &Service{
		repo:   repo,
		config: config,
		logger: logger,
	}
}

// GenerateTokenPair creates new access and refresh tokens
func (s *Service) GenerateTokenPair(ctx context.Context, sessionInfo SessionInfo) (*TokenPair, error) {
	accessToken, err := s.generateToken(
		sessionInfo.UserID,
		sessionInfo.Roles,
		AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.generateToken(
		sessionInfo.UserID,
		sessionInfo.Roles,
		RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	err = s.StoreRefreshToken(ctx, sessionInfo, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// storeRefreshToken saves the refresh token to the repository
func (s *Service) StoreRefreshToken(ctx context.Context, session SessionInfo, refreshToken string) error {
	// TODO: Move to a job (Delete expired user tokens)
	if err := s.repo.DeleteExpiredTokens(ctx, session.UserID); err != nil {
		s.logger.Err(err).Msg("failed to clean up expired tokens")
	}

	expiresAt := time.Now().Add(s.config.RefreshTokenDuration)

	if err := s.repo.SaveToken(ctx, session, refreshToken, expiresAt); err != nil {
		return ErrFailedTokenStore
	}

	return nil
}

// RefreshAccessToken validates a refresh token and issues a new token pair
func (s *Service) RefreshAccessToken(ctx context.Context, session SessionInfo, refreshToken string) (*TokenPair, error) {
	// Parse and validate token
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Verify it's a refresh token
	tokenType, ok := claims["tokenType"].(string)
	if !ok || tokenType != string(RefreshToken) {
		return nil, ErrInvalidToken
	}

	// Extract user ID
	userIDStr, ok := claims["id"].(string)

	if !ok {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Verify token exists in database
	tokenInfo, err := s.repo.GetToken(ctx, userID, refreshToken)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Revoke Old Token
	if err := s.repo.RevokeToken(ctx, tokenInfo.ID); err != nil {
		s.logger.Err(err).Msg("failed to remove last used token")
	}

	session.UserID = userID

	// Generate new token pair
	return s.GenerateTokenPair(ctx, session)
}

// VerifyAccessToken validates an access token and returns its claims
func (s *Service) VerifyAccessToken(tokenString string) (jwt.MapClaims, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return nil, err
	}

	// Verify it's an access token
	tokenType, ok := claims["tokenType"].(string)

	if !ok || tokenType != string(AccessToken) {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func (s *Service) GetSessions(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error) {
	return s.repo.GetTokens(ctx, userID)
}

func (s *Service) RevokeSessions(ctx context.Context, id uuid.UUID) error {
	return s.repo.RevokeToken(ctx, id)
}

func (s *Service) InvalidateTokens(ctx context.Context, userID uuid.UUID) error {
	return s.repo.DeleteUserTokens(ctx, userID)
}

// RevokeRefreshToken deletes a specific refresh token from the repository.
func (s *Service) RevokeRefreshToken(ctx context.Context, userID uuid.UUID, refreshTokenValue string) error {
	tokenInfo, err := s.repo.GetToken(ctx, userID, refreshTokenValue)
	if err != nil {
		if errors.Is(err, ErrNoTokenFound) {
			// If the token is not found, it might have been revoked already or never existed.
			// This is not an error in the context of a logout operation.
			s.logger.Warn().Str("userID", userID.String()).Msg("Refresh token not found during revocation, possibly already revoked or invalid.")
			return nil
		}
		s.logger.Err(err).Str("userID", userID.String()).Msg("Error retrieving token for revocation")
		return fmt.Errorf("failed to get token for revocation: %w", err)
	}

	err = s.repo.RevokeToken(ctx, tokenInfo.ID)
	if err != nil {
		s.logger.Err(err).Str("tokenID", tokenInfo.ID.String()).Msg("Error revoking token by ID")
		return fmt.Errorf("failed to revoke token: %w", err)
	}

	s.logger.Info().Str("tokenID", tokenInfo.ID.String()).Str("userID", userID.String()).Msg("Successfully revoked refresh token")
	return nil
}

// generateToken creates a new JWT token
func (s *Service) generateToken(userID uuid.UUID, roles []string, tokenType TokenType) (string, error) {
	claims := jwt.MapClaims{
		"id":        userID.String(),
		"tokenType": string(tokenType),
		"iat":       time.Now().Unix(),
		"jti":       uuid.New().String(),
	}

	var expiration time.Duration

	switch tokenType {
	case AccessToken:
		claims["roles"] = roles
		expiration = s.config.AccessTokenDuration
	case RefreshToken:
		expiration = s.config.RefreshTokenDuration
	}

	claims["exp"] = time.Now().Add(expiration).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.SigningKey))
}

// parseToken validates and parses a JWT token
func (s *Service) parseToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.SigningKey), nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}

	if !token.Valid {
		return nil, ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

//TODO: Implement this
// We need to store the IDs of all shared finance groups the user is an active member of in the request context.
// // Define context keys for user ID and shared finance IDs
// type contextKey string
//
// const UserIDContextKey contextKey = "userID"
// const SharedFinanceIDsContextKey contextKey = "sharedFinanceIDs" // []uuid.UUID of groups user is member of
// const ActiveSharedFinanceContextKey contextKey = "activeSharedFinance" // User's currently selected shared finance ID (if any)
//
// // AuthMiddleware validates JWT and sets user ID and shared finance IDs in request context.
// func AuthMiddleware(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		authHeader := r.Header.Get("Authorization")
// 		if authHeader == "" {
// 			http.Error(w, "Missing authorization token", http.StatusUnauthorized)
// 			return
// 		}
//
// 		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
// 		if tokenString == authHeader {
// 			http.Error(w, "Invalid token format", http.StatusUnauthorized)
// 			return
// 		}
//
// 		claims := &jwt.StandardClaims{}
// 		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
// 			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
// 				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
// 			}
// 			return jwtKey, nil
// 		})
//
// 		if err != nil || !token.Valid {
// 			config.Log.WithField("token", tokenString).WithError(err).Warn("Token validation failed")
// 			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
// 			return
// 		}
//
// 		userID, err := uuid.Parse(claims.Subject)
// 		if err != nil {
// 			config.Log.WithField("subject", claims.Subject).WithError(err).Error("Invalid user ID in token subject")
// 			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
// 			return
// 		}
//
// 		// Fetch shared finance IDs the user is a member of (status='accepted')
// 		var sharedFinanceIDs []uuid.UUID
// 		rows, err := db.GetDB().Query(`SELECT shared_finance_id FROM shared_finance_members WHERE user_id = $1 AND status = 'accepted'`, userID)
// 		if err != nil {
// 			config.Log.WithField("userID", userID).WithError(err).Error("Failed to fetch shared finance memberships")
// 			http.Error(w, "Internal server error fetching shared finance memberships", http.StatusInternalServerError)
// 			return
// 		}
// 		defer rows.Close()
// 		for rows.Next() {
// 			var sharedID uuid.UUID
// 			if err := rows.Scan(&sharedID); err != nil {
// 				config.Log.WithError(err).Warn("Error scanning shared finance ID")
// 				continue
// 			}
// 			sharedFinanceIDs = append(sharedFinanceIDs, sharedID)
// 		}
// 		if err = rows.Err(); err != nil {
// 			config.Log.WithError(err).Error("Error iterating shared finance rows")
// 			http.Error(w, "Internal server error iterating shared finance memberships", http.StatusInternalServerError)
// 			return
// 		}
//
// 		ctx := context.WithValue(r.Context(), UserIDContextKey, userID)
// 		ctx = context.WithValue(ctx, SharedFinanceIDsContextKey, sharedFinanceIDs)
//
// 		// Determine active shared finance context from header/query param
// 		// The client will send a header or query param like X-Shared-Finance-ID
// 		// to indicate which shared context they are currently viewing/operating on.
// 		activeSharedFinanceIDStr := r.Header.Get("X-Shared-Finance-ID")
// 		if activeSharedFinanceIDStr != "" {
// 			activeSharedFinanceID, parseErr := uuid.Parse(activeSharedFinanceIDStr)
// 			if parseErr != nil {
// 				config.Log.WithField("activeSharedFinanceIDStr", activeSharedFinanceIDStr).WithError(parseErr).Warn("Invalid X-Shared-Finance-ID header format")
// 				// Don't set, treat as personal context
// 			} else {
// 				// Verify user is actually a member of this active shared finance group
// 				isMember := false
// 				for _, id := range sharedFinanceIDs {
// 					if id == activeSharedFinanceID {
// 						isMember = true
// 						break
// 					}
// 				}
// 				if isMember {
// 					// Fetch shared finance name for context (optional, but useful)
// 					var sfName sql.NullString
// 					err = db.GetDB().QueryRow("SELECT name FROM shared_finances WHERE id = $1", activeSharedFinanceID).Scan(&sfName)
// 					if err == nil {
// 						activeContext := models.SharedFinanceContext{
// 							Type: "shared",
// 							SharedFinanceID: &activeSharedFinanceID,
// 							SharedFinanceName: utils.NullStringToStringPtr(sfName),
// 						}
// 						ctx = context.WithValue(ctx, ActiveSharedFinanceContextKey, activeContext)
// 					} else {
// 						config.Log.WithField("sharedFinanceID", activeSharedFinanceID).WithError(err).Warn("Shared finance name not found for active context")
// 						// Still set active ID, just without name
// 						activeContext := models.SharedFinanceContext{Type: "shared", SharedFinanceID: &activeSharedFinanceID}
// 						ctx = context.WithValue(ctx, ActiveSharedFinanceContextKey, activeContext)
// 					}
// 				} else {
// 					config.Log.WithField("userID", userID).WithField("sharedFinanceID", activeSharedFinanceID).Warn("User attempted to access shared finance not a member of")
// 					// User is not a member, treat as personal context
// 				}
// 			}
// 		} else {
// 			// Default to personal context if no shared finance ID is provided
// 			ctx = context.WithValue(ctx, ActiveSharedFinanceContextKey, models.SharedFinanceContext{Type: "personal"})
// 		}
//
// 		next.ServeHTTP(w, r.WithContext(ctx))
// 	})
// }
//
// // GetUserAccessScope returns the user's ID and all shared finance IDs they can access.
// func GetUserAccessScope(ctx context.Context) (uuid.UUID, []uuid.UUID, error) {
// 	userID, ok := ctx.Value(UserIDContextKey).(uuid.UUID)
// 	if !ok {
// 		return uuid.Nil, nil, fmt.Errorf("user ID not found in context")
// 	}
// 	sharedFinanceIDs, ok := ctx.Value(SharedFinanceIDsContextKey).([]uuid.UUID)
// 	if !ok {
// 		sharedFinanceIDs = []uuid.UUID{} // Default to empty slice if not set
// 	}
// 	return userID, sharedFinanceIDs, nil
// }
//
// // GetActiveSharedFinanceContext returns the currently selected shared finance context for operations.
// func GetActiveSharedFinanceContext(ctx context.Context) models.SharedFinanceContext {
//     val := ctx.Value(ActiveSharedFinanceContextKey)
//     if val == nil {
//         return models.SharedFinanceContext{Type: "personal"}
//     }
//     return val.(models.SharedFinanceContext)
// }
