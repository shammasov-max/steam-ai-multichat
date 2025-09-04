import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Cleanup operations if needed
    console.log('✅ Test cleanup complete');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
}

export default globalTeardown;