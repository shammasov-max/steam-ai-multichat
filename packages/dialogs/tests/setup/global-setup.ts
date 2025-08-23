import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  const envPath = path.resolve(__dirname, '../../.env.test');
  console.log('Loading env from:', envPath);
  dotenv.config({ path: envPath });
  
  console.log('🔧 Setting up test environment...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    // Wait for database to be ready (if using Docker)
    if (true) { // Always wait since we're using Docker
      console.log('⏳ Waiting for Docker database to be ready...');
      await waitForDatabase();
    }
    
    // Setup test database
    console.log('📊 Setting up test database...');
    const testDatabaseUrl = "postgresql://test:test@localhost:54320/steambot_test";
    execSync('npx prisma migrate reset --force --skip-seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDatabaseUrl }
    });
    
    console.log('🔄 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Prisma generate failed, likely due to file permissions. Continuing...');
    }
    
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
      const testDatabaseUrl = "postgresql://test:test@localhost:54320/steambot_test";
      execSync('npx prisma db push --force-reset', { 
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: testDatabaseUrl }
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