import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TestAccount {
  login: string;
  password: string;
  proxy: string;
  maFile: string;
}

export async function loadTestAccounts(): Promise<TestAccount[]> {
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

export async function getTestAccountPair(): Promise<[TestAccount, TestAccount]> {
  const accounts = await loadTestAccounts();
  
  if (accounts.length < 2) {
    throw new Error(`Need at least 2 test accounts, found ${accounts.length}`);
  }
  
  return [accounts[0], accounts[1]];
}