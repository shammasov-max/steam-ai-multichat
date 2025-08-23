// Example usage of sam/prisma package

import { 
  ledgerPrismaClient as ledgerPrisma, 
  dialogsPrismaClient as dialogsPrisma, 
  Ledger, 
  Dialogs,
  closeAllConnections,
  type LedgerBot,
  type DialogsDialog
} from '../src/index';

async function demonstrateUsage() {
  console.log('🔄 Demonstrating sam/prisma package usage...\n');

  // Example 1: Using direct imports
  console.log('📊 Example 1: Direct client imports');
  
  try {
    // This would work if databases were set up
    // const bots = await ledgerPrisma.bot.findMany();
    // const dialogs = await dialogsPrisma.dialog.findMany();
    console.log('✅ Ledger client ready:', typeof ledgerPrisma);
    console.log('✅ Dialogs client ready:', typeof dialogsPrisma);
  } catch (error) {
    console.log('⚠️  Database not connected (expected in this demo)');
  }

  // Example 2: Using namespace imports
  console.log('\n📊 Example 2: Namespace imports');
  console.log('✅ Ledger namespace ready:', typeof Ledger.ledgerPrisma);
  console.log('✅ Dialogs namespace ready:', typeof Dialogs.dialogsPrisma);

  // Example 3: Type usage
  console.log('\n📊 Example 3: TypeScript types');
  const exampleBot: LedgerBot = {
    id: 'bot_123',
    steamId64: '76561198000000000',
    label: 'Test Bot',
    proxyUrl: 'http://proxy.example.com:8080',
    password: 'secret',
    status: 'disconnected',
    lastSeen: new Date(),
    mafileJson: '{}',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const exampleDialog: DialogsDialog = {
    id: 'dialog_123',
    externalId: 'chat_456',
    status: 'ACTIVE',
    language: 'en',
    userInfo: null,
    goal: 'Convert user to premium',
    completionCriteria: { type: 'user_agreement' },
    negotiationSettings: null,
    referenceContext: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('✅ Bot type example:', { id: exampleBot.id, steamId64: exampleBot.steamId64 });
  console.log('✅ Dialog type example:', { id: exampleDialog.id, status: exampleDialog.status });

  // Example 4: Cleanup utility
  console.log('\n📊 Example 4: Connection cleanup');
  console.log('✅ Cleanup function ready:', typeof closeAllConnections);

  console.log('\n🎉 All examples completed successfully!');
}

// Run the demonstration
demonstrateUsage().catch(console.error);