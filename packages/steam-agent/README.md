# Steam Agent Package

Effect-TS based Steam utilities for bot automation.

## Overview
This package provides a functional wrapper around unofficial Steam npm packages using Effect-TS patterns.

## Main Components
- **SteamAgent.ts** - Core Steam bot functionality with Effect layers
- **types.ts** - TypeScript type definitions for Steam entities
- **index.ts** - Package exports

## Testing
The package includes Playwright-based integration tests for Steam functionality:
- Login flows
- Message handling
- State management
- Real Steam API interactions

## Usage
This package is used internally by the server package to manage Steam bot connections, authentication, and messaging.

## Dependencies
- Effect-TS for functional programming patterns
- Unofficial Steam npm packages (steam-user, steamcommunity, etc.)
- Playwright for integration testing