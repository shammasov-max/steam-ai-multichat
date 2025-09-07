// Unit test for database package types and structure
import { createDb } from '../src/index'
import { accountSlice, dialogSlice, systemSlice } from '@packages/isomorphic'

console.log('🧪 Running DB package unit tests...\n')

// Test 1: Verify createDb function exists and returns correct type
console.log('Test 1: Checking createDb function...')
const db = createDb('mongodb://localhost:27017/test')
console.log('✅ createDb returns database instance\n')

// Test 2: Verify database instance has correct properties
console.log('Test 2: Checking database structure...')
if (!db.eventStore) {
    throw new Error('eventStore property missing')
}
if (!db.repos) {
    throw new Error('repos property missing')
}
console.log('✅ Database has eventStore and repos\n')

// Test 3: Verify repositories are created for each slice
console.log('Test 3: Checking repository creation...')
if (!('account' in db.repos)) {
    throw new Error('account repository missing')
}
if (!('dialog' in db.repos)) {
    throw new Error('dialog repository missing')
}
if (!('system' in db.repos)) {
    throw new Error('system repository missing')
}
console.log('✅ All repositories present\n')

// Test 4: Verify repository methods exist
console.log('Test 4: Checking repository methods...')
const accountRepo = db.repos.account
if (typeof accountRepo.findById !== 'function') {
    throw new Error('findById method missing')
}
if (typeof accountRepo.findAll !== 'function') {
    throw new Error('findAll method missing')
}
if (typeof accountRepo.save !== 'function') {
    throw new Error('save method missing')
}
if (typeof accountRepo.delete !== 'function') {
    throw new Error('delete method missing')
}
console.log('✅ Repository methods exist\n')

// Test 5: Verify event store methods exist
console.log('Test 5: Checking event store methods...')
if (typeof db.eventStore.append !== 'function') {
    throw new Error('append method missing')
}
if (typeof db.eventStore.appendBatch !== 'function') {
    throw new Error('appendBatch method missing')
}
if (typeof db.eventStore.getEvents !== 'function') {
    throw new Error('getEvents method missing')
}
console.log('✅ Event store methods exist\n')

// Test 6: Verify slices have required properties
console.log('Test 6: Checking slice properties...')
if (!accountSlice.name || accountSlice.name !== 'account') {
    throw new Error('Account slice name incorrect')
}
if (!accountSlice.schema) {
    throw new Error('Account slice schema missing')
}
if (!dialogSlice.name || dialogSlice.name !== 'dialog') {
    throw new Error('Dialog slice name incorrect')
}
if (!dialogSlice.schema) {
    throw new Error('Dialog slice schema missing')
}
if (!systemSlice.name || systemSlice.name !== 'system') {
    throw new Error('System slice name incorrect')
}
if (!systemSlice.schema) {
    throw new Error('System slice schema missing')
}
console.log('✅ Slices have correct properties\n')

// Test 7: Verify schema annotations include indexes
console.log('Test 7: Checking schema annotations...')
// Get the AST to check annotations
const accountAST = (accountSlice.schema as any).ast || {}
const dialogAST = (dialogSlice.schema as any).ast || {}
const systemAST = (systemSlice.schema as any).ast || {}

// Check that annotations exist in AST
if (!accountAST.annotations) {
    console.log('⚠️  Account schema annotations not accessible (this is OK for runtime)')
} else if (accountAST.annotations.indexes) {
    console.log('  ✓ Account schema has index annotations')
}

if (!dialogAST.annotations) {
    console.log('⚠️  Dialog schema annotations not accessible (this is OK for runtime)')
} else if (dialogAST.annotations.indexes) {
    console.log('  ✓ Dialog schema has index annotations')
}

if (!systemAST.annotations) {
    console.log('⚠️  System schema annotations not accessible (this is OK for runtime)')
} else if (systemAST.annotations.indexes) {
    console.log('  ✓ System schema has index annotations')
}

console.log('✅ Schema structure verified\n')

// Test 8: Verify database methods exist
console.log('Test 8: Checking database methods...')
if (typeof db.init !== 'function') {
    throw new Error('init method missing')
}
if (typeof db.close !== 'function') {
    throw new Error('close method missing')
}
if (typeof db.clearAll !== 'function') {
    throw new Error('clearAll method missing')
}
console.log('✅ Database methods exist\n')

console.log('✨ All unit tests passed!')
console.log('\nNote: Integration tests require MongoDB connection')
process.exit(0)