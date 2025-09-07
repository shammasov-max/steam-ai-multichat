#!/usr/bin/env tsx

/**
 * Debug authentication with Google Sheets API
 */

import { GoogleSpreadsheet } from 'google-spreadsheet'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function testAuth() {
  console.log('🔍 Testing Google Sheets Authentication...')
  
  // Define credentials at function scope
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_PRIVATE_KEY
  }
  
  try {
    // Load credentials from environment variables only
    console.log('🔑 Loading credentials from environment variables...')
    let privateKey = process.env.GOOGLE_SERVICE_PRIVATE_KEY
    
    if (!privateKey) {
      throw new Error('GOOGLE_SERVICE_PRIVATE_KEY environment variable is not set')
    }
    
    // Fix private key format - ensure proper line breaks
    // The key might have escaped newlines that need to be converted
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    // Remove any indentation from multiline env var
    privateKey = privateKey.split('\n').map(line => line.trim()).join('\n')
    
    // Additional check: ensure the key has proper format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Private key does not have the expected format')
    }
    
    // Debug: Check if the key has proper line breaks
    const keyLines = privateKey.split('\n')
    console.log('✓ Loaded private key from environment')
    console.log('Key has', keyLines.length, 'lines')
    console.log('Key starts with:', privateKey.substring(0, 27))
    console.log('Key ends with:', privateKey.substring(privateKey.length - 27))
    
    // Additional formatting: ensure consistent line endings and no extra whitespace
    privateKey = privateKey.trim()
    
    // Update credentials with verified private key
    credentials.private_key = privateKey
    
    console.log('Service account email:', credentials.client_email)
    
    // Test spreadsheet connection
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    console.log('Connecting to spreadsheet:', spreadsheetId)
    
    // For google-spreadsheet v4, pass auth during construction
    const { JWT } = await import('google-auth-library')
    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    })
    
    console.log('🔐 Attempting authentication...')
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
    console.log('✅ Authentication configured!')
    
    console.log('📋 Loading spreadsheet info...')
    await doc.loadInfo()
    console.log('✅ Spreadsheet loaded!')
    console.log('Spreadsheet title:', doc.title)
    console.log('Sheet count:', doc.sheetCount)
    
    if (doc.sheetCount > 0) {
      console.log('Available sheets:')
      Object.entries(doc.sheetsById).forEach(([id, sheet]) => {
        console.log(`  - ${sheet.title} (ID: ${id})`)
      })
    }
    
    // Try to create a test sheet
    console.log('\\n🆕 Testing sheet creation...')
    const testSheet = await doc.addSheet({
      title: 'AuthTestSheet',
      headerValues: ['test_id', 'test_name', 'test_value']
    })
    console.log('✅ Test sheet created:', testSheet.title)
    
    // Try to add a test row
    console.log('📝 Testing row creation...')
    await testSheet.addRow({
      test_id: 'test_001',
      test_name: 'Authentication Test',
      test_value: 'Success!'
    })
    console.log('✅ Test row added!')
    
    // Clean up test sheet
    console.log('🧹 Cleaning up test sheet...')
    await testSheet.delete()
    console.log('✅ Test sheet deleted!')
    
    console.log('\\n🎉 All authentication tests passed!')
    console.log('Your Google Sheets integration is working perfectly!')
    
  } catch (error) {
    console.error('\\n❌ Authentication test failed:')
    console.error(error)
    
    if (error instanceof Error) {
      console.log('\\n🔍 Error analysis:')
      console.log('Error name:', error.name)
      console.log('Error message:', error.message)
      
      if (error.message.includes('403')) {
        console.log('\\n💡 This looks like a permissions issue:')
        console.log(`- Make sure the spreadsheet is shared with: ${credentials.client_email}`)
        console.log('- Give the service account "Editor" permissions')
      } else if (error.message.includes('401') || error.message.includes('invalid_grant')) {
        console.log('\\n💡 This looks like an authentication issue:')
        console.log('- Check that the service account credentials are valid')
        console.log('- Verify the Google Sheets API is enabled in your project')
        console.log('- Make sure the service account email matches the private key')
        console.log(`- Current service account: ${credentials.client_email}`)
      } else if (error.message.includes('404')) {
        console.log('\\n💡 This looks like the spreadsheet is not found:')
        console.log('- Check the spreadsheet ID is correct')
        console.log('- Make sure the spreadsheet exists and is accessible')
      } else if (error.message.includes('Invalid JWT')) {
        console.log('\\n💡 JWT signature validation failed:')
        console.log('- The private key might not match the service account')
        console.log('- Check that the private key belongs to:', credentials.client_email)
        console.log('- Ensure the key file hasn\'t been corrupted')
      }
    }
    
    process.exit(1)
  }
}

testAuth()
