// Main entry point - export specific items to avoid conflicts
// Export the singleton instances and namespaced types
export { 
  ledgerPrisma as ledgerPrismaClient, 
  type LedgerBot, 
  type LedgerTask, 
  type LedgerTaskTarget, 
  type LedgerTaskPrecondition, 
  type LedgerFriendRequest, 
  type LedgerChat, 
  type LedgerMessage, 
  type LedgerSetting,
  type LedgerPrisma 
} from './ledger';

export { 
  dialogsPrisma as dialogsPrismaClient, 
  type DialogsDialog, 
  type DialogsMessage, 
  type DialogsDialogState, 
  type DialogsLog, 
  type DialogsPrisma,
  DialogStatus,
  DialogRole,
  LogLevel
} from './dialogs';

// Export the individual modules for easier imports
import * as Ledger from './ledger';
import * as Dialogs from './dialogs';

export { Ledger, Dialogs };

// Export utility functions for closing connections
export const closeAllConnections = async () => {
  await Promise.all([
    Ledger.ledgerPrisma.$disconnect(),
    Dialogs.dialogsPrisma.$disconnect()
  ]);
};