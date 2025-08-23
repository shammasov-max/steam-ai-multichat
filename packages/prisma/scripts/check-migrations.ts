#!/usr/bin/env tsx
/**
 * Database Migration Status Checker
 * 
 * Verifies that both ledger and dialogs databases are:
 * 1. Connected and accessible
 * 2. Migrated to the latest schema version
 * 3. Have all expected tables with correct structure
 */

import { PrismaClient as LedgerPrismaClient } from '../generated/ledger';
import { PrismaClient as DialogsPrismaClient } from '../generated/dialogs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface MigrationStatus {
  database: string;
  connected: boolean;
  error?: string;
  expectedTables: string[];
  actualTables: string[];
  missingTables: string[];
  latestMigration?: string;
  appliedMigrations: string[];
  pendingMigrations: string[];
  isUpToDate: boolean;
}

class DatabaseChecker {
  private ledgerClient: LedgerPrismaClient;
  private dialogsClient: DialogsPrismaClient;

  constructor() {
    this.ledgerClient = new LedgerPrismaClient();
    this.dialogsClient = new DialogsPrismaClient();
  }

  async checkLedgerDatabase(): Promise<MigrationStatus> {
    const status: MigrationStatus = {
      database: 'ledger',
      connected: false,
      expectedTables: ['bots', 'tasks', 'task_targets', 'task_preconditions', 'friend_requests', 'chats', 'messages', 'settings'],
      actualTables: [],
      missingTables: [],
      appliedMigrations: [],
      pendingMigrations: [],
      isUpToDate: false
    };

    try {
      // Test connection
      await this.ledgerClient.$queryRaw`SELECT 1`;
      status.connected = true;

      // Get actual tables
      const tables = await this.ledgerClient.$queryRaw<Array<{tablename: string}>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      `;
      status.actualTables = tables.map(t => t.tablename).sort();

      // Check for missing tables (case-insensitive comparison)
      status.missingTables = status.expectedTables.filter(
        expectedTable => !status.actualTables.some(actualTable => 
          actualTable.toLowerCase() === expectedTable.toLowerCase()
        )
      );

      // Get migration status
      try {
        const migrations = await this.ledgerClient.$queryRaw<Array<{migration_name: string, finished_at: Date | null}>>`
          SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
        `;
        status.appliedMigrations = migrations
          .filter(m => m.finished_at !== null)
          .map(m => m.migration_name);
      } catch (e) {
        // _prisma_migrations table might not exist if no migrations have been run
        status.error = 'No migrations table found - database not initialized';
      }

      // Get expected migrations from filesystem
      try {
        const migrationFiles = await this.getMigrationFiles('ledger');
        const expectedMigrations = migrationFiles.map(f => f.name);
        status.pendingMigrations = expectedMigrations.filter(
          migration => !status.appliedMigrations.includes(migration)
        );
        status.latestMigration = expectedMigrations[expectedMigrations.length - 1];
        status.isUpToDate = status.pendingMigrations.length === 0 && status.missingTables.length === 0;
      } catch (e) {
        status.error = `Could not read migration files: ${e}`;
      }

    } catch (error) {
      status.connected = false;
      status.error = error instanceof Error ? error.message : String(error);
    }

    return status;
  }

  async checkDialogsDatabase(): Promise<MigrationStatus> {
    const status: MigrationStatus = {
      database: 'dialogs',
      connected: false,
      expectedTables: ['Dialog', 'Message', 'DialogState', 'Log'],
      actualTables: [],
      missingTables: [],
      appliedMigrations: [],
      pendingMigrations: [],
      isUpToDate: false
    };

    try {
      // Test connection
      await this.dialogsClient.$queryRaw`SELECT 1`;
      status.connected = true;

      // Get actual tables
      const tables = await this.dialogsClient.$queryRaw<Array<{tablename: string}>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      `;
      status.actualTables = tables.map(t => t.tablename).sort();

      // Check for missing tables (case-insensitive comparison)
      status.missingTables = status.expectedTables.filter(
        expectedTable => !status.actualTables.some(actualTable => 
          actualTable.toLowerCase() === expectedTable.toLowerCase()
        )
      );

      // Get migration status
      try {
        const migrations = await this.dialogsClient.$queryRaw<Array<{migration_name: string, finished_at: Date | null}>>`
          SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at
        `;
        status.appliedMigrations = migrations
          .filter(m => m.finished_at !== null)
          .map(m => m.migration_name);
      } catch (e) {
        status.error = 'No migrations table found - database not initialized';
      }

      // Get expected migrations from filesystem
      try {
        const migrationFiles = await this.getMigrationFiles('dialogs');
        const expectedMigrations = migrationFiles.map(f => f.name);
        status.pendingMigrations = expectedMigrations.filter(
          migration => !status.appliedMigrations.includes(migration)
        );
        status.latestMigration = expectedMigrations[expectedMigrations.length - 1];
        status.isUpToDate = status.pendingMigrations.length === 0 && status.missingTables.length === 0;
      } catch (e) {
        status.error = status.error ? `${status.error}; Could not read migration files: ${e}` : `Could not read migration files: ${e}`;
      }

    } catch (error) {
      status.connected = false;
      status.error = error instanceof Error ? error.message : String(error);
    }

    return status;
  }

  private async getMigrationFiles(schema: 'ledger' | 'dialogs'): Promise<Array<{name: string, path: string}>> {
    const migrationsDir = join(__dirname, `../schemas/${schema}/migrations`);
    try {
      const entries = await readdir(migrationsDir, { withFileTypes: true });
      const migrationDirs = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'migration_lock.toml')
        .map(entry => ({
          name: entry.name,
          path: join(migrationsDir, entry.name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      return migrationDirs;
    } catch (error) {
      return [];
    }
  }

  async checkAllDatabases(): Promise<MigrationStatus[]> {
    const results = await Promise.all([
      this.checkLedgerDatabase(),
      this.checkDialogsDatabase()
    ]);

    return results;
  }

  async cleanup() {
    await this.ledgerClient.$disconnect();
    await this.dialogsClient.$disconnect();
  }

  printStatus(status: MigrationStatus) {
    console.log(`\n📊 ${status.database.toUpperCase()} Database Status:`);
    console.log(`   Connection: ${status.connected ? '✅ Connected' : '❌ Failed'}`);
    
    if (status.error) {
      console.log(`   Error: ❌ ${status.error}`);
    }

    if (status.connected) {
      console.log(`   Tables: ${status.actualTables.length} found`);
      console.log(`   Found Tables: ${status.actualTables.join(', ')}`);
      console.log(`   Expected Tables: ${status.expectedTables.join(', ')}`);
      if (status.missingTables.length > 0) {
        console.log(`   Missing Tables: ❌ ${status.missingTables.join(', ')}`);
      } else {
        console.log(`   Missing Tables: ✅ None`);
      }

      console.log(`   Applied Migrations: ${status.appliedMigrations.length}`);
      if (status.appliedMigrations.length > 0) {
        status.appliedMigrations.forEach(migration => {
          console.log(`     ✅ ${migration}`);
        });
      }

      if (status.pendingMigrations.length > 0) {
        console.log(`   Pending Migrations: ❌ ${status.pendingMigrations.length}`);
        status.pendingMigrations.forEach(migration => {
          console.log(`     ⏳ ${migration}`);
        });
      } else {
        console.log(`   Pending Migrations: ✅ None`);
      }

      console.log(`   Status: ${status.isUpToDate ? '✅ Up to date' : '❌ Needs migration'}`);
    }
  }
}

async function main() {
  console.log('🔍 Checking database migration status...\n');
  
  const checker = new DatabaseChecker();
  
  try {
    const results = await checker.checkAllDatabases();
    
    let allGood = true;
    for (const status of results) {
      checker.printStatus(status);
      if (!status.connected || !status.isUpToDate) {
        allGood = false;
      }
    }

    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('🎉 All databases are connected and up to date!');
      process.exit(0);
    } else {
      console.log('⚠️  Some databases need attention. See details above.');
      console.log('\nTo fix issues:');
      console.log('  1. Start databases: npm run test:integration:setup');
      console.log('  2. Run migrations: npm run test:integration:migrate');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error checking databases:', error);
    process.exit(1);
  } finally {
    await checker.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseChecker, type MigrationStatus };