# API Documentation

This document provides an overview of the Nuts API endpoints and services.

## Base URLs

- **Development**: `http://localhost:8080/api`
- **Production**: `https://api.nuts.app` (or your domain)

## Authentication

Most endpoints require authentication using JWT tokens.

### Authentication Flow

1. **Login/Register**: Obtain JWT token
2. **Token Usage**: Include in `Authorization` header
3. **Token Refresh**: Use refresh endpoint when needed

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Core API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new user account |
| `POST` | `/auth/login` | Authenticate user |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/auth/refresh` | Refresh JWT token |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset user password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/profile` | Get current user profile |
| `PUT` | `/users/profile` | Update user profile |
| `DELETE` | `/users/account` | Delete user account |
| `GET` | `/users/preferences` | Get user preferences |
| `PUT` | `/users/preferences` | Update preferences |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/accounts` | List user accounts |
| `POST` | `/accounts` | Create new account |
| `GET` | `/accounts/{id}` | Get account details |
| `PUT` | `/accounts/{id}` | Update account |
| `DELETE` | `/accounts/{id}` | Delete account |
| `GET` | `/accounts/{id}/balance` | Get account balance |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | List transactions |
| `POST` | `/transactions` | Create transaction |
| `GET` | `/transactions/{id}` | Get transaction details |
| `PUT` | `/transactions/{id}` | Update transaction |
| `DELETE` | `/transactions/{id}` | Delete transaction |
| `POST` | `/transactions/bulk` | Create multiple transactions |
| `POST` | `/transactions/import` | Import from CSV/OFX |

### AI-Powered Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions/neural-input` | Parse natural language input |
| `POST` | `/transactions/categorize` | AI categorization |
| `GET` | `/transactions/insights` | AI insights and recommendations |

### Transaction Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rules` | List transaction rules |
| `POST` | `/rules` | Create new rule |
| `GET` | `/rules/{id}` | Get rule details |
| `PUT` | `/rules/{id}` | Update rule |
| `DELETE` | `/rules/{id}` | Delete rule |
| `POST` | `/rules/{id}/toggle` | Enable/disable rule |
| `POST` | `/rules/apply/{transactionId}` | Apply rules to transaction |

### Bank Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/connections` | List bank connections |
| `POST` | `/connections/plaid/link` | Create Plaid link token |
| `POST` | `/connections/plaid/exchange` | Exchange public token |
| `POST` | `/connections/teller/connect` | Connect Teller account |
| `PUT` | `/connections/{id}/sync` | Manually sync connection |
| `DELETE` | `/connections/{id}` | Remove connection |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create custom category |
| `PUT` | `/categories/{id}` | Update category |
| `DELETE` | `/categories/{id}` | Delete category |

### Reports & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/spending` | Spending analysis |
| `GET` | `/reports/income` | Income analysis |
| `GET` | `/reports/trends` | Spending trends |
| `GET` | `/reports/budgets` | Budget vs actual |
| `GET` | `/reports/net-worth` | Net worth over time |

### Email System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/mail/send` | Send custom email |
| `POST` | `/mail/send-template` | Send template email |
| `POST` | `/mail/send-welcome` | Send welcome email |
| `POST` | `/mail/send-reset-password` | Send password reset |
| `POST` | `/mail/send-notification` | Send notification |

## Service APIs

### AI Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/categorize` | Categorize transactions |
| `POST` | `/insights` | Generate insights |
| `POST` | `/forecast` | Financial forecasting |
| `POST` | `/train_feedback` | Submit training feedback |

### Mail Generator (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/templates/welcome` | Generate welcome email |
| `POST` | `/templates/reset-password` | Generate reset email |
| `POST` | `/templates/notification` | Generate notification |
| `POST` | `/templates/daily-digest` | Generate daily digest |
| `POST` | `/templates/otp` | Generate OTP email |
| `POST` | `/templates/security` | Generate security alert |

## Request/Response Examples

### Neural Input Processing

**Request:**
```http
POST /api/transactions/neural-input
Content-Type: application/json
Authorization: Bearer {token}

{
  "input": "Bought coffee at Starbucks for $4.50 and gas for $45",
  "user_timezone": "America/New_York",
  "base_currency": "USD",
  "account_context": "Personal checking account"
}
```

**Response:**
```json
{
  "transactions": [
    {
      "amount": "4.50",
      "type": "expense",
      "description": "Coffee at Starbucks",
      "category_hint": "food",
      "currency_code": "USD",
      "confidence": 0.92
    },
    {
      "amount": "45.00",
      "type": "expense", 
      "description": "Gas",
      "category_hint": "transport",
      "currency_code": "USD",
      "confidence": 0.88
    }
  ],
  "parsed_at": "2024-01-15T10:30:00Z",
  "model": "gemma2:2b",
  "provider": "local"
}
```

### Transaction Creation

**Request:**
```http
POST /api/transactions
Content-Type: application/json
Authorization: Bearer {token}

{
  "account_id": "uuid-account-id",
  "amount": "-45.50",
  "description": "Grocery shopping",
  "category_id": "uuid-category-id",
  "transaction_date": "2024-01-15T14:30:00Z",
  "notes": "Weekly groceries"
}
```

**Response:**
```json
{
  "id": "uuid-transaction-id",
  "account_id": "uuid-account-id",
  "amount": "-45.50",
  "description": "Grocery shopping",
  "category": {
    "id": "uuid-category-id",
    "name": "Groceries",
    "color": "#4CAF50"
  },
  "transaction_date": "2024-01-15T14:30:00Z",
  "notes": "Weekly groceries",
  "created_at": "2024-01-15T14:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Transaction Rules

**Request:**
```http
POST /api/rules
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Auto-categorize Starbucks",
  "is_active": true,
  "priority": 10,
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "field": "description",
        "operator": "contains",
        "value": "starbucks"
      }
    ]
  },
  "actions": {
    "set_category": "uuid-food-category-id",
    "set_tags": ["coffee", "dining"]
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "amount",
      "issue": "must be a valid decimal number"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated endpoints**: 1000 requests per hour
- **Authentication endpoints**: 10 requests per minute
- **AI processing endpoints**: 100 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using cursor-based pagination:

**Request:**
```http
GET /api/transactions?limit=50&cursor=eyJpZCI6InV1aWQifQ==
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6Im5leHQtdXVpZCJ9",
    "has_more": true,
    "limit": 50
  }
}
```

## Filtering and Sorting

### Common Query Parameters

- `limit`: Number of results (max 100)
- `cursor`: Pagination cursor
- `sort`: Sort field and direction (e.g., `created_at:desc`)
- `filter`: JSON filter object

### Transaction Filtering

```http
GET /api/transactions?filter={"amount":{"gte":-100,"lte":0},"date":{"gte":"2024-01-01"}}
```

## Webhooks

Nuts supports webhooks for real-time notifications:

### Webhook Events

- `transaction.created`
- `transaction.updated`
- `account.connected`
- `rule.matched`
- `user.registered`

### Webhook Payload

```json
{
  "event": "transaction.created",
  "data": {
    "id": "uuid-transaction-id",
    "account_id": "uuid-account-id",
    "amount": "-45.50",
    "description": "Grocery shopping"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "sha256=..."
}
```

## SDK and Libraries

### Official SDKs
- **JavaScript/TypeScript**: `@nuts/sdk-js`
- **Python**: `nuts-python-sdk`
- **Go**: `github.com/Fantasy-Programming/nuts-go-sdk`

### Community Libraries
- **React Hooks**: `@nuts/react-hooks`
- **Vue Composables**: `@nuts/vue-composables`

## OpenAPI Specification

The complete API specification is available in OpenAPI format:

- **Development**: `http://localhost:8080/api/docs`
- **Production**: `https://api.nuts.app/docs`

## Support

For API support and questions:

- **Documentation**: [docs.nuts.app](https://docs.nuts.app)
- **Discord**: [discord.gg/nuts](https://discord.gg/nuts)
- **GitHub Issues**: [github.com/Fantasy-Programming/nuts/issues](https://github.com/Fantasy-Programming/nuts/issues)
- **Email**: [support@nuts.app](mailto:support@nuts.app)