import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });
  
  console.log('🔧 Setting up test environment...');
  
  try {
    // Wait for database to be ready (if using Docker)
    if (process.env.DATABASE_URL?.includes('localhost:5433')) {
      console.log('⏳ Waiting for Docker database to be ready...');
      await waitForDatabase();
    }
    
    // Setup test database
    console.log('📊 Setting up test database...');
    execSync('npx prisma migrate reset --force --skip-seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}

async function waitForDatabase(): Promise<void> {
  const maxAttempts = 30;
  const delay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync('npx prisma db push --force-reset', { 
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
      });
      console.log('✅ Database connection established');
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Database not ready after ${maxAttempts} attempts`);
      }
      console.log(`⏳ Database not ready, attempt ${attempt}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default globalSetup;