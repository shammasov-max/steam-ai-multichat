#!/usr/bin/env tsx

/**
 * Simple test to verify real Google Sheets integration
 * This will create actual sheets and data in your Google Spreadsheet
 */

import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import * as fs from 'node:fs'
import { createRepository, SheetsLayer } from '../src/index.js'

// Try to read real credentials
let privateKey: string
let hasRealCredentials = false

try {
  // Try to read from the credential file mentioned in the original tests
  privateKey = fs.readFileSync('../../../../google-service_rsa_private.pem', 'utf-8')
  hasRealCredentials = true
  console.log('✓ Found real Google service account credentials')
} catch {
  privateKey = '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n'
  console.log('⚠️  Using mock credentials - no real sheets will be created')
}

// Test schema
const TestUserSchema = S.Struct({
  email: S.String,
  name: S.String,
  age: S.Number,
  active: S.Boolean
})

const sheetsConfig = {
  spreadsheetId: '1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28',
  credentials: {
    client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
    private_key: privateKey
  }
}

const testProgram = Effect.gen(function* () {
  console.log('\\n🧪 Testing Google Sheets Schema Validation')
  console.log('Spreadsheet ID:', sheetsConfig.spreadsheetId)
  console.log('Has real credentials:', hasRealCredentials)
  
  if (!hasRealCredentials) {
    console.log('\\n⏭️  Skipping real sheet creation - no credentials found')
    console.log('To test with real sheets:')
    console.log('1. Place your Google service account private key at: ../../../../google-service_rsa_private.pem')
    console.log('2. Ensure the spreadsheet is shared with:', sheetsConfig.credentials.client_email)
    console.log('3. Run this script again')
    return
  }
  
  console.log('\\n📋 Creating repository for RealTestUsers...')
  console.log('This should:')
  console.log('- Create a new "RealTestUsers" sheet (if it doesn\'t exist)')
  console.log('- Add headers: _id, _deleted, _deletedAt, _createdAt, _updatedAt, email, name, age, active')
  
  try {
    const users = yield* createRepository(TestUserSchema, 'RealTestUsers')
    console.log('✅ Repository created successfully!')
    
    console.log('\\n👤 Creating test user...')
    const user = yield* users.create({
      email: 'realtest@example.com',
      name: 'Real Test User',
      age: 30,
      active: true
    })
    
    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      name: user.name,
      created: user._createdAt
    })
    
    console.log('\\n🎉 Success! Check your Google Sheet at:')
    console.log(`https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}`)
    console.log('You should see:')
    console.log('- A new "RealTestUsers" tab')
    console.log('- Headers in row 1')
    console.log('- User data in row 2')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      console.log('\\n💡 Authentication troubleshooting:')
      console.log('- Verify the private key file is valid')
      console.log('- Check that the spreadsheet is shared with:', sheetsConfig.credentials.client_email)
      console.log('- Ensure Google Sheets API is enabled in your Google Cloud project')
    }
    
    throw error
  }
})

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  const layer = SheetsLayer(sheetsConfig)
  
  Effect.runPromise(
    testProgram.pipe(Effect.provide(layer))
  ).then(() => {
    console.log('\\n✅ Test completed!')
  }).catch((error) => {
    console.error('\\n❌ Test failed:', error)
    process.exit(1)
  })
}

export { testProgram }