# Mail Generator Service

A TypeScript-based email template generation service using Fastify and react-email with Tailwind CSS support.

## Features

- **TypeScript Support**: Full type safety and excellent developer experience
- **React Email Templates**: Beautiful, responsive email templates using JSX
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Email Preview**: Live preview and development environment
- **Template Library**: Comprehensive set of email templates for financial applications

## Available Templates

### Core Templates
- **Welcome**: Onboarding email for new users
- **Reset Password**: Secure password reset functionality
- **Notification**: Generic notification template

### Financial Templates
- **OTP**: One-time password verification
- **What's New**: Feature announcements and updates
- **Security Alert**: New device access notifications
- **Daily Digest**: Comprehensive financial activity overview
- **Low Balance Alert**: Account balance warnings

## Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Start email preview (development):**
   ```bash
   npm run email:dev
   ```
   This opens a live preview at http://localhost:3002

### Production Build

1. **Build TypeScript:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## API Endpoints

All endpoints accept POST requests with JSON payloads and return HTML templates.

### Core Templates

#### Welcome Email
```http
POST /templates/welcome
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /templates/reset-password
Content-Type: application/json

{
  "name": "John Doe", 
  "email": "john@example.com",
  "resetLink": "https://app.com/reset/token123"
}
```

#### Notification
```http
POST /templates/notification
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com", 
  "title": "Important Update",
  "message": "Your account has been updated successfully."
}
```

### Financial Templates

#### OTP Verification
```http
POST /templates/otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "otpCode": "123456",
  "expiresIn": "10 minutes"
}
```

#### What's New Features
```http
POST /templates/whats-new
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "version": "2.1.0",
  "features": [
    {
      "title": "Smart Budgeting",
      "description": "AI-powered budget recommendations based on your spending patterns.",
      "imageUrl": "https://example.com/feature1.jpg"
    }
  ]
}
```

#### Security Alert
```http
POST /templates/security
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "deviceInfo": {
    "deviceType": "Desktop",
    "browser": "Chrome 120",
    "os": "macOS",
    "ipAddress": "192.168.1.1"
  },
  "location": "San Francisco, CA",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Daily Digest
```http
POST /templates/daily-digest
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "date": "2024-01-15",
  "balanceSummary": {
    "totalBalance": 5420.50,
    "previousBalance": 5380.25,
    "change": 40.25,
    "currency": "USD",
    "accounts": [
      {
        "name": "Checking Account",
        "balance": 2420.50,
        "type": "Checking"
      }
    ]
  },
  "transactions": [
    {
      "id": "tx123",
      "description": "Coffee Shop",
      "amount": -4.50,
      "category": "Food & Dining",
      "date": "2024-01-15",
      "account": "Credit Card"
    }
  ],
  "insights": [
    {
      "type": "spending",
      "title": "Increased Dining Spending",
      "message": "You spent 15% more on dining this week compared to last week.",
      "value": 45.30
    }
  ]
}
```

#### Low Balance Alert
```http
POST /templates/low-balance-alert
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "accountName": "Checking Account",
  "currentBalance": 125.50,
  "threshold": 200.00,
  "currency": "USD"
}
```

## Development Workflow

### Email Template Development

1. **Create new template** in `src/templates/`
2. **Add type definitions** in `src/types/index.ts`  
3. **Register endpoint** in `src/index.ts`
4. **Preview template** using `npm run email:dev`

### Template Structure

```typescript
import React from 'react';
import { Html, Head, Body, Container, Tailwind } from '@react-email/components';
import { YourTemplateProps } from '../types';

const YourTemplate: React.FC<YourTemplateProps> = ({ prop1, prop2 }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            {/* Your email content */}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default YourTemplate;
```

## Technologies Used

- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe JavaScript development
- **React Email**: Email template framework
- **Tailwind CSS**: Utility-first CSS framework
- **tsx**: TypeScript execution for development

## Configuration

### Environment Variables

```bash
PORT=3001          # Server port
HOST=0.0.0.0       # Server host
```

### Email Preview Configuration

Email development server runs on port 3002 by default. Configure in `react-email.config.js`:

```javascript
export default defineConfig({
  dir: './src/templates',
  port: 3002,
  open: false,
});
```

## Project Structure

```
src/
├── templates/           # Email templates
│   ├── welcome.tsx
│   ├── reset-password.tsx
│   ├── notification.tsx
│   ├── otp.tsx
│   ├── whats-new.tsx
│   ├── security.tsx
│   ├── daily-digest.tsx
│   └── low-balance-alert.tsx
├── types/
│   └── index.ts        # TypeScript type definitions
└── index.ts            # Main Fastify server

dist/                   # Compiled JavaScript output
react-email.config.js   # Email preview configuration
tsconfig.json          # TypeScript configuration
package.json           # Dependencies and scripts
```

## Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "mail-generator"
}
```