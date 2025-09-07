#!/usr/bin/env tsx

/**
 * Simple debug authentication with Google Sheets API
 */

import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function testAuth() {
  console.log('🔍 Testing Google Sheets Authentication...')
  
  try {
    // Load credentials from environment variables
    let privateKey = process.env.GOOGLE_SERVICE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    
    if (!privateKey || !clientEmail) {
      throw new Error('Missing required environment variables: GOOGLE_SERVICE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL')
    }
    
    // Debug the raw key
    console.log('Raw key starts with:', privateKey.substring(0, 10))
    console.log('Raw key ends with:', privateKey.substring(privateKey.length - 10))
    
    // Remove quotes if present (from .env file)
    // Note: The key might have a newline before the closing quote
    if (privateKey.startsWith('"')) {
      privateKey = privateKey.slice(1)
    }
    if (privateKey.endsWith('"')) {
      privateKey = privateKey.slice(0, -1)
    }
    if (privateKey.endsWith('\n"')) {
      privateKey = privateKey.slice(0, -2) + '\n'
    }
    
    // Fix private key format - ensure proper line breaks
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    console.log('Service account:', clientEmail)
    console.log('Private key loaded:', privateKey.substring(0, 50) + '...')
    console.log('Key has', privateKey.split('\n').length, 'lines')
    
    // Create JWT auth
    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    console.log('🔐 Authenticating...')
    
    // Test with spreadsheet
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
    
    console.log('📋 Loading spreadsheet info...')
    await doc.loadInfo()
    
    console.log('✅ SUCCESS! Authentication working!')
    console.log('Spreadsheet title:', doc.title)
    console.log('Sheet count:', doc.sheetCount)
    
  } catch (error) {
    console.error('❌ Authentication failed:')
    console.error(error)
    
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      console.log('\n💡 Troubleshooting:')
      console.log('1. The private key might not match the service account email')
      console.log('2. Check if the service account email is correct')
      console.log('3. Ensure the Google Sheets API is enabled in your GCP project')
    }
  }
}

testAuth()
