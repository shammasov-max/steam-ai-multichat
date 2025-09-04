# Contributing to Effect-Redux

Thank you for your interest in contributing to the Effect-Redux Steam Multichat System! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Effect-TS Patterns](#effect-ts-patterns)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Architecture Decisions](#architecture-decisions)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept responsibility for mistakes
- Prioritize the project's best interests

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that could be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Development Environment**
   - Node.js 18+ installed
   - Yarn 1.22+ for package management
   - MongoDB 5.0+ running locally or accessible
   - Git configured with your GitHub account
   - VS Code or your preferred TypeScript IDE

2. **API Keys** (for testing certain features)
   - OpenAI API key for dialog testing
   - Steam account with Steam Guard for integration testing
   - Google Cloud service account (optional, for sheets features)

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/effect-redux.git
cd effect-redux

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run type checking to ensure setup is correct
yarn typecheck

# Run tests to verify everything works
yarn test
```

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

1. **main** - Production-ready code
2. **develop** - Integration branch for features
3. **feature/*** - Feature development branches
4. **fix/*** - Bug fix branches
5. **docs/*** - Documentation updates

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code ...

# Commit your changes (see commit guidelines)
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

## Code Style Guidelines

### TypeScript Standards

We use strict TypeScript configuration:

```typescript
// GOOD: Explicit types and return values
export const calculateScore = (factors: ScoringFactors): number => {
    return factors.engagement * 0.3 + factors.relevance * 0.7
}

// BAD: Implicit any or missing types
export const calculateScore = (factors) => {
    return factors.engagement * 0.3 + factors.relevance * 0.7
}
```

### Formatting Rules

Our ESLint and Prettier configuration enforces:

- **4 spaces** for indentation (no tabs)
- **No semicolons** at line endings
- **Single quotes** for strings
- **Arrow functions** preferred over function keyword
- **Explicit return types** for all functions

Run these commands before committing:

```bash
# Auto-fix linting issues
yarn lint:fix

# Format code
yarn format

# Check for remaining issues
yarn lint
yarn format:check
```

### File Organization

```typescript
// 1. Imports (grouped and ordered)
import { Effect, pipe } from 'effect'
import * as S from '@effect/schema/Schema'

import { DatabaseTag } from '../services/database'
import type { Account } from '../types'

// 2. Type definitions
export interface AccountService {
    findById: (id: string) => Effect.Effect<Account, Error>
}

// 3. Constants
const MAX_RETRIES = 3

// 4. Main implementation
export const createAccountService = (): AccountService => {
    // Implementation
}

// 5. Helper functions (if needed)
const validateAccount = (account: unknown): account is Account => {
    // Validation logic
}
```

## Effect-TS Patterns

### Use Effect Types Consistently

```typescript
// GOOD: Using Effect types throughout
import { Effect, Layer, Context } from 'effect'

export interface UserService {
    getUser: (id: string) => Effect.Effect<User, UserNotFoundError>
}

export const UserServiceTag = Context.GenericTag<UserService>('UserService')

export const UserServiceLive = Layer.effect(
    UserServiceTag,
    Effect.gen(function* () {
        const db = yield* DatabaseTag
        return {
            getUser: (id) => 
                pipe(
                    db.query(`SELECT * FROM users WHERE id = ?`, [id]),
                    Effect.flatMap(rows => 
                        rows[0] 
                            ? Effect.succeed(rows[0])
                            : Effect.fail(new UserNotFoundError(id))
                    )
                )
        }
    })
)
```

### Handle Errors with Tagged Unions

```typescript
// Define error types with tags
export class NetworkError {
    readonly _tag = 'NetworkError'
    constructor(readonly message: string) {}
}

export class ValidationError {
    readonly _tag = 'ValidationError'
    constructor(readonly errors: string[]) {}
}

// Use in Effect types
type ProgramError = NetworkError | ValidationError

const program: Effect.Effect<Data, ProgramError> = pipe(
    fetchData(),
    Effect.flatMap(validateData),
    Effect.catchTag('NetworkError', (error) => 
        Effect.succeed(getCachedData())
    )
)
```

### Schema Validation

Always validate at boundaries using @effect/schema:

```typescript
import * as S from '@effect/schema/Schema'

// Define schemas with annotations
export const AccountSchema = S.Struct({
    id: S.String.pipe(S.nonEmpty(), S.pattern(/^account_/)),
    steamId64: S.String.pipe(S.length(17)),
    status: S.Literal('connected', 'disconnected'),
    proxyUrl: S.optional(S.String)
}).pipe(
    S.annotations({
        identifier: 'Account',
        description: 'Steam account entity'
    })
)

// Use for validation
export const parseAccount = S.decodeUnknown(AccountSchema)
```

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from '@effect/vitest'
import { Effect, TestContext } from 'effect'

describe('AccountService', () => {
    let testContext: TestContext
    
    beforeEach(() => {
        testContext = TestContext.make()
    })
    
    describe('getAccount', () => {
        it('should return account when exists', () =>
            Effect.gen(function* () {
                const service = yield* AccountServiceTag
                const account = yield* service.getAccount('account_123')
                
                expect(account).toEqual({
                    id: 'account_123',
                    steamId64: '12345678901234567',
                    status: 'connected'
                })
            }).pipe(
                Effect.provide(TestLayer),
                Effect.runPromise
            )
        )
        
        it('should fail when account not found', () =>
            Effect.gen(function* () {
                const service = yield* AccountServiceTag
                const result = yield* Effect.either(
                    service.getAccount('nonexistent')
                )
                
                expect(result._tag).toBe('Left')
                expect(result.left._tag).toBe('AccountNotFound')
            }).pipe(
                Effect.provide(TestLayer),
                Effect.runPromise
            )
        )
    })
})
```

### Test Categories

1. **Unit Tests** - Test individual functions and classes
2. **Integration Tests** - Test service interactions
3. **E2E Tests** - Test complete workflows
4. **Performance Tests** - Verify performance targets

### Running Tests

```bash
# Run all tests
yarn test

# Run specific package tests
yarn workspace @packages/dialogs test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch

# Run specific test file
yarn test src/services/account.test.ts
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Test additions or corrections
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Other changes that don't modify src or test files

### Examples

```bash
# Feature
git commit -m "feat(dialogs): add multi-language support for AI assessment"

# Bug fix
git commit -m "fix(accounts): resolve connection timeout on proxy failure"

# Documentation
git commit -m "docs(readme): add troubleshooting section for MongoDB"

# Refactoring
git commit -m "refactor(isomorphic): simplify event creation pattern"

# With breaking change
git commit -m "feat(api): change command response format

BREAKING CHANGE: Commands now return { success, data } instead of raw data"
```

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**
   ```bash
   yarn test
   yarn typecheck
   yarn lint
   ```

2. **Update documentation** if you've:
   - Added new features
   - Changed APIs
   - Modified configuration options

3. **Add tests** for:
   - New functionality
   - Bug fixes
   - Edge cases

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console.logs or debugging code

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks** - CI runs tests, linting, and type checking
2. **Code Review** - At least one maintainer reviews the code
3. **Testing** - Reviewer tests the changes locally
4. **Approval** - PR is approved and merged

## Project Structure

### Package Organization

```
effect-redux/
├── packages/
│   ├── frontend/          # React SPA
│   ├── server/           # Node.js backend
│   ├── isomorphic/       # Shared code
│   ├── steam-api/        # Steam integration
│   ├── dialogs/          # AI dialog management
│   ├── db/               # Database layer
│   └── google-sheets-db/ # Sheets adapter
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
└── tests/               # E2E tests
```

### Key Files

- **CLAUDE.md** - Architecture and AI assistant instructions
- **RDP.md** - Product requirements document
- **package.json** - Root package configuration
- **tsconfig.base.json** - Shared TypeScript config
- **eslint.config.js** - Linting rules
- **prettier.config.cjs** - Formatting rules

## Architecture Decisions

### Core Principles

1. **Event-Driven** - All state changes are events
2. **Type-Safe** - Full TypeScript with strict mode
3. **Functional** - Effect-TS for error handling and DI
4. **Isomorphic** - Shared code between frontend and backend
5. **Testable** - Dependency injection enables easy testing

### Key Patterns

#### Event Sourcing
```typescript
// Events are Redux actions
export const accountConnected = createEventAction(
    'account.connected',
    (payload) => ({ type: 'Account', id: payload.accountId })
)

// State derived from events
const accountsReducer = (state, action) => {
    switch (action.type) {
        case 'account.connected':
            return { ...state, [action.payload.accountId]: { status: 'connected' } }
    }
}
```

#### Repository Pattern
```typescript
export interface AccountRepository {
    findById: (id: string) => Effect.Effect<Account, RepositoryError>
    save: (account: Account) => Effect.Effect<void, RepositoryError>
}
```

#### Service Layer
```typescript
export const AccountServiceLive = Layer.effect(
    AccountServiceTag,
    Effect.gen(function* () {
        const repo = yield* AccountRepositoryTag
        const events = yield* EventBusTag
        
        return {
            connectAccount: (id) => pipe(
                repo.findById(id),
                Effect.tap(() => events.emit(accountConnected({ accountId: id })))
            )
        }
    })
)
```

## Getting Help

### Resources

- **Documentation**: Read CLAUDE.md and RDP.md for architecture details
- **Examples**: Check test files for usage examples
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions

### Contact

- Create an issue for bugs or feature requests
- Use discussions for questions and ideas
- Tag maintainers for urgent issues: @maintainer-username

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Special thanks in documentation

Thank you for contributing to Effect-Redux!