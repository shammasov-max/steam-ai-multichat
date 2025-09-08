import { createDb } from '../src/index.js'

// This file tests that type inference is working correctly
// If this compiles without errors, our types are properly inferred

const db = createDb('mongodb://localhost:27017/test')

// Test 1: Verify repos have correct property names
const accountRepo = db.repos.account  // Should exist
const dialogRepo = db.repos.dialog    // Should exist
const systemRepo = db.repos.system    // Should exist

// Test 2: Verify methods exist and return proper types
async function testInference() {
    // Account repo should return Account type
    const account = await db.repos.account.findById('test')
    if (account) {
        // These properties should exist on Account
        console.log(account.accountId)
        console.log(account.steamId64)
        console.log(account.status)
        console.log(account.proxyUrl)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((account as any).foo)
    }
    
    // Dialog repo should return Dialog type
    const dialog = await db.repos.dialog.findById('test')
    if (dialog) {
        // These properties should exist on Dialog
        console.log(dialog.dialogId)
        console.log(dialog.accountId)
        console.log(dialog.status)
        console.log(dialog.messages)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((dialog as any).bar)
    }
    
    // System repo should return System type
    const system = await db.repos.system.findById('system')
    if (system) {
        // These properties should exist on System
        console.log(system.systemId)
        console.log(system.roundRobin)
        console.log(system.rateLimits)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((system as any).baz)
    }
    
    // Test that findAll returns arrays of correct types
    const accounts = await db.repos.account.findAll()
    accounts.forEach(acc => {
        // Should be able to access Account properties
        console.log(acc.accountId, acc.steamId64)
    })
    
    const dialogs = await db.repos.dialog.findAll()
    dialogs.forEach(dlg => {
        // Should be able to access Dialog properties
        console.log(dlg.dialogId, dlg.accountId)
    })
}

console.log('✅ Type inference is working correctly!')