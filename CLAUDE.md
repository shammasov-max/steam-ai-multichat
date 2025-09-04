a# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role: 
Senior Effect-TS architect & Socratic coach.    
                                                                                                  
## Behavior:                                                                                                  
- Before coding, ask 3–5 high-leverage questions covering: scope, inputs/outputs, success criteria, constraints, failure modes, resource lifecycle (Scope/Layers), observability, and testing.                                      │
- If info is sufficient, state assumptions in bullets and proceed.                                              
- Prefer Effect 3 APIs; no deprecated methods; use @effect/schema; compose via  Layers/Context.                                     
- Return concise reasoning (no chain-of-thought)
- Do not define type/interface structures which could be inferred from values/objects/functions/literals/ etc. """export type A = typeof value;"""

## Project Overview

This is a Steam multichat automation system built as a TypeScript monorepo using Yarn workspaces. It automates conversations between Steam accounts and real players through a web-based operations console. The system uses event-driven architecture with SSE for real-time updates and incorporates AI-powered dialog assessment for quality monitoring.

## Architecture

### Workspace Structure
- `packages/frontend/` - React SPA frontend (not yet implemented)
- `packages/server/` - Node.js backend with Effect-TS
- `packages/isomorphic/` - Shared event/action definitions and types
- `packages/steam-api/` - Steam API integration utilities
- `packages/dialogs/` - Dialog management and AI assessment functionality

### Core Design Principles
- **Event-driven**: `action === event` - Reduxjs/toolkit slices are aggregators and slice case actions are events
- **CQRS-lite**: SSE for events subscribtion, HTTP POST for commands
- **Isomorphic state**: Same Redux store shape on frontend/backend
- **Effect-TS**: Functional programming with Effect framework
- **TypeID**: Entity IDs with slice prefixes (`account_*`, `dialog_*`, `system_*`)

### Data Flow
1. Commands sent to `POST /api/command`
2. Events emitted and stored in Redux store
3. Events broadcast over SSE (`GET /api/event-stream`)
4. AI assessment processes dialog messages and updates scores
5. Operator alerts triggered when thresholds exceeded


## Development Commands

### TypeScript Source Mode
The monorepo is configured to import internal packages as TypeScript sources using `tsx`. No build step required for development.

### Build & Type Check
```bash
# Build all packages (only needed for production)
yarn build

# Type check all packages  
yarn typecheck

# Build individual packages (optional)
yarn build:isomorphic
yarn build:server
yarn build:frontend
```

### Development
```bash
# Start server in dev mode (uses tsx for TypeScript sources)
yarn dev

# Start server in production
yarn start
```

### Testing
```bash
# Run TypeScript unit tests (uses tsx)
yarn test

# Run Playwright UI tests
yarn test:ui

# Run isomorphic unit tests only
yarn test:isomorphic
```

## Key Architecture Details

### Recent Architectural Changes
- **Bot → Account**: All "Bot" entities renamed to "Account" for clarity
- **Chat → Dialog**: "Chat" entities renamed to "Dialog" to reflect AI-enhanced conversations
- **Removed Slices**: Task and Proxy slices removed to simplify architecture
- **Decentralized Events**: Removed centralized event builders; events now defined per slice
- **Enhanced Schemas**: All schemas include detailed annotations for better documentation
- **AI Integration**: Dialog entities now include comprehensive AI assessment capabilities

### Event System (Isomorphic Package)
- All events are Redux actions with `{ type, payload, meta }` shape
- Event payload types defined directly in each slice module
- Uses Effect Schema for validation at boundaries
- Slice-specific actions exported from each slice (`accountActions`, `dialogActions`, etc.)
- Simplified meta structure for flexibility
- No centralized event builders - each slice manages its own events

#### Example Event Pattern
```typescript
// In accounts.ts slice
export type AccountConnectedPayload = {
    accountId: string
    ts?: number
}

// Reducer handles the event
entityReducers: {
    connected: (account, payload) => {
        account.status = 'connected'
        if (payload.ts) account.lastSeen = payload.ts
    }
}
```

### Entity Slices
Located in `packages/isomorphic/src/slices/`:
- **Account**: Steam account status, proxy URL, auth state, maFile integration
- **Dialog**: AI-powered conversation management with assessment scoring and operator alerts
- **System**: Round-robin assignment, rate limits

#### Dialog Entity (Enhanced with AI)
The Dialog entity represents AI-driven conversations with comprehensive assessment:
- **Continuation Score**: 0-1 value indicating conversation health
- **Trend Analysis**: Rising/stable/declining conversation trajectory
- **Scoring Factors**:
  - User engagement (0-1)
  - Topic relevance (0-1)
  - Emotional tone (0-1)
  - Response quality (0-1)
  - Goal proximity (0-1)
- **Issue Detection**: Identifies problems like explicit rejection, topic drift, aggressive responses
- **Operator Alerts**: Automatic alerting based on assessment thresholds
- **Multi-language Support**: zh, ja, ko, en, es
- **Goal Tracking**: Progress towards defined conversation objectives
- **Token Usage**: OpenAI API token consumption tracking

### Steam Integration
- Uses unofficial Steam npm packages (`steam-user`, `steamcommunity`, etc.)
- Account authentication via maFile (Steam Guard mobile authenticator JSON)
- Rate limited to 1 friend invite per minute per account
- Each account has a dedicated proxy URL for connection

### State Management
- Redux Toolkit with `createEntitySlice` for normalized entities
- Server maintains authoritative state with periodic snapshots
- Event logs in `events.ndjson` (append-only)
- No event replay in MVP - reconnects get fresh snapshot

## Important Constraints

- **Rate Limits**: Maximum 1 friend invite per minute per account (strict enforcement)
- **Proxy Policy**: Each account uses a dedicated proxy URL
- **Steam ToS Risk**: This uses unofficial Steam access - maintain conservative behaviors
- **MVP Scope**: No payments, escrow, or external marketplace integrations
- **Scale Target**: Up to 10,000 concurrent accounts, 100,000 active dialogs

## Development Notes

- Always validate events with Effect Schema at system boundaries
- Use TypeID for all entity IDs with appropriate prefixes
- UTC epoch milliseconds for all timestamps
- Keep SSE batches short (50-100ms intervals) to avoid UI lag
- Maintain round-robin account assignment for dialog distribution
- Dialog AI assessment monitors conversation quality and triggers operator alerts when needed

## Code Style Guidelines

### Enforced Rules (ESLint + Prettier)
- **TypeScript with strict mode** - Full strict compilation enabled
- **4-space indentation** - No tabs, consistent spacing
- **No semicolons** - Clean syntax without semicolons
- **Single quotes** - Use 'single quotes' for strings in TypeScript files
- **Arrow functions preferred** - Use `const fn = () => {}` over `function fn() {}`
- **Explicit return types** - All functions must have return type annotations

### Development Commands
```bash
# Check code style
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check formatting
yarn format:check
```

### Configuration Files
- `eslint.config.js` - ESLint rules and TypeScript integration
- `prettier.config.cjs` - Code formatting rules
- `tsconfig.base.json` - TypeScript strict mode configuration

## Command System

### Available Commands
- `AddAccountFromMaFile`: Register new Steam account with maFile and proxy URL
- `RemoveAccount`: Remove an account from the system
- `ToggleAgent`: Enable/disable AI agent for a dialog
- `SendMessage`: Send message in a dialog

## Legacy Code
Skip folders and files which names starts with symbol "_".
Focus development on the `packages/` workspace structure.
Do not build monorepos packages, import typescript files without transpilation.
