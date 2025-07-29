package handlers

import (
	"encoding/base64"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/Fantasy-Programming/nuts/server/config"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/auth/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/ua"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/logging"
	"github.com/Fantasy-Programming/nuts/server/pkg/telemetry"
	"github.com/markbates/goth"
	"github.com/rs/zerolog"
)

const (
	oauthSessionCookieName = "oauth_session_state"
	googleProviderName     = "google"
	access_token_name      = "access_token"
	refresh_token_name     = "refresh_token"
)

var roles = []string{"user"}

type Handler struct {
	service   service.Auth
	config    *config.Config
	validator *validation.Validator
	logger    *zerolog.Logger
}

func NewHandler(service service.Auth, config *config.Config, validator *validation.Validator, logger *zerolog.Logger) *Handler {
	return &Handler{service, config, validator, logger}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req auth.LoginRequest
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "auth.Login")
	defer func() {
		metrics.End(http.StatusOK) // Default status, will be overridden if there's an error
	}()

	// Enhanced logging with trace context
	logger := logging.LoggerWithTraceCtx(ctx, h.logger)
	logger.Info().
		Str("handler", "auth.Login").
		Str("remote_addr", r.RemoteAddr).
		Msg("Login attempt started")

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		logger.Error().
			Err(err).
			Msg("Failed to parse login request")
		telemetry.RecordError(ctx, "validation_parse_error", "auth.Login")
		metrics.End(http.StatusBadRequest)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		logger.Warn().
			Err(valErr).
			Str("email", req.Email).
			Msg("Login request validation failed")
		telemetry.RecordError(ctx, "validation_error", "auth.Login")
		telemetry.RecordAuthEvent(ctx, "login", false)
		metrics.End(http.StatusBadRequest)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	agent := ua.Get().Parse(r.UserAgent())
	uaInfo := auth.UserAgentInfo{
		UserAgent: r.UserAgent(),
		IPAddress: r.RemoteAddr,
		Browser:   agent.Browser().String(),
		Device:    agent.Device().String(),
		OS:        agent.OS().String(),
		Location:  "TODO",
	}

	logger.Info().
		Str("email", req.Email).
		Str("browser", uaInfo.Browser).
		Str("device", uaInfo.Device).
		Str("os", uaInfo.OS).
		Msg("Processing login request")

	tokens, err := h.service.Login(ctx, req, uaInfo)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrWrongCred):
			logger.Warn().
				Str("email", req.Email).
				Msg("Login failed: wrong credentials")
			telemetry.RecordError(ctx, "wrong_credentials", "auth.Login")
			telemetry.RecordAuthEvent(ctx, "login", false)
			metrics.End(http.StatusUnauthorized)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusUnauthorized,
				ClientErr:  auth.ErrWrongCred,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    req.Email,
			})
			return

		case errors.Is(err, auth.ErrMissing2FACode):
			logger.Info().
				Str("email", req.Email).
				Msg("Login requires 2FA verification")
			telemetry.RecordAuthEvent(ctx, "login_2fa_required", true)
			metrics.End(http.StatusAccepted)
			respond.Json(w, http.StatusAccepted, auth.LoginResponse{TwoFARequired: true}, h.logger)
			return

		case errors.Is(err, auth.ErrWrong2FA):
			logger.Warn().
				Str("email", req.Email).
				Msg("Login failed: wrong 2FA code")
			telemetry.RecordError(ctx, "wrong_2fa", "auth.Login")
			telemetry.RecordAuthEvent(ctx, "login", false)
			metrics.End(http.StatusUnauthorized)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusUnauthorized,
				ClientErr:  auth.ErrWrong2FA, // safe for client
				ActualErr:  err,
				Logger:     h.logger,
				Details:    req.Email,
			})
			return

		default:
			logger.Error().
				Err(err).
				Str("email", req.Email).
				Msg("Login failed: internal error")
			telemetry.RecordError(ctx, "internal_error", "auth.Login")
			telemetry.RecordAuthEvent(ctx, "login", false)
			metrics.End(http.StatusInternalServerError)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusInternalServerError,
				ClientErr:  message.ErrInternalError,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    req,
			})
			return
		}
	}

	logger.Info().
		Str("email", req.Email).
		Msg("Login successful")

	// Record successful login
	telemetry.RecordAuthEvent(ctx, "login", true)

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     access_token_name,
		Value:    tokens.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     refresh_token_name,
		Value:    tokens.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Status(w, http.StatusOK)
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req auth.SignupRequest
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "auth.Signup")
	defer func() {
		metrics.End(http.StatusOK) // Default status, will be overridden if there's an error
	}()

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		telemetry.RecordError(ctx, "validation_parse_error", "auth.Signup")
		metrics.End(http.StatusBadRequest)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    r.Body,
		})
		return
	}

	if valErr != nil {
		telemetry.RecordError(ctx, "validation_error", "auth.Signup")
		telemetry.RecordAuthEvent(ctx, "signup", false)
		metrics.End(http.StatusBadRequest)
		respond.Errors(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrValidation,
			ActualErr:  valErr,
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	err = h.service.Signup(ctx, req)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrExistingUser):
			telemetry.RecordError(ctx, "existing_user", "auth.Signup")
			telemetry.RecordAuthEvent(ctx, "signup", false)
			metrics.End(http.StatusConflict)
			respond.Error(respond.ErrorOptions{
				R:          r,
				W:          w,
				StatusCode: http.StatusConflict,
				ClientErr:  auth.ErrExistingUser,
				ActualErr:  nil,
				Logger:     h.logger,
			})
			return

		default:
			telemetry.RecordError(ctx, "internal_error", "auth.Signup")
			telemetry.RecordAuthEvent(ctx, "signup", false)
			metrics.End(http.StatusInternalServerError)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusInternalServerError,
				ClientErr:  message.ErrInternalError,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    req,
			})
			return
		}
	}

	// Record successful signup
	telemetry.RecordAuthEvent(ctx, "signup", true)
	metrics.End(http.StatusCreated)
	respond.Json(w, http.StatusCreated, nil, h.logger)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "auth.Refresh")
	defer func() {
		metrics.End(http.StatusOK) // Default status, will be overridden if there's an error
	}()

	cookie, err := r.Cookie(refresh_token_name)
	if err != nil {
		telemetry.RecordError(ctx, "no_refresh_token", "auth.Refresh")
		telemetry.RecordAuthEvent(ctx, "token_refresh", false)
		metrics.End(http.StatusUnauthorized)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusUnauthorized,
			ClientErr:  jwt.ErrNoTokenFound,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	agent := ua.Get().Parse(r.UserAgent())
	uaInfo := auth.UserAgentInfo{
		UserAgent: r.UserAgent(),
		IPAddress: r.RemoteAddr,
		Browser:   agent.Browser().String(),
		Device:    agent.Device().String(),
		OS:        agent.OS().String(),
		Location:  "TODO",
	}

	tokens, err := h.service.RefreshTokens(ctx, cookie.Value, uaInfo)
	if err != nil {
		statusCode := http.StatusInternalServerError
		errorType := "internal_error"

		if errors.Is(err, jwt.ErrUnauthorized) || errors.Is(err, jwt.ErrInvalidToken) {
			statusCode = http.StatusUnauthorized
			errorType = "invalid_token"
		}

		telemetry.RecordError(ctx, errorType, "auth.Refresh")
		telemetry.RecordAuthEvent(ctx, "token_refresh", false)
		metrics.End(statusCode)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: statusCode,
			ClientErr:  err,
			ActualErr:  err,
			Logger:     h.logger,
		})
		return
	}

	// Record successful token refresh
	telemetry.RecordAuthEvent(ctx, "token_refresh", true)

	secure := os.Getenv("ENVIRONMENT") == "production"

	// Set new cookies
	http.SetCookie(w, &http.Cookie{
		Name:     access_token_name,
		Value:    tokens.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     refresh_token_name,
		Value:    tokens.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	respond.Json(w, http.StatusOK, nil, h.logger)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "auth.Logout")
	defer func() {
		metrics.End(http.StatusOK)
	}()

	cookie, err := r.Cookie(refresh_token_name)
	if err != nil {
		h.logger.Warn().Err(err).Msg("Refresh token cookie not found during logout")
	}

	if cookie != nil && cookie.Value != "" {
		userID, err := jwt.GetUserID(r)

		err = h.service.RevokeToken(ctx, userID, cookie.Value)
		if err != nil {
			h.logger.Error().Err(err).Str("userID", userID.String()).Msg("Failed to revoke refresh token on server during logout")
			telemetry.RecordError(ctx, "token_revoke_error", "auth.Logout")
		} else {
			h.logger.Info().Str("userID", userID.String()).Msg("Successfully revoked refresh token on server during logout")
			telemetry.RecordAuthEvent(ctx, "logout", true)
		}
	} else {
		telemetry.RecordAuthEvent(ctx, "logout", true)
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     access_token_name,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     refresh_token_name,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	respond.Status(w, http.StatusOK)
}

func (h *Handler) GoogleHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	encodedSession, url, err := h.service.OauthLogin(ctx, "google")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     oauthSessionCookieName,
		Value:    encodedSession,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		MaxAge:   int(10 * time.Minute / time.Second),
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *Handler) AppleHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	encodedSession, url, err := h.service.OauthLogin(ctx, "apple")
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     oauthSessionCookieName,
		Value:    encodedSession,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
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

	// Clear cookie after use
	http.SetCookie(w, &http.Cookie{
		Name:     oauthSessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		MaxAge:   -1, // Delete immediately
		SameSite: http.SameSiteLaxMode,
	})

	agent := ua.Get().Parse(r.UserAgent())
	uaInfo := auth.UserAgentInfo{
		UserAgent: r.UserAgent(),
		IPAddress: r.RemoteAddr,
		Browser:   agent.Browser().String(),
		Device:    agent.Device().String(),
		OS:        agent.OS().String(),
		Location:  "TODO",
	}

	tokens, err := h.service.HandleOauthCallback(ctx, googleProviderName, r.URL.Query(), provider, sess, uaInfo)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	secure := os.Getenv("ENVIRONMENT") == "production"
	redirectURL := h.config.RedirectSecure

	http.SetCookie(w, &http.Cookie{
		Name:     access_token_name,
		Value:    tokens.AccessToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     refresh_token_name,
		Value:    tokens.RefreshToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (h *Handler) InitiateMfaSetup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Start metrics measurement
	metrics := telemetry.NewRequestMetrics(ctx, r.Method, "auth.InitiateMfaSetup")
	defer func() {
		metrics.End(http.StatusOK) // Default status, will be overridden if there's an error
	}()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		telemetry.RecordError(ctx, "no_user_id", "auth.InitiateMfaSetup")
		metrics.End(http.StatusInternalServerError)
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	response, err := h.service.SetupMFA(ctx, userID)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrMissingUser):
			telemetry.RecordError(ctx, "missing_user", "auth.InitiateMfaSetup")
			telemetry.RecordAuthEvent(ctx, "mfa_setup_initiate", false)
			metrics.End(http.StatusUnauthorized)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusUnauthorized,
				ClientErr:  message.ErrUnauthorized,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    userID,
			})
		default:
			telemetry.RecordError(ctx, "internal_error", "auth.InitiateMfaSetup")
			telemetry.RecordAuthEvent(ctx, "mfa_setup_initiate", false)
			metrics.End(http.StatusInternalServerError)
			respond.Error(respond.ErrorOptions{
				W:          w,
				R:          r,
				StatusCode: http.StatusInternalServerError,
				ClientErr:  message.ErrInternalError,
				ActualErr:  err,
				Logger:     h.logger,
				Details:    userID,
			})
		}
		return
	}

	telemetry.RecordAuthEvent(ctx, "mfa_setup_initiate", true)
	respond.Json(w, http.StatusOK, response, h.logger)
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
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	var req auth.VerifyMfaRequest

	valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.logger,
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
			Logger:     h.logger,
			Details:    req,
		})
		return
	}

	err = h.service.VerifyMFA(ctx, userID, req)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})

		return
	}

	respond.Status(w, http.StatusOK)
}

func (h *Handler) DisableMfa(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	// TODO: Potentially add password or 2fa confirmation here for extra security before disabling MFA

	// if !totp.Validate(req.Code, user.TwoFASecret) {
	//     http.Error(w, "Invalid 2FA code. Cannot disable.", http.StatusUnauthorized)
	//     return
	// }

	err = h.service.DisableMFA(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
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
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	sessions, err := h.service.GetSessions(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, sessions, h.logger)
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
			Logger:     h.logger,
			Details:    sessionID,
		})
		return
	}

	err = h.service.RevokeSessions(ctx, sessionID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    nil,
		})
		return
	}

	respond.Status(w, http.StatusOK)
}
