package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gopkg.in/gomail.v2"
)

// Email represents an email message
type Email struct {
	To      []string
	Cc      []string
	Bcc     []string
	Subject string
	Body    string
	IsHTML  bool
	Attachments []Attachment
}

// Attachment represents an email attachment
type Attachment struct {
	Filename string
	Content  []byte
	ContentType string
}

// TemplateRequest represents a request to the mail generator service
type TemplateRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	ResetLink string `json:"resetLink,omitempty"`
	Title     string `json:"title,omitempty"`
	Message   string `json:"message,omitempty"`
}

// TemplateResponse represents a response from the mail generator service
type TemplateResponse struct {
	Template string `json:"template"`
	HTML     string `json:"html"`
	Subject  string `json:"subject"`
}

// Service defines the interface for email operations
type Service interface {
	SendEmail(ctx context.Context, email *Email) error
	SendTemplateEmail(ctx context.Context, to []string, template string, data map[string]interface{}) error
	SendWelcomeEmail(ctx context.Context, name, email string) error
	SendResetPasswordEmail(ctx context.Context, name, email, resetLink string) error
	SendNotificationEmail(ctx context.Context, name, email, title, message string) error
	SendOTPEmail(ctx context.Context, name, email, otpCode string, expiresIn string) error
	SendWhatsNewEmail(ctx context.Context, name, email string, features []map[string]interface{}, version string) error
	SendSecurityEmail(ctx context.Context, name, email string, deviceInfo map[string]interface{}, location string, timestamp string) error
	SendDailyDigestEmail(ctx context.Context, name, email, date string, balanceSummary, transactions, insights map[string]interface{}) error
	SendLowBalanceAlertEmail(ctx context.Context, name, email, accountName string, currentBalance, threshold float64, currency string) error
}

// Config holds the configuration for the mailer service
type Config struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
	MailGeneratorURL string // URL for the mail generator service
}

// service implements the Service interface
type service struct {
	config Config
	dialer *gomail.Dialer
	httpClient *http.Client
}

// NewService creates a new mailer service
func NewService(config Config) Service {
	d := gomail.NewDialer(config.Host, config.Port, config.Username, config.Password)
	
	if config.MailGeneratorURL == "" {
		config.MailGeneratorURL = "http://localhost:3001"
	}
	
	return &service{
		config: config,
		dialer: d,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendEmail sends an email
func (s *service) SendEmail(ctx context.Context, email *Email) error {
	m := gomail.NewMessage()
	
	// Set sender
	m.SetHeader("From", fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail))
	
	// Set recipients
	m.SetHeader("To", email.To...)
	if len(email.Cc) > 0 {
		m.SetHeader("Cc", email.Cc...)
	}
	if len(email.Bcc) > 0 {
		m.SetHeader("Bcc", email.Bcc...)
	}
	
	// Set subject
	m.SetHeader("Subject", email.Subject)
	
	// Set body
	if email.IsHTML {
		m.SetBody("text/html", email.Body)
	} else {
		m.SetBody("text/plain", email.Body)
	}
	
	// Add attachments (simplified for now)
	// TODO: Implement proper attachment handling if needed
	_ = email.Attachments // Prevent unused variable error
	
	// Send the email
	return s.dialer.DialAndSend(m)
}

// Service implementation for testing purposes
type ServiceImpl struct {
	*service
}

// NewServiceForTesting creates a service with access to internal methods for testing
func NewServiceForTesting(config Config) *ServiceImpl {
	s := NewService(config).(*service)
	return &ServiceImpl{s}
}

// GenerateTemplate exposes the internal generateTemplate method for testing
func (s *ServiceImpl) GenerateTemplate(ctx context.Context, template string, data TemplateRequest) (*TemplateResponse, error) {
	return s.generateTemplate(ctx, template, data)
}
func (s *service) generateTemplate(ctx context.Context, template string, data TemplateRequest) (*TemplateResponse, error) {
	url := fmt.Sprintf("%s/templates/%s", s.config.MailGeneratorURL, template)
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template data: %w", err)
	}
	
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call mail generator service: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mail generator service returned status %d", resp.StatusCode)
	}
	
	var templateResp TemplateResponse
	if err := json.NewDecoder(resp.Body).Decode(&templateResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return &templateResp, nil
}

// SendTemplateEmail sends an email using a template
func (s *service) SendTemplateEmail(ctx context.Context, to []string, template string, data map[string]interface{}) error {
	// Convert data map to TemplateRequest
	var templateData TemplateRequest
	
	if name, ok := data["name"].(string); ok {
		templateData.Name = name
	}
	if email, ok := data["email"].(string); ok {
		templateData.Email = email
	}
	if resetLink, ok := data["resetLink"].(string); ok {
		templateData.ResetLink = resetLink
	}
	if title, ok := data["title"].(string); ok {
		templateData.Title = title
	}
	if message, ok := data["message"].(string); ok {
		templateData.Message = message
	}
	
	templateResp, err := s.generateTemplate(ctx, template, templateData)
	if err != nil {
		return fmt.Errorf("failed to generate template: %w", err)
	}
	
	email := &Email{
		To:      to,
		Subject: templateResp.Subject,
		Body:    templateResp.HTML,
		IsHTML:  true,
	}
	
	return s.SendEmail(ctx, email)
}

// SendWelcomeEmail sends a welcome email to a new user
func (s *service) SendWelcomeEmail(ctx context.Context, name, email string) error {
	data := map[string]interface{}{
		"name":  name,
		"email": email,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "welcome", data)
}

// SendResetPasswordEmail sends a password reset email
func (s *service) SendResetPasswordEmail(ctx context.Context, name, email, resetLink string) error {
	data := map[string]interface{}{
		"name":      name,
		"email":     email,
		"resetLink": resetLink,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "reset-password", data)
}

// SendNotificationEmail sends a notification email
func (s *service) SendNotificationEmail(ctx context.Context, name, email, title, message string) error {
	data := map[string]interface{}{
		"name":    name,
		"email":   email,
		"title":   title,
		"message": message,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "notification", data)
}

// SendOTPEmail sends an OTP verification email
func (s *service) SendOTPEmail(ctx context.Context, name, email, otpCode string, expiresIn string) error {
	if expiresIn == "" {
		expiresIn = "10 minutes"
	}
	data := map[string]interface{}{
		"name":      name,
		"email":     email,
		"otpCode":   otpCode,
		"expiresIn": expiresIn,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "otp", data)
}

// SendWhatsNewEmail sends a what's new features email
func (s *service) SendWhatsNewEmail(ctx context.Context, name, email string, features []map[string]interface{}, version string) error {
	data := map[string]interface{}{
		"name":     name,
		"email":    email,
		"features": features,
		"version":  version,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "whats-new", data)
}

// SendSecurityEmail sends a security alert email for new device access
func (s *service) SendSecurityEmail(ctx context.Context, name, email string, deviceInfo map[string]interface{}, location string, timestamp string) error {
	data := map[string]interface{}{
		"name":       name,
		"email":      email,
		"deviceInfo": deviceInfo,
		"location":   location,
		"timestamp":  timestamp,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "security", data)
}

// SendDailyDigestEmail sends a daily financial digest email
func (s *service) SendDailyDigestEmail(ctx context.Context, name, email, date string, balanceSummary, transactions, insights map[string]interface{}) error {
	data := map[string]interface{}{
		"name":           name,
		"email":          email,
		"date":           date,
		"balanceSummary": balanceSummary,
		"transactions":   transactions,
		"insights":       insights,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "daily-digest", data)
}

// SendLowBalanceAlertEmail sends a low balance alert email
func (s *service) SendLowBalanceAlertEmail(ctx context.Context, name, email, accountName string, currentBalance, threshold float64, currency string) error {
	if currency == "" {
		currency = "USD"
	}
	data := map[string]interface{}{
		"name":           name,
		"email":          email,
		"accountName":    accountName,
		"currentBalance": currentBalance,
		"threshold":      threshold,
		"currency":       currency,
	}
	return s.SendTemplateEmail(ctx, []string{email}, "low-balance-alert", data)
}