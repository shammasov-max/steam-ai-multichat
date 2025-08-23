# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Steam Multichat MVP

**Next.js RSC + Server Actions · SQLite · Real Steam (maFile + proxies) · Typesafe · ≤1 msg/sec**

## Development Commands

### Root Project Commands
- **Development**: `pnpm dev` - Start Next.js dev server
- **Build**: `pnpm build` - Build Next.js application 
- **Type Check**: `pnpm typecheck` - Run TypeScript compiler checks
- **Testing**: `pnpm test` - Run all Playwright tests
- **Test Types**: 
  - `pnpm test:unit` - Unit tests only
  - `pnpm test:e2e` - End-to-end application tests
  - `pnpm test:integration` - Integration tests with Docker setup
  - `pnpm test:all` - All test suites sequentially
- **Test Utilities**:
  - `pnpm test:setup` - Initialize test database
  - `pnpm test:debug` - Debug mode for tests
  - `pnpm test:ui` - Playwright UI mode
  - `pnpm test:report` - View test reports

### Package-Specific Commands
- **Steam Agent** (`packages/steam-agent/`):
  - `pnpm build` - Compile TypeScript
  - `pnpm typecheck` - Type validation
  - `pnpm test:integration` - Steam integration tests
  
- **Dialog AI Service** (`packages/dialog-ai-service/`):
  - `npm run build` - Compile TypeScript  
  - `npm run lint` - ESLint validation
  - `npm run prisma:generate` - Generate Prisma client
  - `npm run prisma:migrate` - Run database migrations
  - `npm test` - Run all test suites

### Database Management
- **Prisma Commands**: `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`
- **Database**: SQLite with file at `prisma/dev.db`

## Architecture Overview

### Project Structure
This is a **monorepo** with pnpm workspaces containing:
- **Root**: Next.js 15 application (App Router + RSC)
- **packages/steam-agent**: Steam bot functionality wrapper
- **packages/dialog-ai-service**: AI-powered dialog management  
- **packages/prisma**: Shared database package (if exists)

### Core Application Architecture

**Next.js App Router Structure**:
- `app/` - Next.js App Router with React Server Components
- `app/api/` - API Routes for REST endpoints
- `app/actions/` - Server Actions for form handling
- `lib/` - Shared utilities, database client, business logic
- `components/` - React components (UI + modals)

**Key Directories**:
- `lib/steam/sessionManager.ts` - Steam connection management
- `lib/db/client.ts` - Database client configuration
- `lib/zod/` - Zod schemas for type validation
- `lib/actions/` - Server Actions implementations
- `prisma/schema.prisma` - Database schema definition

### Database Schema (SQLite + Prisma)
- **bots**: Steam bot configurations with maFile authentication
- **tasks**: Player tasks with round-robin bot assignment  
- **chats**: Bot-player conversations with agent toggle
- **messages**: Chat message history with timestamps
- **friend_requests**: Steam friend request tracking
- **task_targets** & **task_preconditions**: 1:1 task relationships

### Steam Integration
- Uses `steam-user`, `steamcommunity`, `steam-totp` packages
- **Authentication**: maFile-based (Steam Mobile Authenticator)
- **Proxies**: Configurable proxy support per bot
- **Rate Limiting**: ≤1 message/second enforcement
- **Session Management**: In-process Steam sessions with auto-reconnect

## Core Requirements

### Features
- **Bots**: Add/remove (maFile+proxy), connect, status tracking
- **Tasks**: Create/dispose for players, auto-assign via round-robin, friend invites (1/min/bot)  
- **Chats**: List/thread view, manual messages, agent toggle (3-5 scripted messages)
- **Polling**: 1-2s refresh, `?since=` for messages

### Tech Stack
- Next.js App Router (RSC + Server Actions)
- SQLite (Prisma)
- Zod validation
- In-process Steam sessions
- No: Redux, OpenAPI, CQRS, WebSockets

### API Design
- **Server Actions**: addBot, removeBot, connectBot, createTask, disposeTask, toggleAgent, sendMessage
- **Routes**: GET /api/{bots,tasks,chats,chats/:id,chats/:id/messages}

### Behaviors  
- Auto-connect bots on boot
- Round-robin task assignment
- Invite pacing (1/min/bot)
- Agent: 3-5 messages on accept if enabled
- Polling-based UI updates

### Constraints
- ≤1 msg/sec throughput
- Internal use (no auth)
- Docker deployment
- SQLite persistence

## Testing Strategy

### Test Framework
- **Playwright** for all testing (unit, integration, e2e)
- **Sequential execution** (workers: 1) to avoid Steam rate limits
- **180-second timeouts** for Steam operations
- **Docker Compose** for integration test environments

### Test Categories
1. **Unit Tests**: Component and utility testing
2. **Integration Tests**: Steam API interactions with real authentication
3. **E2E Tests**: Full application workflow testing  
4. **Performance Tests**: Rate limiting and throughput validation

### Steam Test Requirements
- **Real maFile authentication** required for Steam integration tests
- **Fixture management**: `fixtures/mafile/` contains test Steam accounts
- **Docker setup**: `docker-compose.test.yml` for isolated test environments

## Development Notes

### Code Style
- **ESLint + TypeScript**: Configured with no semicolons preference
- **Prettier**: Code formatting (config in `prettier.config.cjs`)
- **TypeScript**: Strict mode with `@total-typescript/ts-reset`

### Package Management
- **pnpm**: Primary package manager with workspace support
- **Package Manager**: Locked to `pnpm@9.15.2`

### Docker Deployment
- **Production**: `docker-compose.yml` with volume persistence
- **Database**: SQLite with volume mounting for persistence
- **Port**: Application runs on port 3000
- use cross-env everywhere you need to defined env vars inline in npm script