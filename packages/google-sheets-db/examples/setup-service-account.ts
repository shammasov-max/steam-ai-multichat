#!/usr/bin/env tsx

/**
 * Helper script to set up Google Service Account credentials
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📋 Google Service Account Setup Helper\n')

console.log('1️⃣  First, create a service account:\n')
console.log('   • Go to: https://console.cloud.google.com/iam-admin/serviceaccounts')
console.log('   • Create a new service account')
console.log('   • Download the JSON key file\n')

console.log('2️⃣  Place the JSON file in this directory and run:')
console.log('   npx tsx setup-service-account.ts path/to/your-service-account.json\n')

const jsonPath = process.argv[2]

if (!jsonPath) {
  console.log('❓ No JSON file provided. Follow the steps above first.')
  process.exit(0)
}

try {
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  
  if (!jsonContent.private_key || !jsonContent.client_email) {
    throw new Error('Invalid service account JSON file')
  }
  
  console.log('✅ Found service account credentials:\n')
  console.log('   Email:', jsonContent.client_email)
  console.log('   Project:', jsonContent.project_id)
  
  // Create .env content
  const envPath = path.resolve(__dirname, '../../../.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Update or add the credentials
  const updatedEnv = updateEnvFile(envContent, {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: jsonContent.client_email,
    GOOGLE_SERVICE_PRIVATE_KEY: jsonContent.private_key
  })
  console.log('Updated env:', updatedEnv.split('\n').length, 'lines')
  
  console.log('\n3️⃣  Add these to your .env file:\n')
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=' + jsonContent.client_email)
  console.log('GOOGLE_SERVICE_PRIVATE_KEY="' + jsonContent.private_key + '"')
  
  console.log('\n4️⃣  Share your Google Sheet with this email:')
  console.log('   📧', jsonContent.client_email)
  console.log('   (Give it Editor permissions)')
  
  console.log('\n5️⃣  Test the connection:')
  console.log('   npx tsx examples/debug-auth.ts')
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

function updateEnvFile(content: string, vars: Record<string, string>): string {
  let result = content
  
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm')
    const newLine = `${key}=${value.includes('\n') ? '"' + value + '"' : value}`
    
    if (regex.test(result)) {
      result = result.replace(regex, newLine)
    } else {
      result += (result.endsWith('\n') ? '' : '\n') + newLine + '\n'
    }
  }
  
  return result
}