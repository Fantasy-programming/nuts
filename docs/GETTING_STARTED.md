# Getting Started with Nuts

Welcome to Nuts! This comprehensive guide will help you set up and start using Nuts for your personal finance management needs.

## What is Nuts?

Nuts is a modern, AI-powered personal finance management platform that helps you:

- 📊 **Track transactions** across multiple accounts and banks
- 🤖 **Parse natural language** inputs like "bought coffee for $4.50"
- 🔄 **Automate categorization** with smart rules and AI
- 📧 **Receive insights** through automated email reports
- 📱 **Access anywhere** with web and mobile applications
- 🏦 **Connect banks** from around the world securely

## Quick Start Options

### Option 1: Try the Demo (Fastest)

Experience Nuts immediately with our hosted demo:

🚀 **[Try Demo](https://nutsapp.ridyrich.engineer)** - No installation required

### Option 2: One-Click Cloud Deployment

Deploy your own Nuts instance in minutes:

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=nuts)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=Fantasy-Programming/nuts)

### Option 3: Self-Host with Docker (Recommended)

Full control with local deployment using Docker.

## Self-Hosting Setup

### Prerequisites

Before you begin, ensure you have:

- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository
- **8GB RAM** and **2 CPU cores** (minimum)
- **Port 3000** available for the web interface

### Step 1: Clone the Repository

```bash
git clone https://github.com/Fantasy-Programming/nuts.git
cd nuts
```

### Step 2: Environment Configuration

Create your environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```bash
# Database Configuration
DB_NAME=nuts
DB_USER=nuts
DB_PASS=your_secure_password_here
DB_HOST=postgres
DB_PORT=5432

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@nuts.app
SMTP_FROM_NAME=Nuts App

# Domain Configuration
DOMAIN=localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Start the Services

Launch all Nuts services with a single command:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL**: Database server
- **Nuts Server**: Go backend API
- **Nuts Client**: React web application
- **AI Service**: Python ML service (optional)
- **Mail Generator**: Email template service (optional)

### Step 4: Access Your Nuts Instance

Once all services are running:

1. **Web Interface**: http://localhost:3000
2. **API Documentation**: http://localhost:8080/api/docs
3. **Health Check**: http://localhost:8080/health

### Step 5: Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Sign Up" to create your account
3. Verify your email (if SMTP is configured)
4. Complete the onboarding process

## Manual Development Setup

For developers who want to run services individually:

### Prerequisites

- **Go 1.23+**
- **Node.js 18+** with pnpm
- **Python 3.9+**
- **PostgreSQL 17+**

### Database Setup

```bash
# Start PostgreSQL
docker run -d \
  --name nuts-postgres \
  -e POSTGRES_USER=nuts \
  -e POSTGRES_PASSWORD=nuts \
  -e POSTGRES_DB=nuts \
  -p 5432:5432 \
  postgres:17-alpine

# Run migrations
cd server
go run cmd/migrate/main.go up
```

### Backend Server

```bash
cd server

# Install dependencies
go mod tidy

# Copy environment file
cp .env.example .env

# Start server with hot reload
go install github.com/air-verse/air@latest
air
```

The API server will be available at http://localhost:8080

### Frontend Application

```bash
cd client

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The web application will be available at http://localhost:5173

### AI Service (Optional)

```bash
cd services/ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train initial model
python training/training_pipeline.py

# Start service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Mail Generator Service (Optional)

```bash
cd services/mail-generator

# Install dependencies
npm install

# Start service
npm start
```

## First Steps After Installation

### 1. Create Your Profile

Complete your user profile with:
- **Name and email**
- **Timezone and currency preferences**
- **Security settings** (2FA recommended)

### 2. Add Your First Account

1. Go to **Accounts** → **Add Account**
2. Choose account type (Checking, Savings, Credit Card, etc.)
3. Enter account details:
   - **Name**: "Main Checking"
   - **Initial Balance**: Your current balance
   - **Currency**: USD (or your preferred currency)

### 3. Connect Your Bank (Optional)

For automatic transaction import:

1. Go to **Connections** → **Add Bank**
2. Choose your region/provider:
   - **US/Canada**: Plaid
   - **US Only**: Teller
   - **Europe**: GoCardless
   - **Asia**: Brankas
   - **Africa**: Mono/Okra
3. Follow the secure connection process
4. Select accounts to sync

### 4. Create Your First Transaction

#### Manual Entry
1. Go to **Transactions** → **Add Transaction**
2. Fill in the details:
   - **Account**: Select your account
   - **Amount**: -25.50 (negative for expenses)
   - **Description**: "Grocery shopping"
   - **Category**: Select or create category
   - **Date**: Today's date

#### AI-Powered Entry
1. Click **Quick Add** or use the search bar
2. Type naturally: "bought lunch for $12.50 at McDonald's"
3. Review the parsed transaction
4. Confirm and save

### 5. Set Up Transaction Rules

Automate your workflow with rules:

1. Go to **Settings** → **Rules**
2. Click **Create Rule**
3. Example rule:
   - **Name**: "Auto-categorize Starbucks"
   - **Condition**: Description contains "starbucks"
   - **Action**: Set category to "Coffee & Dining"
4. Save and enable the rule

### 6. Configure Email Notifications

Stay informed with automated emails:

1. Go to **Settings** → **Notifications**
2. Enable desired notifications:
   - **Daily Digest**: Daily summary of activities
   - **Low Balance Alerts**: When accounts go below threshold
   - **Large Transaction Alerts**: For transactions over set amount
   - **Weekly/Monthly Reports**: Periodic financial summaries

## Bank Connection Setup

### Plaid (US/Canada)

1. Sign up at [Plaid](https://plaid.com/)
2. Get your credentials:
   ```bash
   PLAID_CLIENT_ID=your_client_id
   PLAID_SECRET=your_secret_key
   PLAID_ENV=sandbox  # or 'development' or 'production'
   ```
3. Add to your `.env` file
4. Restart the server

### Teller (US)

1. Sign up at [Teller](https://teller.io/)
2. Get your Application ID:
   ```bash
   TELLER_APPLICATION_ID=your_app_id
   ```
3. Add to your `.env` file

### Other Providers

Similar setup process for:
- **GoCardless** (Europe)
- **Brankas** (Asia)
- **Mono/Okra** (Africa)

## Advanced Configuration

### AI/LLM Configuration

For natural language transaction parsing:

```bash
# Local AI (using Ollama)
LLM_PROVIDER=local
LLM_LOCAL_MODEL=gemma2:2b
LLM_LOCAL_ENDPOINT=http://localhost:11434

# Remote AI (using Gemini)
LLM_PROVIDER=remote
LLM_REMOTE_PROVIDER=gemini
LLM_REMOTE_API_KEY=your_gemini_api_key
LLM_REMOTE_MODEL=gemini-1.5-flash
```

### Email Configuration

#### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Configure SMTP:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

#### SendGrid Setup
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

### Storage Configuration

For file uploads and attachments:

```bash
# Local storage (default)
STORAGE_PROVIDER=local
STORAGE_PATH=/data/uploads

# S3-compatible storage
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_ENDPOINT=https://s3.amazonaws.com  # or MinIO endpoint
```

## Mobile App Setup

### Prerequisites
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (Mac) or **Android Studio**

### Development
```bash
cd mobile

# Install dependencies
pnpm install

# Start Expo dev server
pnpm start

# Run on iOS (Mac only)
pnpm ios

# Run on Android
pnpm android
```

### Configuration

Update the API endpoint in `mobile/src/config/api.ts`:

```typescript
export const API_BASE_URL = 'http://your-server:8080/api';
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different ports
docker-compose up -d --scale client=0
cd client && PORT=3001 pnpm dev
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs nuts_postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Email Not Working
1. Check SMTP credentials
2. Verify firewall/network settings
3. Test with a simple SMTP client
4. Check the mail generator service logs:
   ```bash
   docker logs nuts_mail-generator
   ```

### Getting Help

- **Documentation**: Check the `/docs` folder
- **GitHub Issues**: [Report bugs](https://github.com/Fantasy-Programming/nuts/issues)
- **Discord**: [Join our community](https://discord.gg/nuts)
- **Email Support**: support@nuts.app

### Performance Tuning

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_account ON transactions(account_id);
```

#### Docker Resource Limits
```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Next Steps

Once you have Nuts running:

1. **Import Historical Data**: Use CSV import to bring in existing transactions
2. **Set Up Budgets**: Create budgets for different categories
3. **Create Custom Categories**: Organize transactions your way
4. **Explore Reports**: Understand your spending patterns
5. **Mobile App**: Install the mobile app for on-the-go access
6. **API Integration**: Use the API for custom integrations

## Security Best Practices

1. **Use strong passwords** for all accounts
2. **Enable 2FA** where available
3. **Keep software updated** regularly
4. **Use HTTPS** in production
5. **Regular backups** of your database
6. **Monitor access logs** for suspicious activity

## Backup and Maintenance

### Database Backup
```bash
# Create backup
docker exec nuts_postgres pg_dump -U nuts nuts > backup.sql

# Restore backup
docker exec -i nuts_postgres psql -U nuts nuts < backup.sql
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d
```

Welcome to Nuts! We're excited to help you take control of your finances. 🌰