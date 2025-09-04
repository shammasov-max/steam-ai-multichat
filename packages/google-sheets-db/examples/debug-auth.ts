#!/usr/bin/env tsx

/**
 * Debug authentication with Google Sheets API
 */

import { GoogleSpreadsheet } from 'google-spreadsheet'
import * as fs from 'node:fs'

async function testAuth() {
  console.log('🔍 Testing Google Sheets Authentication...')
  
  try {
    // Load credentials
    const privateKey = fs.readFileSync('../../google-service_private_key.pem', 'utf-8')
    console.log('✓ Loaded private key')
    console.log('Key starts with:', privateKey.substring(0, 27))
    console.log('Key ends with:', privateKey.substring(privateKey.length - 27))
    
    const credentials = {
      client_email: 'steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com',
      private_key: privateKey
    }
    
    console.log('Service account email:', credentials.client_email)
    
    // Test spreadsheet connection
    const spreadsheetId = '1nJm6q238nL6xVUIsrYWcSZ7EtFizV3GBO_xy1kXlR28'
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
      doc.sheetsById.forEach((sheet, id) => {
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
        console.log('- Make sure the spreadsheet is shared with: steam-ai-multichat@steam-ai-multichats.iam.gserviceaccount.com')
        console.log('- Give the service account "Editor" permissions')
      } else if (error.message.includes('401')) {
        console.log('\\n💡 This looks like an authentication issue:')
        console.log('- Check that the service account credentials are valid')
        console.log('- Verify the Google Sheets API is enabled in your project')
      } else if (error.message.includes('404')) {
        console.log('\\n💡 This looks like the spreadsheet is not found:')
        console.log('- Check the spreadsheet ID is correct')
        console.log('- Make sure the spreadsheet exists and is accessible')
      }
    }
    
    process.exit(1)
  }
}

testAuth()