import { createSteamAgent } from '../../src/index.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TestAccount {
  login: string;
  password: string;
  proxy: string;
  maFile: string;
}

export interface PooledAgent {
  agent: any;
  account: TestAccount;
  steamID: string;
  isLoggedIn: boolean;
  lastLoginAttempt: number;
  loginAttempts: number;
}

class TestAgentPool {
  private static instance: TestAgentPool;
  private agents: Map<string, PooledAgent> = new Map();
  private initialized = false;
  private loginQueue: Promise<void> = Promise.resolve();
  
  // Rate limit configuration
  private readonly LOGIN_RETRY_DELAY = 5000; // 5 seconds between retry attempts per account
  private readonly LOGIN_QUEUE_DELAY = 1000; // 1 second between different account logins
  private readonly MAX_LOGIN_ATTEMPTS = 3;
  
  private constructor() {}
  
  static getInstance(): TestAgentPool {
    if (!TestAgentPool.instance) {
      TestAgentPool.instance = new TestAgentPool();
    }
    return TestAgentPool.instance;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('ℹ️  Agent pool already initialized');
      return;
    }
    
    console.log('🚀 Initializing test agent pool...\n');
    
    // Load test accounts
    const accounts = await this.loadTestAccounts();
    if (accounts.length < 9) {
      throw new Error(`Need at least 9 test accounts to use indices 6,7,8, found ${accounts.length}`);
    }
    
    // Create agents for accounts at indices 6, 7, 8 (last 3 accounts)
    const targetAccounts = [accounts[6], accounts[7], accounts[8]].filter(Boolean);
    if (targetAccounts.length < 3) {
      throw new Error(`Could not get 3 accounts at indices 6,7,8`);
    }
    console.log(`Using accounts: ${targetAccounts.map(a => a.login).join(', ')}`);
    for (const account of targetAccounts) {
      const agent = createSteamAgent({
        maFile: account.maFile,
        password: account.password,
        userName: account.login,
        proxy: account.proxy
      });
      
      this.agents.set(account.login, {
        agent,
        account,
        steamID: '',
        isLoggedIn: false,
        lastLoginAttempt: 0,
        loginAttempts: 0
      });
      
      console.log(`✅ Created agent for ${account.login}`);
    }
    
    this.initialized = true;
    console.log('\n✅ Agent pool initialized with ${this.agents.size} agents\n');
  }
  
  private async loadTestAccounts(): Promise<TestAccount[]> {
    const fixturesPath = join(process.cwd(), '..', '..', 'fixtures', 'all.txt');
    const content = await readFile(fixturesPath, 'utf-8');
    
    const accounts: TestAccount[] = [];
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const parts = trimmed.split(' - ');
      if (parts.length !== 2) continue;
      
      const [loginPassword, proxyInfo] = parts;
      const [login, password] = loginPassword.split(':');
      
      if (!login || !password || !proxyInfo) continue;
      
      const maFilePath = join(process.cwd(), '..', '..', 'fixtures', 'mafile', `${login}.maFile`);
      const maFileContent = await readFile(maFilePath, 'utf-8');
      
      accounts.push({
        login,
        password,
        proxy: `http://${proxyInfo}`,
        maFile: maFileContent
      });
    }
    
    return accounts;
  }
  
  async loginAll(): Promise<void> {
    console.log('🔐 Logging in all agents with rate limit protection...\n');
    
    const agents = Array.from(this.agents.values());
    let successCount = 0;
    
    for (let i = 0; i < agents.length; i++) {
      const pooledAgent = agents[i];
      
      // Skip if already logged in
      if (pooledAgent.isLoggedIn) {
        console.log(`✅ ${pooledAgent.account.login} already logged in`);
        successCount++;
        continue;
      }
      
      // Check if we should retry based on last attempt
      const timeSinceLastAttempt = Date.now() - pooledAgent.lastLoginAttempt;
      if (pooledAgent.loginAttempts > 0 && timeSinceLastAttempt < this.LOGIN_RETRY_DELAY) {
        const waitTime = Math.ceil((this.LOGIN_RETRY_DELAY - timeSinceLastAttempt) / 1000);
        console.log(`⏳ Skipping ${pooledAgent.account.login} (waiting ${waitTime}s before retry)`);
        continue;
      }
      
      // Check max attempts
      if (pooledAgent.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        console.log(`❌ Skipping ${pooledAgent.account.login} (max attempts reached)`);
        continue;
      }
      
      // Queue the login attempt
      this.loginQueue = this.loginQueue.then(async () => {
        try {
          console.log(`Attempt ${pooledAgent.loginAttempts + 1}: Logging in ${pooledAgent.account.login}...`);
          
          pooledAgent.lastLoginAttempt = Date.now();
          pooledAgent.loginAttempts++;
          
          await this.loginAgent(pooledAgent);
          
          pooledAgent.isLoggedIn = true;
          pooledAgent.steamID = pooledAgent.agent.getSteamID();
          console.log(`✅ ${pooledAgent.account.login} logged in with SteamID: ${pooledAgent.steamID}`);
          successCount++;
          
          // Wait before next login
          if (i < agents.length - 1) {
            console.log(`⏳ Waiting ${this.LOGIN_QUEUE_DELAY / 1000}s before next login...`);
            await new Promise(resolve => setTimeout(resolve, this.LOGIN_QUEUE_DELAY));
          }
        } catch (error: any) {
          console.error(`❌ Failed to login ${pooledAgent.account.login}: ${error.message}`);
          
          // If rate limited, we'll wait longer for the next attempt
          if (error.message === 'RateLimitExceeded' || error.message.includes('RateLimit')) {
            console.log(`⚠️  Rate limited on ${pooledAgent.account.login}, will retry later`);
          }
        }
      });
    }
    
    await this.loginQueue;
    
    console.log(`\n📊 Login results: ${successCount}/${agents.length} agents logged in successfully\n`);
    
    if (successCount === 0) {
      throw new Error('Failed to login any agents');
    }
  }
  
  private async loginAgent(pooledAgent: PooledAgent): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Login timeout'));
      }, 60000);
      
      pooledAgent.agent.once('loggedOn', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      pooledAgent.agent.once('error', (err: any) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      pooledAgent.agent.login();
    });
  }
  
  getLoggedInAgents(): PooledAgent[] {
    return Array.from(this.agents.values()).filter(a => a.isLoggedIn);
  }
  
  getAgent(index: number): PooledAgent | undefined {
    const loggedIn = this.getLoggedInAgents();
    return loggedIn[index];
  }
  
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up agent pool...');
    
    for (const pooledAgent of this.agents.values()) {
      if (pooledAgent.isLoggedIn) {
        try {
          pooledAgent.agent.logout();
        } catch (e) {
          console.warn(`Cleanup warning for ${pooledAgent.account.login}:`, e);
        }
      }
    }
    
    // Wait for Steam to process logouts
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reset state but keep agents for reuse
    for (const pooledAgent of this.agents.values()) {
      pooledAgent.isLoggedIn = false;
      pooledAgent.steamID = '';
    }
    
    console.log('✅ Agent pool cleaned up');
  }
  
  // Get summary of pool state
  getStatus(): string {
    const loggedIn = this.getLoggedInAgents();
    const total = this.agents.size;
    return `Agent Pool: ${loggedIn.length}/${total} logged in`;
  }
}

export const testAgentPool = TestAgentPool.getInstance();