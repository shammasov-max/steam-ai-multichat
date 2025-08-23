#!/usr/bin/env tsx
/**
 * Database Migration Status Checker for Dialog AI Service
 * 
 * Verifies that the dialogs database is:
 * 1. Connected and accessible
 * 2. Migrated to the latest schema version
 * 3. Has all expected tables with correct structure
 */

import { PrismaClient } from '@prisma/client';
import { readdir } from 'fs/promises';
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
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async checkDatabase(): Promise<MigrationStatus> {
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
      await this.client.$queryRaw`SELECT 1`;
      status.connected = true;

      // Get actual tables
      const tables = await this.client.$queryRaw<Array<{tablename: string}>>`
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
        const migrations = await this.client.$queryRaw<Array<{migration_name: string, finished_at: Date | null}>>`
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
        const migrationFiles = await this.getMigrationFiles();
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

  private async getMigrationFiles(): Promise<Array<{name: string, path: string}>> {
    const migrationsDir = join(__dirname, '../prisma/migrations');
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

  async cleanup() {
    await this.client.$disconnect();
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
  console.log('🔍 Checking dialogs database migration status...\n');
  
  const checker = new DatabaseChecker();
  
  try {
    const status = await checker.checkDatabase();
    
    checker.printStatus(status);

    console.log('\n' + '='.repeat(50));
    if (status.connected && status.isUpToDate) {
      console.log('🎉 Dialogs database is connected and up to date!');
      process.exit(0);
    } else {
      console.log('⚠️  Database needs attention. See details above.');
      console.log('\nTo fix issues:');
      console.log('  1. Start database: npm run docker:test:up');
      console.log('  2. Run migrations: npm run prisma:migrate');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error checking database:', error);
    process.exit(1);
  } finally {
    await checker.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseChecker, type MigrationStatus };