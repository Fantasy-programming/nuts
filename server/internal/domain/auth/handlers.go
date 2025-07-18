package auth

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"image/png"
	"net/http"
	"os"
	"time"

	"github.com/pquerna/otp/totp"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/user"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/ua"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/pass"
	"github.com/jackc/pgx/v5"
	"github.com/markbates/goth"
	"github.com/rs/zerolog"
)

const (
	oauthSessionCookieName = "oauth_session_state"
	googleProviderName     = "google"
)

var roles = []string{"user"}

type Handler struct {
	v       *validation.Validator
	encrypt *encrypt.Encrypter
	config  *config.Config
	tkn     *jwt.Service
	repo    user.Repository
	log     *zerolog.Logger
}

func NewHandler(config *config.Config, validator *validation.Validator, encrypt *encrypt.Encrypter, tokenService *jwt.Service, repo user.Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, encrypt, config, tokenService, repo, logger}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	ctx := r.Context()

	valErr, err := h.v.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	user, err := h.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusUnauthorized,
				ClientErr:  ErrWrongCred,
				ActualErr:  err,
				Logger:     h.log,
				Details:    user,
			})
			return
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	res, err := pass.ComparePassAndHash(req.Password, *user.Password)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	if !res {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  ErrWrongCred,
			ActualErr:  nil,
			Logger:     h.log,
			Details:    nil,
		})
		return
	}

	if user.MfaEnabled {
		if req.TwoFACode == "" {
			// If 2FA is enabled but no code provided, tell client to request code
			respond.Json(w, http.StatusAccepted, LoginResponse{TwoFARequired: true}, h.log)
			return
		}

		decryptedSecret, err := h.encrypt.Decrypt(user.MfaSecret)
		if err != nil {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusInternalServerError,
				ClientErr:  message.ErrInternalError,
				ActualErr:  err,
				Logger:     h.log,
				Details:    req,
			})
			return
		}

		// Validate 2FA code
		valid := totp.Validate(req.TwoFACode, string(decryptedSecret))
		if !valid {
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusUnauthorized,
				ClientErr:  ErrWrong2FA,
				ActualErr:  err,
				Logger:     h.log,
				Details:    req,
			})
			return
		}
	}

	// Extract useful information

	userAgent := r.UserAgent()
	parser := ua.Get()
	agent := parser.Parse(userAgent)

	browser := agent.Browser().String()
	system := agent.OS().String()
	device := agent.Device().String()
	ip := r.RemoteAddr
	location := "todo"

	tokenPair, err := h.tkn.GenerateTokenPair(ctx, jwt.SessionInfo{
		UserID:      user.ID,
		Roles:       roles,
		UserAgent:   &userAgent,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser,
		DeviceName:  &device,
		OsName:      &system,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Status(w, http.StatusOK)
}

// @Summary Register a new user
// @Description Register a new user with email and password.
// @Tags Auth
// @Accept json
// @Produce json
// @Param user body models.User true "User registration details (email, password)"
// @Success 201 {object} map[string]string "message: User registered successfully"
// @Failure 400 {string} string "Invalid request body"
// @Failure 409 {string} string "Could not create user. Email might be taken."
// @Failure 500 {string} string "Error hashing password"
// @Router /register [post]
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	ctx := r.Context()

	valErr, err := h.v.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	// check for existing user
	_, err = h.repo.GetUserByEmail(ctx, req.Email)

	if err == nil {
		respond.Error(respond.ErrorOptions{
			R:          r,
			W:          w,
			StatusCode: http.StatusConflict,
			ClientErr:  ErrExistingUser,
			ActualErr:  nil,
			Logger:     h.log,
		})
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	password, err := pass.HashPassword(req.Password, pass.DefaultParams)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	queryParam := repository.CreateUserParams{
		Email:    req.Email,
		Password: &password,
	}

	_, err = h.repo.CreateUserWithDefaults(ctx, queryParam)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	respond.Json(w, http.StatusCreated, nil, h.log)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get refresh token from cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  jwt.ErrNoTokenFound,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	userAgent := r.UserAgent()
	parser := ua.Get()
	agent := parser.Parse(userAgent)

	browser := agent.Browser().String()
	system := agent.OS().String()
	device := agent.Device().String()
	ip := r.RemoteAddr
	location := "todo"

	session := jwt.SessionInfo{
		Roles:       roles,
		UserAgent:   &userAgent,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser,
		DeviceName:  &device,
		OsName:      &system,
	}

	// Get new token pair
	tokenPair, err := h.tkn.RefreshAccessToken(ctx, session, cookie.Value)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if errors.Is(err, jwt.ErrUnauthorized) || errors.Is(err, jwt.ErrInvalidToken) {
			statusCode = http.StatusUnauthorized
		}

		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  err,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	// Set new cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Json(w, http.StatusOK, nil, h.log)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	secure := os.Getenv("ENVIRONMENT") == "production"
	ctx := r.Context()

	// Get refresh token from cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		h.log.Warn().Err(err).Msg("Refresh token cookie not found during logout")
	}

	if cookie != nil && cookie.Value != "" {
		userID, err := jwt.GetUserID(r)

		if err != nil {
			// If we can't get the userID (e.g., access token is missing or invalid),
			// we can't revoke the specific refresh token on the server.
			// Log this, but proceed with client-side cookie clearing.
			h.log.Warn().Err(err).Msg("Could not get userID from token during logout; refresh token will not be revoked on server.")
		} else {
			// Attempt to revoke the refresh token on the server side.
			err = h.tkn.RevokeRefreshToken(ctx, userID, cookie.Value)
			if err != nil {
				// Log any error during server-side revocation, but don't let it block logout.
				h.log.Error().Err(err).Str("userID", userID.String()).Msg("Failed to revoke refresh token on server during logout")
			} else {
				h.log.Info().Str("userID", userID.String()).Msg("Successfully revoked refresh token on server during logout")
			}
		}
	}

	// Clear the access_token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	// Clear the refresh_token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	// Respond with a success message
	respond.Status(w, http.StatusOK)
}

func (h *Handler) GoogleHandler(w http.ResponseWriter, r *http.Request) {
	providerName := "google"

	provider, err := goth.GetProvider(providerName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sess, err := provider.BeginAuth("state")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	url, err := sess.GetAuthURL()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store the session in a cookie (base64-encoded to avoid unsafe characters)
	marshaledSession := sess.Marshal()
	encodedSession := base64.StdEncoding.EncodeToString([]byte(marshaledSession))

	http.SetCookie(w, &http.Cookie{
		Name:     oauthSessionCookieName,
		Value:    encodedSession,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		MaxAge:   int(10 * time.Minute / time.Second),
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *Handler) GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cookie, err := r.Cookie(oauthSessionCookieName)
	if err != nil {
		http.Error(w, "OAuth session cookie not found", http.StatusBadRequest)
		return
	}

	provider, err := goth.GetProvider(googleProviderName)
	if err != nil {
		http.Error(w, "Failed to Get Provider", http.StatusInternalServerError)
		return
	}

	decodedSession, err := base64.StdEncoding.DecodeString(cookie.Value)
	if err != nil {
		http.Error(w, "Failed to decode OAuth session", http.StatusBadRequest)
		return
	}

	sess, err := provider.UnmarshalSession(string(decodedSession))
	if err != nil {
		http.Error(w, "Failed to unmarshal OAuth session", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     oauthSessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		MaxAge:   -1, // Delete immediately
		SameSite: http.SameSiteLaxMode,
	})

	_, err = sess.Authorize(provider, r.URL.Query())
	if err != nil {
		http.Error(w, "OAuth authorization failed: "+err.Error(), http.StatusUnauthorized)
		return
	}

	gothUser, err := provider.FetchUser(sess)
	if err != nil {
		http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
		return
	}

	dbUser, err := h.repo.FindORCreateOAuthUser(ctx, gothUser, googleProviderName) // Pass providerName
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	userAgent := r.UserAgent()
	parser := ua.Get()
	agent := parser.Parse(userAgent)

	browser := agent.Browser().String()
	system := agent.OS().String()
	device := agent.Device().String()
	ip := r.RemoteAddr
	location := "todo"

	session := jwt.SessionInfo{
		UserID:      dbUser.ID,
		Roles:       roles,
		UserAgent:   &userAgent,
		IpAddress:   &ip,
		Location:    &location,
		BrowserName: &browser,
		DeviceName:  &device,
		OsName:      &system,
	}

	// Generate JWT token
	tokenPair, err := h.tkn.GenerateTokenPair(ctx, session)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokenPair.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokenPair.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	redirectURL := h.config.RedirectSecure

	if redirectURL == "" {
		redirectURL = "http://localhost:5173/dashboard"
	}

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (h *Handler) InitiateMfaSetup(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	user, err := h.repo.GetUserByID(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  message.ErrUnauthorized,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Generate TOTP key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "nuts",
		AccountName: user.Email,
		SecretSize:  20,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Encrypt the secret before storing
	encryptedSecret, err := h.encrypt.Encrypt([]byte(key.Secret()))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Store the encrypted secret (this also resets mfa_enabled to false)
	err = h.repo.StoreMFASecret(ctx, repository.StoreMFASecretParams{
		ID:        userID,
		MfaSecret: encryptedSecret,
	})
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Generate QR code image data URI
	img, err := key.Image(200, 200) // 200x200 pixels
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	var buf bytes.Buffer
	err = png.Encode(&buf, img)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    img,
		})
		return
	}

	qrCodeUrl := "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())

	response := InitiateMfaResponse{
		QrCodeUrl: qrCodeUrl,
		Secret:    key.Secret(), // Raw secret for manual entry
	}

	respond.Json(w, http.StatusOK, response, h.log)
}

func (h *Handler) VerifyMfaSetup(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	var req VerifyMfaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { /* Bad Request */
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.Body,
		})
		return
	}

	if err := h.v.Validator.Struct(req); err != nil { /* Validation Error */
		// validationErrors := validation.TranslateErrors(ctx, err)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  err,
			Logger:     h.log,
			Details:    req,
		})
		return
	}

	// Get the stored *encrypted* secret
	encryptedSecret, err := h.repo.GetMFASecret(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	if encryptedSecret == nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Decrypt the secret
	decryptedSecretBytes, err := h.encrypt.Decrypt(encryptedSecret)
	if err != nil {
		h.log.Error().Err(err).Msg("Failed to decrypt MFA secret")
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}
	decryptedSecret := string(decryptedSecretBytes)

	// Validate the OTP
	valid := totp.Validate(req.Otp, decryptedSecret)

	if !valid {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// Mark MFA as enabled in the database
	err = h.repo.EnableMFA(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

func (h *Handler) DisableMfa(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	// TODO: Potentially add password or 2fa confirmation here for extra security before disabling MFA

	// if !totp.Validate(req.Code, user.TwoFASecret) {
	//     http.Error(w, "Invalid 2FA code. Cannot disable.", http.StatusUnauthorized)
	//     return
	// }

	err = h.repo.DisableMFA(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}

func (h *Handler) GetSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	sessions, err := h.tkn.GetSessions(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, sessions, h.log)
}

func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := request.ParseUUID(r, "id")
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
			Details:    sessionID,
		})
		return
	}

	err = h.tkn.RevokeSessions(ctx, sessionID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    nil,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}
