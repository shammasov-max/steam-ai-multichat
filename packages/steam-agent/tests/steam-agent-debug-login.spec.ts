import { test, expect } from '@playwright/test';
import { createSteamAgent } from '../src/index.js';
import { getTestAccountPair } from './fixtures.js';

test('Debug Steam login process', async () => {
  console.log('🔍 Starting Steam login debug test...');
  
  const [userAAccount] = await getTestAccountPair();
  console.log(`Testing login for: ${userAAccount.login}`);
  
  const agent = createSteamAgent({
    maFile: userAAccount.maFile,
    password: userAAccount.password,
    userName: userAAccount.login,
    proxy: userAAccount.proxy
  });

  // Add comprehensive event listeners
  agent.on('loggedOn', () => {
    console.log('✅ loggedOn event received!');
    console.log(`SteamID: ${agent.getSteamID()}`);
  });

  agent.on('error', (err: Error) => {
    console.error('❌ Steam error:', err.message);
    console.error('Full error:', err);
  });

  agent.on('disconnected', (eresult: number, msg?: string) => {
    console.log(`⚠️ Disconnected: ${eresult}, ${msg || 'no message'}`);
  });

  agent.on('debug', (msg: string) => {
    console.log(`🐛 Debug: ${msg}`);
  });

  console.log('🔐 Attempting to login...');
  
  try {
    // Add timeout to login itself
    const loginPromise = agent.login();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout after 60 seconds')), 60000);
    });
    
    await Promise.race([loginPromise, timeoutPromise]);
    console.log('✅ Login method completed successfully');
    
    // Check if we're actually logged in
    if (agent.getIsLoggedIn()) {
      console.log('✅ Agent reports as logged in');
      console.log(`SteamID: ${agent.getSteamID()}`);
    } else {
      console.log('❌ Agent reports as NOT logged in');
    }
    
    // Wait for any additional events
    console.log('⏳ Waiting 10 seconds for any delayed events...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    
    // Try to get more information about the error
    console.log('Agent state:');
    console.log('- Is logged in:', agent.getIsLoggedIn());
    console.log('- SteamID:', agent.getSteamID());
    
    throw error;
  } finally {
    console.log('🧹 Cleaning up...');
    agent.logout();
  }
});