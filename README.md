<p align="center">
	<h1 align="center"><b>Nuts</b></h1>
<p align="center">
    Your personal finance OS
    <br />
    <br />
    <a href="https://nutsapp.ridyrich.engineer">Demo</a>
    ·
    <a href="https://nuts.ridyrich.engineer">Website</a>
    ·
    <a href="https://github.com/fantasy-programming/nuts/issues">Issues</a>
  </p>
</p>

## About Nuts

Nuts is a comprehensive personal finance management platform designed to be your complete financial operating system. Built with modern technologies and AI-powered insights, Nuts helps you track, categorize, and analyze your financial transactions across multiple accounts and platforms.

Whether you're managing personal finances, tracking business expenses, or analyzing spending patterns, Nuts provides the tools and intelligence you need to make informed financial decisions.

## ✨ Features

### 🤖 AI-Powered Transaction Processing
- **Neural Input Parsing**: Convert natural language like "bought coffee for $4.50" into structured transaction data
- **Smart Categorization**: Automatic transaction categorization using machine learning
- **Confidence Scoring**: AI confidence levels for parsed transactions
- **Multi-transaction Support**: Parse multiple transactions from a single input

### 📊 Transaction Management
- **Advanced Rules Engine**: Automatically categorize and organize transactions with custom rules
- **Multi-condition Logic**: Combine conditions using AND/OR logic for precise transaction matching
- **Bulk Processing**: Apply rules to existing transactions
- **Real-time Processing**: Automatic rule application for new transactions

### 🏦 Bank Connectivity
- **Global Coverage**: Connect banks worldwide through multiple providers
  - **North America**: Plaid, Teller
  - **Europe**: GoCardless
  - **Asia**: Brankas
  - **Africa**: Mono, Okra
- **Secure Connections**: Industry-standard security for all bank integrations
- **Real-time Sync**: Automatic transaction import and synchronization

### 📧 Comprehensive Email System
- **Rich Email Templates**: Beautiful, responsive email templates using React Email
- **Multiple Template Types**: Welcome, password reset, notifications, daily digest, security alerts
- **Multi-language Support**: Internationalization support for global users
- **Template Customization**: Easily customizable email templates with Tailwind CSS

### 📱 Multi-Platform Support
- **Web Application**: Modern React-based web interface
- **Mobile Apps**: Native mobile applications for iOS and Android
- **Responsive Design**: Seamless experience across all devices
- **Progressive Web App**: Offline capabilities and app-like experience

### 📈 Financial Intelligence
- **Daily Insights**: Automated daily financial summaries and insights
- **Spending Analysis**: Advanced analytics and spending pattern recognition
- **Budget Tracking**: Intelligent budget management and alerts
- **Financial Forecasting**: AI-powered predictions and recommendations

## 🚀 Get Started

### Quick Start with Docker

The fastest way to get Nuts running locally:

```bash
# Clone the repository
git clone https://github.com/Fantasy-Programming/nuts.git
cd nuts

# Start all services
docker-compose up -d
```

### Manual Setup

For development or custom deployments:

#### Prerequisites
- **Go 1.23+** (for backend server)
- **Node.js 18+** (for frontend and services)
- **PostgreSQL 17+** (for database)
- **Docker** (optional, for containerized services)

#### 1. Database Setup
```bash
# Start PostgreSQL (or use your existing instance)
docker run -d \
  --name nuts-postgres \
  -e POSTGRES_USER=nuts \
  -e POSTGRES_PASSWORD=nuts \
  -e POSTGRES_DB=nuts \
  -p 5432:5432 \
  postgres:17-alpine
```

#### 2. Backend Server
```bash
cd server

# Copy environment configuration
cp .env.example .env

# Install dependencies and run
go mod tidy
go run cmd/api/main.go
```

#### 3. Frontend Application
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. AI Service (Optional)
```bash
cd services/ai

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train initial model
python training/training_pipeline.py

# Start service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 5. Mail Generator Service (Optional)
```bash
cd services/mail-generator

# Install dependencies
npm install

# Start service
npm start
```

### Environment Configuration

Create `.env` files in the appropriate directories with your configuration:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nuts
DB_USER=nuts
DB_PASS=nuts

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Bank Connections (Optional)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
TELLER_APPLICATION_ID=your_teller_app_id

# AI/LLM Configuration (Optional)
LLM_PROVIDER=local
LLM_LOCAL_MODEL=gemma2:2b
```

## 📋 Documentation

### Getting Started
- **[Getting Started Guide](./docs/GETTING_STARTED.md)**: Comprehensive setup and first steps
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)**: Understanding the codebase architecture

### Features & Configuration
- **[Transaction Rules](./docs/transaction-rules.md)**: Configure automatic transaction processing
- **[Email System](./docs/MAIL_SYSTEM.md)**: Set up and customize the email system  
- **[AI/LLM Features](./server/pkg/llm/README.md)**: Neural transaction parsing documentation

### API & Development
- **[API Documentation](./docs/API.md)**: Complete API reference and examples
- **[Service Documentation](./services/)**: Individual service documentation
  - [AI Service](./services/ai/README.md)
  - [Mail Generator](./services/mail-generator/README.md)

## 🏗️ Project Structure

```
nuts/
├── client/              # React web application
├── mobile/              # React Native mobile app
├── server/              # Go backend API
├── services/
│   ├── ai/              # Python AI/ML service
│   └── mail-generator/  # Node.js email service
├── marketing/           # Astro marketing website
├── docs/                # Documentation
└── scripts/             # Utility scripts
```



## 🏗️ Architecture

Nuts follows a modern microservices architecture designed for scalability, maintainability, and developer experience.

### Core Technologies

**Frontend Stack:**
- **React 19** - Modern web interface with hooks and suspense
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Tanstack Router** - Type-safe routing
- **Tanstack Query** - Server state management

**Mobile Stack:**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe mobile development
- **NativeWind** - TailwindCSS for React Native

**Backend Stack:**
- **Go 1.23+** - High-performance REST API
- **Chi Router** - Lightweight HTTP router
- **PostgreSQL 17** - Primary database
- **SQLC** - Type-safe SQL code generation
- **River** - Background job processing

**AI/ML Stack:**
- **Python FastAPI** - AI service for transaction categorization
- **Scikit-learn** - Machine learning models
- **Ollama** - Local LLM inference
- **OpenAI/Gemini** - Remote LLM providers

**Infrastructure:**
- **Docker** - Containerization
- **MinIO** - S3-compatible object storage
- **Redis** - Caching and sessions
- **GitHub Actions** - CI/CD pipeline

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │ Marketing Site  │
│   (React/TS)    │    │ (React Native)  │    │    (Astro)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────────────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────┐
          │   API Gateway   │
          │   (Go/Chi)      │
          └─────────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐    ┌─────▼─────┐    ┌───▼────┐
│   AI   │    │   Mail    │    │  Core  │
│Service │    │Generator  │    │  API   │
│(Python)│    │ (Node.js) │    │  (Go)  │
└────────┘    └───────────┘    └───┬────┘
                                   │
                         ┌─────────▼─────────┐
                         │   PostgreSQL      │
                         │   MinIO Storage   │
                         └───────────────────┘
```

### External Integrations

**Banking Providers:**
- **Plaid** - North American banks (US, Canada)
- **Teller** - US banking with modern API
- **GoCardless** - European Open Banking
- **Brankas** - Southeast Asian banks
- **Mono/Okra** - African banking infrastructure

**Third-Party Services:**
- **Resend** - Transactional email delivery
- **PostHog** - Product analytics and feature flags
- **GitHub Actions** - Continuous integration and deployment
- **Paystack** - Payment processing (where applicable)

### Data Flow

1. **Transaction Import**: Bank connections automatically sync transactions
2. **AI Processing**: Neural parsing converts natural language to structured data
3. **Rule Engine**: Automatic categorization and organization
4. **Real-time Updates**: WebSocket connections for live updates
5. **Email Notifications**: Automated alerts and daily summaries
6. **Analytics**: Background processing for insights and forecasting

### Security & Privacy

- **End-to-End Encryption** for sensitive financial data
- **OAuth 2.0** authentication with bank providers
- **JWT** tokens for API authentication
- **Rate Limiting** on all API endpoints
- **Data Anonymization** for AI training
- **GDPR Compliance** with data export/deletion

## 🛠️ Development

### Prerequisites
- **Go 1.23+**
- **Node.js 18+** 
- **Python 3.9+**
- **PostgreSQL 17+**
- **Docker & Docker Compose**

### Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/nuts.git
   cd nuts
   ```

2. **Setup Development Environment**
   ```bash
   # Install development tools (if using devenv)
   direnv allow
   
   # Or install manually
   go install github.com/air-verse/air@latest
   npm install -g pnpm
   ```

3. **Start Development Services**
   ```bash
   # Start database and dependencies
   docker-compose up -d postgres redis minio
   
   # Start backend with hot reload
   cd server && air
   
   # Start frontend with hot reload
   cd client && pnpm dev
   
   # Start mobile development
   cd mobile && pnpm start
   ```

4. **Running Tests**
   ```bash
   # Backend tests
   cd server && go test ./...
   
   # Frontend tests
   cd client && pnpm test
   
   # AI service tests
   cd services/ai && python -m pytest
   ```

### Code Standards
- **Go**: Follow `gofmt` and `golangci-lint` standards
- **TypeScript**: ESLint + Prettier configuration
- **Python**: Black formatting + flake8 linting
- **Commit Messages**: Conventional commits format

### API Development
- Use `sqlc` for type-safe database queries
- Follow RESTful API conventions
- Document endpoints with OpenAPI/Swagger
- Add proper error handling and validation

## 🚀 Deployment

### Docker Deployment (Recommended)

```bash
# Production build
docker-compose -f compose.yml -f compose.prod.yml up -d

# Or use provided scripts
./scripts/deploy.sh production
```

### Manual Deployment

1. **Build Applications**
   ```bash
   # Build server
   cd server && go build -o bin/server cmd/api/main.go
   
   # Build client
   cd client && pnpm build
   
   # Build AI service
   cd services/ai && pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   # Copy and configure production environment
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

3. **Database Migration**
   ```bash
   # Run database migrations
   cd server && ./bin/server migrate
   ```

### Cloud Deployment

Nuts can be deployed on various cloud platforms:

- **AWS**: ECS/EKS with RDS PostgreSQL
- **Google Cloud**: Cloud Run with Cloud SQL
- **Azure**: Container Instances with Azure Database
- **DigitalOcean**: App Platform with Managed Database
- **Railway**: One-click deployment (coming soon)

### Environment Variables

Critical environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nuts

# Security
JWT_SECRET=your-super-secret-key
ENCRYPTION_KEY=32-byte-encryption-key

# External Services
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=production

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Storage
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports**: Submit detailed bug reports
- 💡 **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve docs, add examples, fix typos
- 🔧 **Code**: Submit pull requests for bug fixes or features
- 🌍 **Translations**: Help translate the app to other languages

### Getting Started
1. Check [existing issues](https://github.com/Fantasy-Programming/nuts/issues) for ways to contribute
2. Fork the repository and create your feature branch
3. Make your changes following our code standards
4. Add tests for new functionality
5. Submit a pull request with a clear description

### Development Guidelines
- **Write Tests**: All new features should include tests
- **Documentation**: Update docs for API changes
- **Performance**: Consider performance impact of changes
- **Security**: Never commit secrets or sensitive data
- **Accessibility**: Ensure UI changes are accessible

### Community
- **Discord**: Join our community for discussions
- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features

## 📄 License

This project is licensed under the **[AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)** for non-commercial use.

### Commercial Use

For commercial use or deployments requiring a setup fee, please contact us for a commercial license at [engineer@nuts.com](mailto:rich@nuts.com).

By using this software, you agree to the terms of the license.

---

<p align="center">
  <strong>Built with ❤️ by the Nuts team</strong>
  <br />
  <a href="https://nuts.ridyrich.engineer">Website</a> •
  <a href="https://nutsapp.ridyrich.engineer">Demo</a> •
  <a href="https://github.com/fantasy-programming/nuts/issues">Issues</a> •
  <a href="https://discord.gg/nuts">Discord</a>
</p>
