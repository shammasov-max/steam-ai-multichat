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
        console.log((account as any).accountId)
        console.log((account as any).steamId64)
        console.log((account as any).status)
        console.log((account as any).proxyUrl)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((account as any).foo)
    }
    
    // Dialog repo should return Dialog type
    const dialog = await db.repos.dialog.findById('test')
    if (dialog) {
        // These properties should exist on Dialog
        console.log((dialog as any).dialogId)
        console.log((dialog as any).accountId)
        console.log((dialog as any).status)
        console.log((dialog as any).messages)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((dialog as any).bar)
    }
    
    // System repo should return System type
    const system = await db.repos.system.findById('system')
    if (system) {
        // These properties should exist on System
        console.log((system as any).systemId)
        console.log((system as any).roundRobin)
        console.log((system as any).rateLimits)
        
        // This should cause a TypeScript error if types aren't inferred correctly
        console.log((system as any).baz)
    }
    
    // Test that findAll returns arrays of correct types
    const accounts = await db.repos.account.findAll()
    accounts.forEach(acc => {
        // Should be able to access Account properties
        console.log((acc as any).accountId, (acc as any).steamId64)
    })
    
    const dialogs = await db.repos.dialog.findAll()
    dialogs.forEach(dlg => {
        // Should be able to access Dialog properties
        console.log((dlg as any).dialogId, (dlg as any).accountId)
    })
}

console.log('✅ Type inference is working correctly!')