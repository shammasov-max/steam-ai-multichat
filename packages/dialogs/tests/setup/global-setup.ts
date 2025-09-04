import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set DATABASE_URL for test database
  process.env.DATABASE_URL = "postgresql://test:test@localhost:54320/steambot_test";
  
  // Preserve OPENAI_API_KEY if it's set
  if (process.env.OPENAI_API_KEY) {
    console.log('🔑 OPENAI_API_KEY detected '+process.env.OPENAI_API_KEY);
  }
  
  console.log('🔧 Setting up test environment...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('✅ Test environment setup complete (simplified setup)');
}

export default globalSetup;
