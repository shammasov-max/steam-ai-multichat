// Re-export everything from the generated dialogs client
export * from '../generated/dialogs';

// Create and export a singleton instance for dialogs database
import { PrismaClient } from '../generated/dialogs';

const globalForDialogsPrisma = global as unknown as { dialogsPrisma: PrismaClient };

export const dialogsPrisma = globalForDialogsPrisma.dialogsPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDialogsPrisma.dialogsPrisma = dialogsPrisma;
}

// Export types with namespace to avoid conflicts
export type {
  Dialog as DialogsDialog,
  Message as DialogsMessage,
  DialogState as DialogsDialogState,
  Log as DialogsLog,
  Prisma as DialogsPrisma
} from '../generated/dialogs';

// Export enum values (not just types)
export {
  DialogStatus,
  DialogRole,
  LogLevel
} from '../generated/dialogs';