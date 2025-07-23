package mail

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/Fantasy-Programming/nuts/server/pkg/mailer"
	"github.com/Fantasy-Programming/nuts/server/pkg/router"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Handler struct {
	db        *pgxpool.Pool
	validator *validation.Validator
	jwt       *jwt.Service
	mailer    mailer.Service
	logger    *zerolog.Logger
}

type SendEmailRequest struct {
	To      []string `json:"to" validate:"required,min=1"`
	Subject string   `json:"subject" validate:"required"`
	Body    string   `json:"body" validate:"required"`
	IsHTML  bool     `json:"isHtml"`
}

type SendTemplateRequest struct {
	To       []string               `json:"to" validate:"required,min=1"`
	Template string                 `json:"template" validate:"required"`
	Data     map[string]interface{} `json:"data"`
}

type SendWelcomeRequest struct {
	Name  string `json:"name" validate:"required"`
	Email string `json:"email" validate:"required,email"`
}

type SendResetPasswordRequest struct {
	Name      string `json:"name" validate:"required"`
	Email     string `json:"email" validate:"required,email"`
	ResetLink string `json:"resetLink" validate:"required,url"`
}

type SendNotificationRequest struct {
	Name    string `json:"name" validate:"required"`
	Email   string `json:"email" validate:"required,email"`
	Title   string `json:"title" validate:"required"`
	Message string `json:"message" validate:"required"`
}

type SendOTPRequest struct {
	Name      string `json:"name" validate:"required"`
	Email     string `json:"email" validate:"required,email"`
	OTPCode   string `json:"otpCode" validate:"required"`
	ExpiresIn string `json:"expiresIn"`
}

type SendWhatsNewRequest struct {
	Name     string                   `json:"name" validate:"required"`
	Email    string                   `json:"email" validate:"required,email"`
	Features []map[string]interface{} `json:"features" validate:"required"`
	Version  string                   `json:"version"`
}

type SendSecurityRequest struct {
	Name       string                 `json:"name" validate:"required"`
	Email      string                 `json:"email" validate:"required,email"`
	DeviceInfo map[string]interface{} `json:"deviceInfo" validate:"required"`
	Location   string                 `json:"location"`
	Timestamp  string                 `json:"timestamp" validate:"required"`
}

type SendDailyDigestRequest struct {
	Name           string                 `json:"name" validate:"required"`
	Email          string                 `json:"email" validate:"required,email"`
	Date           string                 `json:"date" validate:"required"`
	BalanceSummary map[string]interface{} `json:"balanceSummary" validate:"required"`
	Transactions   map[string]interface{} `json:"transactions" validate:"required"`
	Insights       map[string]interface{} `json:"insights" validate:"required"`
}

type SendLowBalanceAlertRequest struct {
	Name           string  `json:"name" validate:"required"`
	Email          string  `json:"email" validate:"required,email"`
	AccountName    string  `json:"accountName" validate:"required"`
	CurrentBalance float64 `json:"currentBalance" validate:"required"`
	Threshold      float64 `json:"threshold" validate:"required"`
	Currency       string  `json:"currency"`
}

func RegisterHTTPHandlers(db *pgxpool.Pool, validator *validation.Validator, jwt *jwt.Service, mailer mailer.Service, logger *zerolog.Logger) router.Router {
	h := &Handler{
		db:        db,
		validator: validator,
		jwt:       jwt,
		mailer:    mailer,
		logger:    logger,
	}

	r := router.NewRouter()

	// Email sending endpoints
	r.Post("/send", h.sendEmail)
	r.Post("/send-template", h.sendTemplateEmail)
	r.Post("/send-welcome", h.sendWelcomeEmail)
	r.Post("/send-reset-password", h.sendResetPasswordEmail)
	r.Post("/send-notification", h.sendNotificationEmail)
	r.Post("/send-otp", h.sendOTPEmail)
	r.Post("/send-whats-new", h.sendWhatsNewEmail)
	r.Post("/send-security", h.sendSecurityEmail)
	r.Post("/send-daily-digest", h.sendDailyDigestEmail)
	r.Post("/send-low-balance-alert", h.sendLowBalanceAlertEmail)

	// Health check for mailer service
	r.Get("/health", h.health)

	return r
}

func (h *Handler) sendEmail(w http.ResponseWriter, r *http.Request) {
	var req SendEmailRequest
	ctx := r.Context()

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

	email := &mailer.Email{
		To:      req.To,
		Subject: req.Subject,
		Body:    req.Body,
		IsHTML:  req.IsHTML,
	}

	if err := h.mailer.SendEmail(r.Context(), email); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send email")
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.logger,
			Details:    email,
		})
		return
	}

	respond.Json(w, http.StatusOK, map[string]string{"message": "Email sent successfully"}, h.logger)
}

func (h *Handler) sendTemplateEmail(w http.ResponseWriter, r *http.Request) {
	var req SendTemplateRequest
	ctx := r.Context()

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

	if err := h.mailer.SendTemplateEmail(r.Context(), req.To, req.Template, req.Data); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send template email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Template email sent successfully"}, h.logger)
}

func (h *Handler) sendWelcomeEmail(w http.ResponseWriter, r *http.Request) {
	var req SendWelcomeRequest
	ctx := r.Context()

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

	if err := h.mailer.SendWelcomeEmail(r.Context(), req.Name, req.Email); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send welcome email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Welcome email sent successfully"}, h.logger)
}

func (h *Handler) sendResetPasswordEmail(w http.ResponseWriter, r *http.Request) {
	var req SendResetPasswordRequest
	ctx := r.Context()

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

	if err := h.mailer.SendResetPasswordEmail(r.Context(), req.Name, req.Email, req.ResetLink); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send reset password email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Reset password email sent successfully"}, h.logger)
}

func (h *Handler) sendNotificationEmail(w http.ResponseWriter, r *http.Request) {
	var req SendNotificationRequest
	ctx := r.Context()

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

	if err := h.mailer.SendNotificationEmail(r.Context(), req.Name, req.Email, req.Title, req.Message); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send notification email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Notification email sent successfully"}, h.logger)
}

func (h *Handler) sendOTPEmail(w http.ResponseWriter, r *http.Request) {
	var req SendOTPRequest
	ctx := r.Context()

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

	if err := h.mailer.SendOTPEmail(r.Context(), req.Name, req.Email, req.OTPCode, req.ExpiresIn); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send OTP email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "OTP email sent successfully"}, h.logger)
}

func (h *Handler) sendWhatsNewEmail(w http.ResponseWriter, r *http.Request) {
	var req SendWhatsNewRequest
	ctx := r.Context()

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

	if err := h.mailer.SendWhatsNewEmail(r.Context(), req.Name, req.Email, req.Features, req.Version); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send what's new email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "What's new email sent successfully"}, h.logger)
}

func (h *Handler) sendSecurityEmail(w http.ResponseWriter, r *http.Request) {
	var req SendSecurityRequest
	ctx := r.Context()

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

	if err := h.mailer.SendSecurityEmail(r.Context(), req.Name, req.Email, req.DeviceInfo, req.Location, req.Timestamp); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send security email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Security email sent successfully"}, h.logger)
}

func (h *Handler) sendDailyDigestEmail(w http.ResponseWriter, r *http.Request) {
	var req SendDailyDigestRequest
	ctx := r.Context()

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

	if err := h.mailer.SendDailyDigestEmail(r.Context(), req.Name, req.Email, req.Date, req.BalanceSummary, req.Transactions, req.Insights); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send daily digest email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Daily digest email sent successfully"}, h.logger)
}

func (h *Handler) sendLowBalanceAlertEmail(w http.ResponseWriter, r *http.Request) {
	var req SendLowBalanceAlertRequest
	ctx := r.Context()

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

	if err := h.mailer.SendLowBalanceAlertEmail(r.Context(), req.Name, req.Email, req.AccountName, req.CurrentBalance, req.Threshold, req.Currency); err != nil {
		h.logger.Error().Err(err).Msg("Failed to send low balance alert email")
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

	respond.Json(w, http.StatusOK, map[string]string{"message": "Low balance alert email sent successfully"}, h.logger)
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	respond.Json(w, http.StatusOK, map[string]string{"status": "ok", "service": "mailer"}, h.logger)
}