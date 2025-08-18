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

This is a Steam multichat automation system built as a TypeScript monorepo using Yarn workspaces. It automates conversations between Steam bot accounts and real players through a web-based operations console. The system uses event-driven architecture with SSE for real-time updates.

## Architecture

### Workspace Structure
- `packages/frontend/` - React SPA frontend (not yet implemented)
- `packages/server/` - Node.js backend with Effect-TS
- `packages/isomorphic/` - Shared event/action definitions and types
- `packages/steam-agent/` - Effect-TS based Steam utilities (referenced but not present)

### Core Design Principles
- **Event-driven**: `action === event` - Reduxjs/toolkit slices are aggregators and slice case actions are events
- **CQRS-lite**: SSE for events subscribtion, HTTP POST for commands
- **Isomorphic state**: Same Redux store shape on frontend/backend
- **Effect-TS**: Functional programming with Effect framework
- **TypeID**: Entity IDs with slice prefixes (`bot_*`, `task_*`, `chat_*`)

### Data Flow
1. Commands sent to `POST /api/command`
2. Events emitted and stored in Redux store
3. Events broadcast over SSE (`GET /api/event-stream`)


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

### Event System (Isomorphic Package)
- All events are Redux actions with `{ type, payload, meta }` shape
- Event builder in `packages/isomorphic/src/events/event-builder.ts`
- Event schemas defined per slice using Effect Schema
- Event creators in `packages/isomorphic/src/events/actions.ts`
- Uses Effect Schema for validation at boundaries
- Simplified meta structure for flexibility

### Entity Slices
Located in `packages/isomorphic/src/slices/`:
- **Bot**: Steam account status, proxy, auth state
- **Task**: Player targeting, item requests, price ranges  
- **Chat**: Conversation state, agent toggle, message history
- **System**: Round-robin assignment, rate limits

### Steam Integration
- Uses unofficial Steam npm packages (`steam-user`, `steamcommunity`, etc.)
- Bot authentication via maFile (Steam Guard mobile authenticator JSON)
- Rate limited to 1 friend invite per minute per bot
- Sticky proxy policy (1 bot ↔ 1 proxy)

### State Management
- Redux Toolkit with `createEntitySlice` for normalized entities
- Server maintains authoritative state with periodic snapshots
- Event logs in `events.ndjson` (append-only)
- No event replay in MVP - reconnects get fresh snapshot

## Important Constraints

- **Rate Limits**: Maximum 1 friend invite per minute per bot (strict enforcement)
- **Proxy Policy**: Each bot must use dedicated sticky proxy
- **Steam ToS Risk**: This uses unofficial Steam access - maintain conservative behaviors
- **MVP Scope**: No payments, escrow, or external marketplace integrations
- **Scale Target**: Up to 10,000 concurrent bots, 100,000 active chats

## Development Notes

- Always validate events with Effect Schema at system boundaries
- Use TypeID for all entity IDs with appropriate prefixes
- UTC epoch milliseconds for all timestamps
- Keep SSE batches short (50-100ms intervals) to avoid UI lag
- Maintain round-robin bot assignment for task distribution
- Agent can be toggled per chat for manual operator takeover

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

## Legacy Code
Skip folders and files which names starts with symbol "_".
Focus development on the `packages/` workspace structure.
Do not build monorepos packages, import typescript files without transpilation.
