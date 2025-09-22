# Effect-Redux Steam Multichat System

A production-ready Steam multichat automation system with AI-powered dialog assessment, built as a TypeScript monorepo using Effect-TS and Redux.

## Features

- 🤖 **AI-Powered Dialogs** - Intelligent conversations using OpenAI GPT-4 with real-time assessment
- 📊 **Conversation Analytics** - Scoring factors, trend analysis, and operator alerts
- 🌐 **Multi-Language Support** - Native support for Chinese, Japanese, Korean, English, and Spanish
- 🔄 **Event-Driven Architecture** - CQRS-lite pattern with SSE for real-time updates
- 📦 **Monorepo Structure** - Well-organized packages with shared isomorphic code
- 🛡️ **Type-Safe** - Full TypeScript with Effect-TS for robust error handling
- 🚀 **Scalable** - Supports up to 10,000 concurrent Steam accounts
- 💾 **MongoDB Integration** - Event sourcing with snapshots for persistence

## Prerequisites

- **Node.js** 18.0 or higher
- **Yarn** 1.22 or higher (for workspace management)
- **MongoDB** 5.0 or higher (for data persistence)
- **Git** (for version control)
- **Steam Account** with Steam Guard (for testing)
- **OpenAI API Key** (for AI dialog features)
- **Google Cloud Service Account** (optional, for Google Sheets integration)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/effect-redux.git
cd effect-redux
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with only 2 required variables:

```env
# MongoDB Connection (required)
MONGODB_URL=mongodb://localhost:27017/effect-redux

# Environment Mode (optional, defaults to development)
NODE_ENV=development
```

**Note**: All other configuration (OpenAI API keys, server ports, rate limits, etc.) is now stored in the database via SystemSlice and can be updated at runtime without restarting the application.

### 4. Database Setup

Ensure MongoDB is running:

```bash
# Start MongoDB (if using local installation)
mongod --dbpath /path/to/data

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Build Packages (Optional)

The project uses TypeScript source imports via `tsx`, so building is optional for development:

```bash
# Type check all packages
yarn typecheck

# Build all packages (only needed for production)
yarn build
```

## Quick Start

### Development Mode

```bash
# Start the server in development mode
yarn dev

# In another terminal, start the frontend (when implemented)
yarn workspace @packages/frontend dev
```

The server will be available at `http://localhost:3000`

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific package
yarn workspace @packages/isomorphic test
yarn workspace @packages/dialogs test

# Run Playwright UI tests
yarn test:ui

# Run tests with coverage
yarn test:coverage
```

### Type Checking

```bash
# Type check all packages
yarn typecheck

# Type check specific package
yarn workspace @packages/server typecheck
```

## Package Structure

### Core Packages

- **[packages/frontend](./packages/frontend)** - React SPA with real-time updates via SSE
- **[packages/server](./packages/server)** - Node.js backend with Effect-TS orchestration
- **[packages/isomorphic](./packages/isomorphic)** - Shared event definitions and Redux state
- **[packages/steam-api](./packages/steam-api)** - Steam integration utilities with Effect-TS
- **[packages/dialogs](./packages/dialogs)** - AI-powered dialog management with OpenAI
- **[packages/db](./packages/db)** - MongoDB database layer with event sourcing
- **[packages/google-sheets-db](./packages/google-sheets-db)** - Google Sheets as database adapter

## Architecture Overview

### Event-Driven Design

The system uses a CQRS-lite pattern where:
- Commands are sent via `POST /api/command`
- Events are streamed via `GET /api/event-stream` (SSE)
- Redux actions ARE domain events (`action === event`)
- All state changes are event-sourced

### Key Technologies

- **Effect-TS** - Functional programming with dependency injection
- **Redux Toolkit** - State management (isomorphic between frontend/backend)
- **MongoDB** - Event store and snapshot persistence
- **OpenAI GPT-4** - Intelligent dialog generation and assessment
- **Steam Unofficial APIs** - Account automation via `steam-user` package
- **Server-Sent Events (SSE)** - Real-time event streaming

### Entity Model

- **Accounts** - Steam accounts with connection status and proxy management
- **Dialogs** - AI-powered conversations with assessment scoring
- **System** - Round-robin assignment and rate limiting

## Development Commands

### Workspace Commands

```bash
# Install dependencies
yarn install

# Add dependency to root
yarn add -W <package-name>

# Add dependency to specific workspace
yarn workspace @packages/<name> add <package-name>

# Run script in all workspaces
yarn workspaces run <script-name>
```

### Available Scripts

```bash
# Development
yarn dev                 # Start server in development mode
yarn build              # Build all packages
yarn typecheck          # Type check all packages
yarn lint               # Lint all packages
yarn lint:fix           # Fix linting issues
yarn format             # Format code with Prettier
yarn format:check       # Check formatting

# Testing
yarn test               # Run all tests
yarn test:unit          # Run unit tests only
yarn test:integration   # Run integration tests
yarn test:e2e          # Run end-to-end tests
yarn test:ui           # Run Playwright UI tests
yarn test:coverage     # Generate coverage report

# Database
yarn db:migrate        # Run database migrations
yarn db:seed          # Seed database with test data
```

## Configuration

### TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true`
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`

### ESLint & Prettier

Code style is enforced via ESLint and Prettier:
- 4-space indentation
- No semicolons
- Single quotes for strings
- Arrow functions preferred

Run `yarn lint:fix` and `yarn format` to auto-fix issues.

## Deployment

### Production Build

```bash
# Build all packages for production
yarn build

# Start production server
NODE_ENV=production yarn start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t effect-redux .

# Run with Docker Compose
docker-compose up -d
```

### PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor logs
pm2 logs

# Restart/stop
pm2 restart effect-redux
pm2 stop effect-redux
```

## API Documentation

### Command API

**POST /api/command**

Available commands:
- `AddAccountFromMaFile` - Add Steam account with maFile
- `RemoveAccount` - Remove account from system
- `CreateDialog` - Create new AI dialog
- `ToggleAgent` - Enable/disable AI agent
- `SendMessage` - Send message in dialog

### Event Stream API

**GET /api/event-stream**

Server-Sent Events stream providing:
1. Initial snapshot with full state
2. Real-time event batches (~50-100ms intervals)

## Monitoring & Debugging

### Logs

- Application logs: `logs/app.log`
- Event logs: `logs/events.ndjson`
- Error logs: `logs/error.log`

### Debug Mode

```bash
# Run with debug output
DEBUG=* yarn dev

# Debug specific module
DEBUG=effect-redux:* yarn dev
```

### Performance Monitoring

The system includes built-in metrics for:
- Event processing latency
- AI response times
- Memory usage
- Active connections

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check MongoDB is running
mongod --version
# Verify connection string in .env
```

#### TypeScript Errors
```bash
# Clear build cache and reinstall
rm -rf node_modules
yarn install
yarn typecheck
```

#### Steam Authentication Issues
- Ensure maFile is correctly formatted
- Check proxy configuration
- Verify Steam Guard is enabled

#### OpenAI Rate Limits
- Implement exponential backoff
- Use lower rate limits in development
- Monitor token usage per dialog

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and PR process.

## Documentation

- [Architecture Guide](./CLAUDE.md) - Detailed architecture and development patterns
- [Requirements Document](./RDP.md) - Full product requirements and specifications
- [API Documentation](./docs/api.md) - Complete API reference
- [Event Catalog](./docs/events.md) - All domain events documentation

## Security

- Never commit `.env` files (only used for MONGODB_URL now)
- Store sensitive configuration (API keys, credentials) in database, not in code
- Rotate API keys regularly via SystemSlice updates
- Follow Steam ToS and rate limits
- All runtime configuration is managed through SystemSlice
- Implement proper authentication for production

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review test files for usage examples

## Acknowledgments

Built with:
- [Effect-TS](https://www.effect.website/) - Functional programming for TypeScript
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [OpenAI](https://openai.com/) - AI dialog generation
- [Steam](https://steamcommunity.com/) - Gaming platform integration