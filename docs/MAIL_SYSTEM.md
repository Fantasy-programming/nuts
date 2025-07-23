# Nuts Mail System

This implementation adds comprehensive email functionality to the Nuts personal finance application using a Go mailer package and a Node.js mail generation service.

## Architecture

### Go Mailer Package (`server/pkg/mailer`)
- **Library**: Uses `gomail` for SMTP email sending
- **Features**: 
  - Direct email sending with HTML/text content
  - Template-based emails via mail generator service
  - Convenience methods for common email types
  - Configurable SMTP settings

### Mail Generator Service (`services/mail-generator`)
- **Framework**: Fastify (Node.js)
- **Templates**: react-email for HTML generation
- **Templates Available**:
  - Welcome emails for new users
  - Password reset emails
  - Generic notification emails

### API Integration (`server/internal/domain/mail`)
- RESTful endpoints for sending emails
- Proper request validation
- Error handling and logging
- Integration with existing server architecture

## Usage

### Environment Configuration

Set these environment variables for the Go server:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@nuts.app
SMTP_FROM_NAME=Nuts App
```

### Starting Services

1. **Mail Generator Service**:
```bash
cd services/mail-generator
npm install
npm start
# Service runs on http://localhost:3001
```

2. **Go Server**:
```bash
cd server
go run cmd/api/main.go
# API available at http://localhost:8080/api
```

### API Endpoints

#### Send Welcome Email
```http
POST /api/mail/send-welcome
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Send Password Reset Email
```http
POST /api/mail/send-reset-password
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "resetLink": "https://nuts.app/reset/token123"
}
```

#### Send Notification Email
```http
POST /api/mail/send-notification
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Budget Alert",
  "message": "You have exceeded your monthly budget."
}
```

#### Send Custom Email
```http
POST /api/mail/send
Content-Type: application/json

{
  "to": ["user@example.com"],
  "subject": "Custom Subject",
  "body": "<h1>Custom HTML content</h1>",
  "isHtml": true
}
```

#### Send Template Email
```http
POST /api/mail/send-template
Content-Type: application/json

{
  "to": ["user@example.com"],
  "template": "welcome",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Programmatic Usage (Go)

```go
// In your Go code
import "github.com/Fantasy-Programming/nuts/server/pkg/mailer"

// Configure mailer
config := mailer.Config{
    Host:      "smtp.gmail.com",
    Port:      587,
    Username:  "your-email@gmail.com",
    Password:  "your-password",
    FromEmail: "noreply@nuts.app",
    FromName:  "Nuts App",
    MailGeneratorURL: "http://localhost:3001",
}

mailerService := mailer.NewService(config)

// Send welcome email
err := mailerService.SendWelcomeEmail(ctx, "John Doe", "john@example.com")

// Send custom email
email := &mailer.Email{
    To:      []string{"user@example.com"},
    Subject: "Custom Subject",
    Body:    "<h1>Hello!</h1>",
    IsHTML:  true,
}
err = mailerService.SendEmail(ctx, email)
```

## Testing

Run the test suite:

```bash
# Test mailer package
cd server
go test ./pkg/mailer -v

# Test mail system integration
./test-mail-system.sh
```

## Features

### ✅ Implemented
- [x] Go mailer package with gomail integration
- [x] SMTP configuration management
- [x] Node.js mail generator service with Fastify
- [x] HTML email templates using react-email
- [x] RESTful API endpoints for email operations
- [x] Template-based email generation
- [x] Welcome, reset password, and notification email templates
- [x] Comprehensive error handling and validation
- [x] Integration tests and examples
- [x] Documentation and usage examples

### 🚀 Ready for Production
- Configure SMTP settings for your email provider
- Deploy mail generator service alongside main application
- Add authentication/authorization to mail endpoints as needed
- Monitor email delivery and add logging/metrics

## Security Considerations

- **Authentication**: Mail endpoints should be protected with proper authentication
- **Rate Limiting**: Implement rate limiting to prevent email spam
- **Validation**: All email addresses and content are validated before sending
- **SMTP Security**: Use secure SMTP connections (TLS/SSL)
- **Environment Variables**: Keep SMTP credentials in environment variables, never in code