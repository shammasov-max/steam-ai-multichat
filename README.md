# Steam Bot - Multichat Automation System

Main features and design document: [RDP.md](./RDP.md)

## Overview
A Steam multichat automation system built as a TypeScript monorepo using Yarn workspaces. Automates conversations between Steam bot accounts and real players through a web-based operations console.

## Package Structure

- **[Frontend Package](./packages/frontend)** - React SPA with Steam-themed UI components
- **[Server Package](./packages/server)** - Node.js backend with Effect-TS
- **[Isomorphic Package](./packages/isomorphic)** - Shared event definitions and Redux state
- **[Steam Agent Package](./packages/steam-agent)** - Effect-TS based Steam utilities

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Type check
yarn typecheck
```

## Documentation

- [Architecture Guide](./CLAUDE.md) - Development guidelines and architecture details
- [Requirements Document](./RDP.md) - Full product requirements and specifications