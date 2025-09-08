import { createDb } from '../src/index.js'
import type { Account, Dialog, System } from '@packages/isomorphic'
import { createAccountId } from '@packages/isomorphic'
import type { Repository } from '../src/MongoDatabase.js'

// Test type inference
const db = createDb('mongodb://localhost:27017/test')

// These should have proper types now
const accountRepo: Repository<Account> = db.repos.account
const dialogRepo: Repository<Dialog> = db.repos.dialog  
const systemRepo: Repository<System> = db.repos.system

// Test that methods have proper return types
async function testTypes() {
    // Should return Account | null
    const account = await db.repos.account.findById('test')
    if (account) {
        // Type should be Account
        const id: string = account.accountId
        const status: 'connecting' | 'connected' | 'disconnected' | 'authFailed' = account.status
        const steamId: string = account.steamId64
    }
    
    // Should return Account[]
    const accounts = await db.repos.account.findAll()
    accounts.forEach(acc => {
        const id: string = acc.accountId
    })
    
    // Should accept Account
    const testAccount: Account = {
        accountId: createAccountId('12345678901234567'),
        steamId64: '12345678901234567',
        proxyUrl: 'http://proxy.test',
        status: 'connected',
        label: 'Test Account',
        lastSeen: Date.now()
    }
    await db.repos.account.save(testAccount)
    
    // Dialog repo should have Dialog type
    const dialog = await db.repos.dialog.findById('test')
    if (dialog) {
        const dialogId: string = dialog.dialogId
        const status: 'created' | 'active' | 'paused' | 'completed' | 'escalated' = dialog.status
    }
    
    // System repo should have System type
    const system = await db.repos.system.findById('system')
    if (system) {
        const systemId: string = system.systemId
        const roundRobin = system.roundRobin
        const pointer: number = roundRobin.pointer
    }
}

console.log('Type test file compiled successfully!')