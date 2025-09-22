import { config } from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import { beforeAll, expect } from 'vitest'

const execAsync = promisify(exec)

// Load environment variables from root .env file
config({ path: '.env' })

// Check if MongoDB is accessible
async function waitForMongoDB(retries = 30, delay = 1000): Promise<void> {
  const { MongoClient } = await import('mongodb')
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017'
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(mongoUrl)
      await client.connect()
      await client.close()
      console.log('✅ MongoDB is ready')
      return
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(`MongoDB not available after ${retries} attempts`)
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Ensure Docker Compose is running
async function ensureDockerServices(): Promise<void> {
  try {
    // Check if MongoDB container is running
    const { stdout } = await execAsync('docker-compose ps --services --filter status=running')
    const runningServices = stdout.trim().split('\n').filter(Boolean)
    
    if (!runningServices.includes('mongodb')) {
      console.log('🐳 Starting MongoDB service...')
      await execAsync('docker-compose up -d mongodb')
      await waitForMongoDB()
    }
  } catch (error) {
    console.warn('⚠️  Docker Compose check failed, assuming MongoDB is running locally')
  }
}

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Only ensure MongoDB for packages that need it
  const testPath = expect.getState().testPath
  if (testPath && (
    testPath.includes('packages/db') ||
    testPath.includes('packages/dialogs') ||
    testPath.includes('packages/server')
  )) {
    await ensureDockerServices()
  }
})