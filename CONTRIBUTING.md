# Contributing to Nuts

Thank you for your interest in contributing to Nuts! This document provides guidelines and information for contributors.

## 🤝 Ways to Contribute

### 🐛 Bug Reports
Help us improve by reporting bugs you encounter:
- Check [existing issues](https://github.com/Fantasy-Programming/nuts/issues) first
- Use the bug report template
- Include clear reproduction steps
- Provide environment details (OS, browser, version)

### 💡 Feature Requests
Suggest new features or improvements:
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider the impact on existing users
- Check if similar requests exist

### 📝 Documentation
Improve our documentation:
- Fix typos and grammatical errors
- Add missing information
- Improve code examples
- Translate content to other languages

### 🔧 Code Contributions
Submit code improvements:
- Bug fixes
- New features
- Performance improvements
- Refactoring and code quality

### 🌍 Translations
Help make Nuts accessible globally:
- Translate UI text
- Localize email templates
- Add currency and date format support

## 🚀 Getting Started

### Prerequisites
- **Git**: Version control
- **Go 1.23+**: Backend development
- **Node.js 18+**: Frontend and services
- **Python 3.9+**: AI service
- **Docker**: Containerization
- **pnpm**: Package manager (preferred)

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/your-username/nuts.git
   cd nuts
   ```

2. **Install Development Tools**
   ```bash
   # Using devenv (recommended)
   direnv allow
   
   # Or install manually
   go install github.com/air-verse/air@latest
   npm install -g pnpm
   pip install -r services/ai/requirements.txt
   ```

3. **Setup Environment**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Start Development Services**
   ```bash
   # Start database and dependencies
   docker-compose up -d postgres redis minio
   
   # Start backend (in separate terminal)
   cd server && air
   
   # Start frontend (in separate terminal)  
   cd client && pnpm dev
   
   # Start AI service (optional, in separate terminal)
   cd services/ai && uvicorn app.main:app --reload
   
   # Start mail service (optional, in separate terminal)
   cd services/mail-generator && npm run dev
   ```

5. **Verify Setup**
   - Backend: http://localhost:8080/health
   - Frontend: http://localhost:5173
   - AI Service: http://localhost:8000/health
   - Mail Service: http://localhost:3001/health

## 📋 Development Guidelines

### Code Style

#### Go (Backend)
- Follow `gofmt` formatting
- Use `golangci-lint` for linting
- Write clear, self-documenting code
- Include unit tests for new functionality

```bash
# Format and lint Go code
cd server
go fmt ./...
golangci-lint run
go test ./...
```

#### TypeScript/JavaScript (Frontend & Services)
- Use ESLint and Prettier configuration
- Follow functional programming patterns
- Include JSDoc comments for complex functions
- Write tests for new components

```bash
# Format and lint TypeScript
cd client
pnpm lint
pnpm format
pnpm test
```

#### Python (AI Service)
- Follow PEP 8 standards
- Use Black for formatting
- Include type hints
- Add docstrings for functions

```bash
# Format and lint Python
cd services/ai
black .
flake8 .
python -m pytest
```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add neural transaction parsing endpoint
fix(client): resolve memory leak in transaction list
docs: update getting started guide
refactor(server): simplify authentication middleware
```

### Branch Naming

Use descriptive branch names:
- `feature/transaction-rules`
- `fix/email-template-rendering`
- `docs/api-documentation`
- `refactor/database-queries`

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd server && go test ./...

# Frontend tests
cd client && pnpm test

# AI service tests
cd services/ai && python -m pytest

# Integration tests
./scripts/test-integration.sh

# E2E tests (if available)
cd mobile && pnpm test:e2e
```

### Writing Tests

#### Go Tests
```go
func TestTransactionCreation(t *testing.T) {
    // Setup test data
    tx := &Transaction{
        Amount:      decimal.NewFromFloat(-25.50),
        Description: "Test transaction",
    }
    
    // Test the function
    result, err := CreateTransaction(tx)
    
    // Assertions
    assert.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, tx.Amount, result.Amount)
}
```

#### React Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { TransactionList } from './TransactionList';

test('renders transaction list', () => {
  const transactions = [
    { id: '1', amount: -25.50, description: 'Test' }
  ];
  
  render(<TransactionList transactions={transactions} />);
  
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('-$25.50')).toBeInTheDocument();
});
```

## 📖 Documentation Standards

### Code Documentation
- Add JSDoc/GoDoc comments for public functions
- Include usage examples in documentation
- Document complex algorithms and business logic
- Keep comments up-to-date with code changes

### API Documentation
- Use OpenAPI/Swagger specs for REST APIs
- Include request/response examples
- Document error codes and messages
- Provide authentication details

### User Documentation
- Write clear, step-by-step instructions
- Include screenshots for UI changes
- Test all documented procedures
- Consider different user skill levels

## 🔍 Code Review Process

### Submitting Pull Requests

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   git push -u origin feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Include tests
   - Update documentation
   - Keep commits focused and atomic

3. **Pre-submission Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No merge conflicts
   - [ ] Conventional commit messages

4. **Submit PR**
   - Use the PR template
   - Reference related issues
   - Add screenshots for UI changes
   - Request review from relevant maintainers

### Review Criteria

Reviewers will check for:
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Performance**: Any negative performance impact?
- **Security**: Are there security implications?
- **Tests**: Adequate test coverage?
- **Documentation**: Is it properly documented?

## 🏗️ Architecture Guidelines

### Backend (Go)
- Follow clean architecture principles
- Use dependency injection
- Implement proper error handling
- Include comprehensive logging

### Frontend (React)
- Use functional components with hooks
- Implement proper state management
- Follow accessibility guidelines
- Optimize for performance

### Database
- Use migrations for schema changes
- Include both up and down migrations
- Test migrations on sample data
- Consider performance implications

### APIs
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement consistent error responses
- Include rate limiting

## 🔐 Security Guidelines

### General Security
- Never commit secrets or credentials
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

### Authentication & Authorization
- Use secure session management
- Implement proper RBAC
- Validate all user inputs
- Log security-relevant events

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper data deletion
- Follow privacy regulations (GDPR, etc.)

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps
1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create release PR
6. Tag release after merge
7. Deploy to production

## 🌟 Recognition

### Contributors
All contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes (for significant contributions)
- Annual contributor highlights

### Rewards
Active contributors may receive:
- Early access to new features
- Special contributor status
- Nuts swag and merchandise
- Invitation to contributor events

## 📞 Getting Help

### Development Questions
- **Discord**: [Join our community](https://discord.gg/nuts)
- **GitHub Discussions**: [Ask questions](https://github.com/Fantasy-Programming/nuts/discussions)
- **Email**: dev@nuts.app

### Mentorship
New contributors can request mentorship:
- Pair programming sessions
- Code review guidance
- Architecture discussions
- Career advice

## 📋 Issue Labels

We use these labels to organize issues:

**Type:**
- `bug`: Something isn't working
- `feature`: New feature request
- `enhancement`: Improvement to existing feature
- `documentation`: Documentation improvements

**Priority:**
- `critical`: Urgent fix needed
- `high`: Important but not urgent
- `medium`: Moderate importance
- `low`: Nice to have

**Status:**
- `needs-triage`: Needs initial review
- `ready`: Ready for development
- `in-progress`: Being worked on
- `blocked`: Waiting for dependencies

**Area:**
- `backend`: Go server issues
- `frontend`: React app issues
- `mobile`: Mobile app issues
- `ai`: AI service issues
- `docs`: Documentation issues

## 📜 Code of Conduct

We are committed to fostering a welcoming community. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) for details on our standards and enforcement procedures.

## 📄 License

By contributing to Nuts, you agree that your contributions will be licensed under the same AGPL-3.0 license that covers the project.

---

Thank you for contributing to Nuts! Together, we're building the future of personal finance management. 🌰