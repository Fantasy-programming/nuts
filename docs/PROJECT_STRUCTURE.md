# Project Structure

This document provides a comprehensive overview of the Nuts project structure and organization.

## Repository Overview

```
nuts/
├── .github/                 # GitHub Actions workflows and templates
├── .vscode/                 # VS Code configuration and settings
├── client/                  # React web application
├── mobile/                  # React Native mobile application  
├── server/                  # Go backend API server
├── services/                # Microservices
│   ├── ai/                  # Python AI/ML service
│   └── mail-generator/      # Node.js email template service
├── marketing/               # Astro marketing website
├── docs/                    # Documentation files
├── scripts/                 # Utility and deployment scripts
├── compose.yml              # Docker Compose configuration
├── devenv.nix              # Development environment (Nix)
├── go.mod                  # Go module dependencies
└── README.md               # Main project documentation
```

## Component Details

### Web Client (`/client`)

Modern React application for the web interface.

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components and routing
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries and helpers
│   ├── stores/            # State management (Zustand)
│   ├── types/             # TypeScript type definitions
│   └── api/               # API client and types
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # TailwindCSS configuration
└── tsconfig.json          # TypeScript configuration
```

**Key Technologies:**
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Tanstack Router for routing
- Tanstack Query for server state
- Zustand for client state

### Mobile App (`/mobile`)

Cross-platform mobile application using React Native and Expo.

```
mobile/
├── src/
│   ├── app/               # Expo Router pages
│   ├── components/        # React Native components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and helpers
│   ├── stores/            # State management
│   ├── types/             # TypeScript definitions
│   └── translations/      # i18n translations
├── assets/                # Images, fonts, and static assets
├── android/               # Android-specific configuration
├── app.config.ts          # Expo configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

**Key Technologies:**
- React Native with Expo
- TypeScript for type safety
- NativeWind for styling
- Expo Router for navigation
- GluestackUI for components

### Backend Server (`/server`)

High-performance Go API server with clean architecture.

```
server/
├── cmd/
│   ├── api/              # Main API server entry point
│   ├── health/           # Health check service
│   └── route/            # Route definitions
├── internal/
│   ├── domain/           # Business logic and handlers
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── accounts/     # Account management
│   │   ├── transactions/ # Transaction processing
│   │   ├── rules/        # Transaction rules engine
│   │   └── mail/         # Email system
│   ├── middleware/       # HTTP middleware
│   ├── models/           # Data models and schemas
│   └── utils/            # Utility functions
├── pkg/
│   ├── mailer/           # Email service package
│   ├── llm/              # AI/LLM integration
│   ├── storage/          # File storage (S3/MinIO)
│   └── database/         # Database utilities
├── database/
│   ├── migrations/       # SQL migration files
│   └── queries/          # SQLC query definitions
├── config/               # Configuration management
├── locales/              # Internationalization files
├── Dockerfile            # Container configuration
├── go.mod                # Go module dependencies
└── sqlc.yaml             # SQLC configuration
```

**Key Technologies:**
- Go 1.23+ with clean architecture
- Chi router for HTTP routing
- PostgreSQL with SQLC for queries
- JWT for authentication
- River for background jobs

### AI Service (`/services/ai`)

Python-based AI service for transaction categorization and insights.

```
services/ai/
├── app/
│   ├── main.py           # FastAPI application
│   ├── models/           # ML model definitions
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── training/
│   ├── training_pipeline.py  # Model training pipeline
│   └── data_processing.py    # Data preprocessing
├── data/
│   ├── initial_training_data.csv  # Training dataset
│   ├── feedback.csv      # User feedback data
│   └── models/           # Trained model artifacts
├── requirements.txt      # Python dependencies
├── Dockerfile           # Container configuration
└── README.md            # Service documentation
```

**Key Technologies:**
- Python FastAPI
- Scikit-learn for ML models
- Pandas for data processing
- Joblib for model persistence

### Mail Generator (`/services/mail-generator`)

TypeScript service for generating beautiful email templates.

```
services/mail-generator/
├── src/
│   ├── templates/        # React Email templates
│   │   ├── welcome.tsx
│   │   ├── reset-password.tsx
│   │   ├── daily-digest.tsx
│   │   └── ...
│   ├── types/            # TypeScript definitions
│   └── index.ts          # Fastify server
├── dist/                 # Compiled JavaScript
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Service documentation
```

**Key Technologies:**
- Node.js with TypeScript
- Fastify web framework
- React Email for templates
- TailwindCSS for styling

### Marketing Site (`/marketing`)

Static marketing website built with Astro.

```
marketing/
├── src/
│   ├── components/       # Astro/React components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Static pages
│   ├── data/             # Content and blog posts
│   └── styles/           # CSS styles
├── public/               # Static assets
├── astro.config.mjs      # Astro configuration
└── package.json          # Dependencies and scripts
```

**Key Technologies:**
- Astro for static site generation
- React for interactive components
- TailwindCSS for styling
- Markdown for content

## Development Environment

### Prerequisites
- **Go 1.23+**: Backend development
- **Node.js 18+**: Frontend and services
- **Python 3.9+**: AI service
- **PostgreSQL 17+**: Database
- **Docker**: Containerization
- **pnpm**: Package manager (preferred)

### Development Tools
- **devenv**: Nix-based development environment
- **Air**: Go hot reloading
- **Vite**: Frontend build tool
- **Expo**: Mobile development
- **SQLC**: Type-safe SQL code generation

### Configuration Files
- **`.envrc`**: direnv configuration for environment loading
- **`devenv.nix`**: Nix development environment
- **`compose.yml`**: Docker services for development
- **`Taskfile.yml`**: Task runner configuration (server)

## Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Mobile    │    │  Marketing  │
│             │    │     App     │    │    Site     │
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       └─────────┬────────┘
                 │ HTTPS/WSS
       ┌─────────▼─────────┐
       │   Load Balancer   │
       │    (nginx)        │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │     API Server    │
       │       (Go)        │
       └─────┬───┬───┬─────┘
             │   │   │
    ┌────────▼─┐ │ ┌─▼─────────┐
    │   AI     │ │ │   Mail    │
    │ Service  │ │ │Generator  │
    │(Python)  │ │ │(Node.js)  │
    └────────┬─┘ │ └─┬─────────┘
             │   │   │
       ┌─────▼───▼───▼─────┐
       │    PostgreSQL     │
       │     Database      │
       └───────────────────┘
```

## Build and Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# Development mode with hot reload
./scripts/dev.sh
```

### Production Build
```bash
# Build all containers
docker-compose -f compose.yml -f compose.prod.yml build

# Deploy to production
./scripts/deploy.sh production
```

### CI/CD Pipeline
- **GitHub Actions** for automated testing and deployment
- **Multi-stage Docker builds** for optimized images
- **Database migrations** run automatically
- **Health checks** ensure service availability

## Security Considerations

### Authentication & Authorization
- JWT tokens for API authentication
- OAuth 2.0 for bank connections
- Role-based access control (RBAC)
- Session management with secure cookies

### Data Protection
- Encryption at rest for sensitive data
- TLS/SSL for data in transit
- Environment variable secrets
- Regular security audits

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Request/response logging

## Monitoring and Observability

### Logging
- Structured logging with zerolog (Go)
- Request/response logging
- Error tracking and alerting
- Performance metrics

### Health Checks
- Database connection health
- Service dependency checks
- Kubernetes readiness/liveness probes
- External service connectivity

### Analytics
- PostHog for product analytics
- Custom metrics for financial operations
- User behavior tracking
- Performance monitoring

## Contributing Guidelines

See the main [README.md](../README.md#contributing) for contribution guidelines and development setup instructions.
