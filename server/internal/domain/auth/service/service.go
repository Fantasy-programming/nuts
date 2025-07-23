package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image/png"
	"net/url"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth"
	authRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/auth/repository"
	userRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/user/repository"
	userService "github.com/Fantasy-Programming/nuts/server/internal/domain/user/service"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/pass"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/markbates/goth"
	"github.com/pquerna/otp/totp"
)

type Auth interface {
	Login(ctx context.Context, req auth.LoginRequest, ua auth.UserAgentInfo) (*jwt.TokenPair, error)
	Signup(ctx context.Context, req auth.SignupRequest) error

	OauthLogin(ctx context.Context, provider string) (string, string, error)
	HandleOauthCallback(ctx context.Context, provider string, urlQuery url.Values, gothProvider goth.Provider, session goth.Session, ua auth.UserAgentInfo) (*jwt.TokenPair, error)

	SetupMFA(ctx context.Context, userID uuid.UUID) (auth.InitiateMfaResponse, error)
	VerifyMFA(ctx context.Context, userID uuid.UUID, request auth.VerifyMfaRequest) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error

	RefreshTokens(ctx context.Context, oldToken string, ua auth.UserAgentInfo) (*jwt.TokenPair, error)
	RevokeToken(ctx context.Context, userID uuid.UUID, oldToken string) error

	GetSessions(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error)
	RevokeSessions(ctx context.Context, userID uuid.UUID) error
}

type AuthService struct {
	userService  userService.Users
	userRepo     userRepo.Users
	authRepo     authRepo.Auth
	tokenService *jwt.Service
	encrypt      *encrypt.Encrypter
	db           *pgxpool.Pool
}

var roles = []string{"user"}

func New(db *pgxpool.Pool, authRepo authRepo.Auth, userRepo userRepo.Users, userService userService.Users, tokenService *jwt.Service, encrypt *encrypt.Encrypter) *AuthService {
	return &AuthService{
		authRepo:     authRepo,
		userRepo:     userRepo,
		tokenService: tokenService,
		userService:  userService,
		encrypt:      encrypt,
		db:           db,
	}
}

func (a *AuthService) Login(ctx context.Context, req auth.LoginRequest, ua auth.UserAgentInfo) (*jwt.TokenPair, error) {
	user, err := a.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return &jwt.TokenPair{}, auth.ErrWrongCred
		}

		return &jwt.TokenPair{}, message.ErrInternalError
	}

	res, err := pass.ComparePassAndHash(req.Password, *user.Password)
	if err != nil {
		return &jwt.TokenPair{}, message.ErrInternalError
	}

	if !res {
		return &jwt.TokenPair{}, auth.ErrWrongCred
	}

	if user.MfaEnabled {
		if req.TwoFACode == "" {
			return &jwt.TokenPair{}, auth.ErrMissing2FACode
		}

		decryptedSecret, err := a.encrypt.Decrypt(user.MfaSecret)
		if err != nil {
			return &jwt.TokenPair{}, message.ErrInternalError
		}

		// Validate 2FA code
		valid := totp.Validate(req.TwoFACode, string(decryptedSecret))

		if !valid {
			return &jwt.TokenPair{}, auth.ErrWrong2FA
		}
	}

	tokenPair, err := a.tokenService.GenerateTokenPair(ctx, jwt.SessionInfo{
		UserID:      user.ID,
		Roles:       roles,
		UserAgent:   &ua.UserAgent,
		IpAddress:   &ua.IPAddress,
		Location:    &ua.Location,
		BrowserName: &ua.Browser,
		DeviceName:  &ua.Device,
		OsName:      &ua.OS,
	})
	if err != nil {
		return &jwt.TokenPair{}, message.ErrInternalError
	}

	return tokenPair, nil
}

func (a *AuthService) Signup(ctx context.Context, req auth.SignupRequest) error {
	_, err := a.userRepo.GetUserByEmail(ctx, req.Email)

	if err == nil {
		return auth.ErrExistingUser
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return message.ErrInternalError
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		return message.ErrInternalError
	}

	_, err = a.userService.CreateUserWithDefaults(ctx, repository.CreateUserParams{
		Email:    req.Email,
		Password: &password,
	})
	if err != nil {
		return message.ErrInternalError
	}

	return nil
}

func (a *AuthService) RefreshTokens(ctx context.Context, oldToken string, ua auth.UserAgentInfo) (*jwt.TokenPair, error) {
	session := jwt.SessionInfo{
		Roles:       roles,
		UserAgent:   &ua.UserAgent,
		IpAddress:   &ua.IPAddress,
		Location:    &ua.Location,
		BrowserName: &ua.Browser,
		DeviceName:  &ua.Device,
		OsName:      &ua.OS,
	}

	return a.tokenService.RefreshAccessToken(ctx, session, oldToken)
}

func (a *AuthService) RevokeToken(ctx context.Context, userID uuid.UUID, oldToken string) error {
	return a.tokenService.RevokeRefreshToken(ctx, userID, oldToken)
}

func (a *AuthService) SetupMFA(ctx context.Context, userID uuid.UUID) (auth.InitiateMfaResponse, error) {
	user, err := a.userRepo.GetUserByID(ctx, userID)
	if err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return auth.InitiateMfaResponse{}, auth.ErrMissingUser
		}

		return auth.InitiateMfaResponse{}, err
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "nuts",
		AccountName: user.Email,
		SecretSize:  20,
	})
	if err != nil {
		return auth.InitiateMfaResponse{}, err
	}

	encryptedSecret, err := a.encrypt.Encrypt([]byte(key.Secret()))
	if err != nil {
		return auth.InitiateMfaResponse{}, err
	}

	err = a.authRepo.StoreMFASecret(ctx, repository.StoreMFASecretParams{
		ID:        userID,
		MfaSecret: encryptedSecret,
	})
	if err != nil {
		return auth.InitiateMfaResponse{}, err
	}

	img, err := key.Image(200, 200)
	if err != nil {
		return auth.InitiateMfaResponse{}, err
	}

	var buf bytes.Buffer
	err = png.Encode(&buf, img)
	if err != nil {
		return auth.InitiateMfaResponse{}, err
	}

	qrCodeUrl := "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())

	response := auth.InitiateMfaResponse{
		QrCodeUrl: qrCodeUrl,
		Secret:    key.Secret(),
	}

	return response, nil
}

func (a *AuthService) VerifyMFA(ctx context.Context, userID uuid.UUID, request auth.VerifyMfaRequest) error {
	encryptedSecret, err := a.authRepo.GetMFASecret(ctx, userID)
	if err != nil {
		return err
	}

	if encryptedSecret == nil {
		return auth.ErrMissingMFASecret
	}

	decryptedSecretBytes, err := a.encrypt.Decrypt(encryptedSecret)
	if err != nil {
		return err
	}

	decryptedSecret := string(decryptedSecretBytes)
	valid := totp.Validate(request.Otp, decryptedSecret)

	if !valid {
		return auth.ErrInvalidOrExpiredMfa
	}

	err = a.authRepo.EnableMFA(ctx, userID)

	return err
}

func (a *AuthService) DisableMFA(ctx context.Context, userID uuid.UUID) error {
	return a.authRepo.DisableMFA(ctx, userID)
}

func (a *AuthService) GetSessions(ctx context.Context, userID uuid.UUID) ([]repository.GetSessionsRow, error) {
	return a.tokenService.GetSessions(ctx, userID)
}

func (a *AuthService) RevokeSessions(ctx context.Context, userID uuid.UUID) error {
	return a.tokenService.RevokeSessions(ctx, userID)
}

func (a *AuthService) OauthLogin(ctx context.Context, provider string) (string, string, error) {
	authProvider, err := goth.GetProvider(provider)
	if err != nil {
		return "", "", err
	}

	sess, err := authProvider.BeginAuth("state")
	if err != nil {
		return "", "", err
	}

	url, err := sess.GetAuthURL()
	if err != nil {
		return "", "", err
	}

	// Store the session in a cookie (base64-encoded to avoid unsafe characters)
	marshaledSession := sess.Marshal()
	encodedSession := base64.StdEncoding.EncodeToString([]byte(marshaledSession))

	return encodedSession, url, nil
}

func (a *AuthService) HandleOauthCallback(ctx context.Context, provider string, urlQuery url.Values, gothProvider goth.Provider, session goth.Session, ua auth.UserAgentInfo) (*jwt.TokenPair, error) {
	_, err := session.Authorize(gothProvider, urlQuery)
	if err != nil {
		return &jwt.TokenPair{}, fmt.Errorf("OAuth authorization failed: " + err.Error())
	}

	oauthUser, err := gothProvider.FetchUser(session)
	if err != nil {
		return &jwt.TokenPair{}, fmt.Errorf("Failed to fetch Oauth user: " + err.Error())
	}

	// Look for user and if not found create one
	user, err := a.userRepo.GetUserByEmail(ctx, oauthUser.Email)
	userID := user.ID

	if err != nil {
		if err == pgx.ErrNoRows {
			firstName := oauthUser.FirstName

			if firstName == "" {
				firstName = oauthUser.Name
			}

			lastName := oauthUser.LastName

			tx, err := a.db.Begin(ctx)
			if err != nil {
				return &jwt.TokenPair{}, err
			}

			// Ensure transaction is rolled back on error
			defer func() {
				if err != nil {
					if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
						fmt.Println("Failed to roll the transaction")
					}
				}
			}()

			atxRepo := a.authRepo.WithTx(tx)
			utxRepo := a.userRepo.WithTx(tx)

			newUser, err := a.userService.CreateUserWithDefaults(ctx, repository.CreateUserParams{
				Email:     oauthUser.Email,
				FirstName: &firstName,
				LastName:  &lastName,
			})
			if err != nil {
				return &jwt.TokenPair{}, err
			}

			if oauthUser.AvatarURL != "" {
				_, err = utxRepo.UpdateUser(ctx, repository.UpdateUserParams{
					ID:        newUser.ID,
					AvatarUrl: &oauthUser.AvatarURL,
				})
				if err != nil {
					fmt.Println("Failed to update user avatar")
				}
			}

			// Add to linked accounts
			err = atxRepo.AddLinkedAccounts(ctx, repository.AddLinkedAccountParams{
				UserID:         newUser.ID,
				Provider:       provider,
				ProviderUserID: oauthUser.UserID,
				Email:          &oauthUser.Email,
			})
			if err != nil {
				return &jwt.TokenPair{}, err
			}

			// Commit the transaction
			if err = tx.Commit(ctx); err != nil {
				return &jwt.TokenPair{}, err
			}

			userID = newUser.ID
		}
		return &jwt.TokenPair{}, err
	}

	tokenPair, err := a.tokenService.GenerateTokenPair(ctx, jwt.SessionInfo{
		UserID:      userID,
		Roles:       roles,
		UserAgent:   &ua.UserAgent,
		IpAddress:   &ua.IPAddress,
		Location:    &ua.Location,
		BrowserName: &ua.Browser,
		DeviceName:  &ua.Device,
		OsName:      &ua.OS,
	})
	if err != nil {
		return &jwt.TokenPair{}, message.ErrInternalError
	}

	return tokenPair, nil
}
