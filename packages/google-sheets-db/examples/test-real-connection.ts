#!/usr/bin/env tsx

/**
 * Quick test to verify Google Sheets connection and see the actual results
 */

import * as fs from 'node:fs'
import * as S from '@effect/schema/Schema'
import * as Effect from 'effect/Effect'
import { createRepository, SheetsLayer } from '../src/index.js'

// Read credentials
let privateKey: string
try {
  privateKey = fs.readFileSync('../../google-service_private_key.pem', 'utf-8')
  console.log('✓ Loaded private key from file')
  console.log('Key format:', privateKey.substring(0, 30) + '...')
} catch (error) {
  console.error('❌ Failed to load private key:', error)
  process.exit(1)
}

const TestSchema = S.Struct({
  name: S.String,
  email: S.String,
  age: S.Number
})

const sheetsConfig = {
  spreadsheetId: '1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28',
  credentials: {
    client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
    private_key: privateKey
  }
}

const program = Effect.gen(function* () {
  console.log('\\n🔗 Attempting to connect to Google Sheets...')
  console.log('Spreadsheet ID:', sheetsConfig.spreadsheetId)
  console.log('Service Account:', sheetsConfig.credentials.client_email)
  
  try {
    console.log('\\n📋 Creating repository for TestSheet...')
    const users = yield* createRepository(TestSchema, 'TestSheet')
    console.log('✅ Repository created successfully!')
    
    console.log('\\n👤 Creating test record...')
    const user = yield* users.create({
      name: 'Test User',
      email: 'test@example.com', 
      age: 30
    })
    
    console.log('✅ Record created:', user)
    console.log('\\n🎉 SUCCESS! Check your Google Sheet now!')
    console.log('Sheet URL: https://docs.google.com/spreadsheets/d/' + sheetsConfig.spreadsheetId)
    
    return user
    
  } catch (error) {
    console.error('\\n❌ Error details:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error name:', error.name)
    }
    throw error
  }
})

const layer = SheetsLayer(sheetsConfig)

Effect.runPromise(
  program.pipe(Effect.provide(layer))
).then((result) => {
  console.log('\\n✅ Test completed successfully!')
  console.log('Result:', result)
}).catch((error) => {
  console.error('\\n❌ Test failed!')
  console.error('Error:', error)
  
  if (error && typeof error === 'object' && 'message' in error) {
    if (error.message.includes('Authentication failed')) {
      console.log('\\n💡 Authentication troubleshooting:')
      console.log('1. Check that your private key is in PKCS#8 format (-----BEGIN PRIVATE KEY-----)')
      console.log('2. Verify the spreadsheet is shared with:', sheetsConfig.credentials.client_email)
      console.log('3. Ensure Google Sheets API is enabled in your Google Cloud project')
    }
  }
  
  process.exit(1)
})