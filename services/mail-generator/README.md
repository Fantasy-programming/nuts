# Mail Generator Service

A Node.js service using Fastify and react-email for generating HTML email templates.

## Features

- **Fastify** - Fast and low overhead web framework
- **React Email** - Create beautiful emails using React components
- **Template-based** - Pre-built templates for common email types

## Available Templates

### 1. Welcome Email
Generate a welcome email for new users.

**Endpoint:** `POST /templates/welcome`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "template": "welcome",
  "html": "<html>...</html>",
  "subject": "Welcome to Nuts, John Doe!"
}
```

### 2. Reset Password Email
Generate a password reset email.

**Endpoint:** `POST /templates/reset-password`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "resetLink": "https://example.com/reset/token123"
}
```

**Response:**
```json
{
  "template": "reset-password",
  "html": "<html>...</html>",
  "subject": "Reset Your Password - Nuts"
}
```

### 3. Notification Email
Generate a generic notification email.

**Endpoint:** `POST /templates/notification`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Transaction Alert",
  "message": "You have a new transaction of $50.00"
}
```

**Response:**
```json
{
  "template": "notification",
  "html": "<html>...</html>",
  "subject": "Transaction Alert"
}
```

## Running the Service

```bash
# Install dependencies
npm install

# Start the service
npm start

# The service will be available at http://localhost:3001
```

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "mail-generator"
}
```

## Environment Variables

- `PORT` - Port to run the service on (default: 3001)
- `HOST` - Host to bind to (default: 0.0.0.0)

## Integration

This service is designed to be used by the Nuts Go server's mailer package. The Go server calls these endpoints to generate HTML content for emails, then sends them via SMTP.