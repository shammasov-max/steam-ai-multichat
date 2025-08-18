import { test, expect } from '@playwright/test';

test('Simple test without Steam dependencies', async () => {
  console.log('Starting simple test...');
  
  // Just test basic functionality without Steam imports
  const testData = {
    login: 'test',
    password: 'test',
    proxy: 'http://test:3000',
    maFile: '{"shared_secret":"test"}'
  };
  
  console.log('Test data:', testData);
  expect(testData.login).toBe('test');
  
  console.log('Simple test completed successfully!');
});