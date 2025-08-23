# sam/prisma

Unified Prisma client wrapper for Steam Multichat MVP. This package consolidates both the ledger (main app) and dialogs (AI service) database schemas into a single, easy-to-use package.

## Architecture

This package uses the wrapper approach to provide clean, separate exports for each database schema:

- **Ledger**: Main application database (SQLite) - bots, tasks, chats, messages
- **Dialogs**: AI service database (PostgreSQL) - dialog management, AI conversations

## Installation

```bash
# From the monorepo root
npm install packages/prisma
```

## Usage

### Basic Usage

```typescript
// Import both schemas
import { ledgerPrisma, dialogsPrisma } from 'sam/prisma';

// Use ledger client
const bots = await ledgerPrisma.bot.findMany();

// Use dialogs client  
const dialogs = await dialogsPrisma.dialog.findMany();
```

### Namespace Imports

```typescript
// Import with namespaces to avoid conflicts
import { Ledger, Dialogs } from 'sam/prisma';

const bots = await Ledger.ledgerPrisma.bot.findMany();
const dialogs = await Dialogs.dialogsPrisma.dialog.findMany();
```

### Direct Schema Imports

```typescript
// Import specific schema
import { ledgerPrisma, LedgerBot } from 'sam/prisma/ledger';
import { dialogsPrisma, DialogsDialog } from 'sam/prisma/dialogs';
```

### Type-Only Imports

```typescript
// Import only types
import type { 
  LedgerBot, 
  LedgerTask, 
  DialogsDialog, 
  DialogStatus 
} from 'sam/prisma';
```

## Schema Management

### Generate Clients

```bash
# Generate both schemas
npm run generate

# Generate individual schemas
npm run generate:ledger
npm run generate:dialogs
```

### Database Migrations

```bash
# Migrate ledger database
npm run migrate:ledger

# Migrate dialogs database  
npm run migrate:dialogs
```

### Prisma Studio

```bash
# Open studio for ledger database
npm run studio:ledger

# Open studio for dialogs database
npm run studio:dialogs
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Dialogs Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/steambot_dialogs"
```

The ledger database (SQLite) is configured automatically in the schema.

## File Structure

```
packages/prisma/
├── schemas/
│   ├── ledger/
│   │   └── schema.prisma      # Main app database schema
│   └── dialogs/
│       └── schema.prisma      # AI service database schema
├── generated/
│   ├── ledger/               # Generated Prisma client for ledger
│   └── dialogs/              # Generated Prisma client for dialogs
├── src/
│   ├── index.ts              # Main exports
│   ├── ledger.ts             # Ledger schema wrapper
│   └── dialogs.ts            # Dialogs schema wrapper
└── package.json
```

## Examples

### Working with Bots and Tasks

```typescript
import { ledgerPrisma } from 'sam/prisma';

// Create a bot
const bot = await ledgerPrisma.bot.create({
  data: {
    steamId64: '76561198000000000',
    proxyUrl: 'http://proxy.example.com:8080',
    password: 'bot_password',
    mafileJson: JSON.stringify({/* maFile data */})
  }
});

// Assign a task to the bot
const task = await ledgerPrisma.task.update({
  where: { id: 'task_id' },
  data: { assignedBotId: bot.id }
});
```

### Working with AI Dialogs

```typescript
import { dialogsPrisma } from 'sam/prisma';

// Create a new dialog
const dialog = await dialogsPrisma.dialog.create({
  data: {
    externalId: 'chat_123',
    language: 'en',
    goal: 'Convert user to premium subscription',
    completionCriteria: {
      type: 'user_agreement',
      keywords: ['yes', 'agree', 'sign up']
    }
  }
});

// Add a message to the dialog
await dialogsPrisma.message.create({
  data: {
    dialogId: dialog.id,
    role: 'USER',
    content: 'Tell me about your service',
    sequenceNumber: 1
  }
});
```

### Cleanup

```typescript
import { closeAllConnections } from 'sam/prisma';

// Close all database connections
await closeAllConnections();
```

## Integration with Existing Code

This package is designed to replace direct Prisma client usage in:

- Root package: Replace `@prisma/client` imports with `sam/prisma/ledger`
- dialog-ai-service: Replace local Prisma client with `sam/prisma/dialogs`

The types and APIs remain exactly the same, just with better organization and namespacing.