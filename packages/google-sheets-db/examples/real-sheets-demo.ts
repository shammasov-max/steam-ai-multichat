#!/usr/bin/env tsx

/**
 * Demo script to test real Google Sheets integration
 * This demonstrates the schema validation and auto-configuration working with actual Google Sheets
 * 
 * To run this demo:
 * 1. Create a Google Service Account and download the JSON credentials
 * 2. Create a new Google Spreadsheet and note its ID
 * 3. Share the spreadsheet with your service account email
 * 4. Update the configuration below
 * 5. Run: npx tsx examples/real-sheets-demo.ts
 */

import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import { 
  createRepository, 
  EnhancedSheetsLayer, 
  validateAndConfigureSheet,
  SheetsService
} from '../src/index.js'

// Example schemas
const UserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  active: S.Boolean,
  department: S.optional(S.String)
})

const TaskSchema = S.Struct({
  title: S.String,
  description: S.String,
  priority: S.Literal('low', 'medium', 'high'),
  completed: S.Boolean,
  assigneeEmail: S.String,
  dueDate: S.optional(S.String)
})

// Configuration - Update these values for your setup
const DEMO_CONFIG = {
  // Replace with your Google Spreadsheet ID (from the URL)
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  
  // Replace with your service account credentials
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // In real use, load from secure file or environment variable
    private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY
  }
}

/**
 * Demo 1: Basic repository with auto-configuration
 */
const basicDemo = Effect.gen(function* () {
  console.log('\\n=== Demo 1: Basic Repository with Auto-Configuration ===')
  console.log('Creating Users repository - this should auto-create sheet and headers...')
  
  const users = yield* createRepository(UserSchema, 'DemoUsers')
  
  console.log('✓ Repository created! Check your Google Sheet for a new "DemoUsers" tab')
  console.log('✓ Headers should be: _id, _deleted, _deletedAt, _createdAt, _updatedAt, email, name, age, active, department')
  
  // Create a test user
  const user = yield* users.create({
    email: 'demo@example.com',
    name: 'Demo User',
    age: 30,
    active: true,
    department: 'Engineering'
  })
  
  console.log('✓ Created user:', user.email, 'with ID:', user._id)
  console.log('✓ Check your Google Sheet - you should see this user in row 2')
  
  return user
})

/**
 * Demo 2: Enhanced layer with multiple schemas
 */
const enhancedDemo = Effect.gen(function* () {
  console.log('\\n=== Demo 2: Enhanced Layer with Multiple Schemas ===')
  console.log('This should validate and create both Users and Tasks sheets...')
  
  const users = yield* createRepository(UserSchema, 'Users')
  const tasks = yield* createRepository(TaskSchema, 'Tasks')
  
  console.log('✓ Both repositories created!')
  console.log('✓ Check your Google Sheet for "Users" and "Tasks" tabs')
  
  // Create sample data
  const user = yield* users.create({
    email: 'alice@company.com',
    name: 'Alice Smith',
    age: 28,
    active: true,
    department: 'Product'
  })
  
  const task = yield* tasks.create({
    title: 'Setup Google Sheets Integration',
    description: 'Configure automatic schema validation for all our data models',
    priority: 'high',
    completed: false,
    assigneeEmail: user.email,
    dueDate: '2025-01-15'
  })
  
  console.log('✓ Created user:', user.name)
  console.log('✓ Created task:', task.title, 'assigned to', task.assigneeEmail)
  
  return { user, task }
})

/**
 * Demo 3: Manual schema validation
 */
const manualValidationDemo = Effect.gen(function* () {
  console.log('\\n=== Demo 3: Manual Schema Validation ===')
  
  const sheetsService = yield* SheetsService
  const doc = sheetsService.doc
  
  console.log('Manually validating ProductCatalog schema...')
  
  const ProductSchema = S.Struct({
    sku: S.String,
    name: S.String,
    price: S.Number,
    category: S.String,
    inStock: S.Boolean,
    tags: S.Array(S.String)
  })
  
  const sheet = yield* validateAndConfigureSheet(doc, ProductSchema, 'ProductCatalog', {
    autoCreateSheets: true,
    autoConfigureHeaders: true,
    backupBeforeChanges: true
  })
  
  console.log('✓ ProductCatalog sheet validated/created')
  console.log('✓ Headers:', sheet.headerValues.join(', '))
  
  return sheet
})

/**
 * Main execution
 */
const main = Effect.gen(function* () {
  console.log('🚀 Google Sheets Schema Validation Demo')
  console.log('Spreadsheet ID:', DEMO_CONFIG.spreadsheetId)
  console.log('Service Account:', DEMO_CONFIG.credentials.client_email)
  
  if (DEMO_CONFIG.credentials.private_key.includes('MOCK_KEY')) {
    console.log('⚠️  WARNING: Using mock credentials. Update DEMO_CONFIG for real testing.')
    console.log('⚠️  This demo will simulate the behavior but won\'t create real sheets.')
  }
  
  try {
    yield* basicDemo
    // yield* enhancedDemo  // Uncomment to run enhanced demo
    // yield* manualValidationDemo  // Uncomment to run manual validation demo
    
    console.log('\\n✅ Demo completed successfully!')
    console.log('📋 Check your Google Sheet at: https://docs.google.com/spreadsheets/d/' + DEMO_CONFIG.spreadsheetId)
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    throw error
  }
})

// Create the enhanced layer and run
const layer = EnhancedSheetsLayer({
  ...DEMO_CONFIG,
  schemas: [
    { schema: UserSchema, sheetTitle: 'Users' },
    { schema: TaskSchema, sheetTitle: 'Tasks' }
  ],
  validationConfig: {
    autoCreateSheets: true,
    autoConfigureHeaders: true,
    backupBeforeChanges: false  // Set to true for production
  }
})

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Google Sheets Demo...')
  
  Effect.runPromise(
    main.pipe(Effect.provide(layer))
  ).then(() => {
    console.log('Demo finished successfully')
    process.exit(0)
  }).catch((error) => {
    console.error('Demo failed:', error)
    process.exit(1)
  })
}

export { main, layer }