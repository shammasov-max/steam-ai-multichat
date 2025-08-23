// Re-export everything from the generated ledger client
export * from '../generated/ledger';

// Create and export a singleton instance for ledger database
import { PrismaClient } from '../generated/ledger';

const globalForLedgerPrisma = global as unknown as { ledgerPrisma: PrismaClient };

export const ledgerPrisma = globalForLedgerPrisma.ledgerPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForLedgerPrisma.ledgerPrisma = ledgerPrisma;
}

// Export types with namespace to avoid conflicts
export type {
  Bot as LedgerBot,
  Task as LedgerTask,
  TaskTarget as LedgerTaskTarget,
  TaskPrecondition as LedgerTaskPrecondition,
  FriendRequest as LedgerFriendRequest,
  Chat as LedgerChat,
  Message as LedgerMessage,
  Setting as LedgerSetting,
  Prisma as LedgerPrisma
} from '../generated/ledger';