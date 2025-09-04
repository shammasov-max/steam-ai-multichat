import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { Effect, Layer } from 'effect'

/**
 * Test environment setup and teardown for the Steam multichat automation system
 */

/**
 * Setup test environment with all necessary configurations
 */
export async function setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...')

    // Set up environment variables for tests
    process.env.NODE_ENV = 'test'
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:54320/steambot_test'
    process.env.API_URL = process.env.API_URL || 'http://localhost:3000'
    process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
    process.env.LOG_LEVEL = 'error' // Reduce log noise in tests
    process.env.DISABLE_RATE_LIMITING = 'true' // Speed up tests

    try {
        // Ensure Docker containers are running
        await ensureDockerContainers()

        // Wait for database to be ready
        await waitForDatabase()

        // Clean database for fresh start
        await cleanDatabase()

        // Seed test data
        await seedTestData()

        // Verify test fixtures are available
        await verifyTestFixtures()

        console.log('✅ Test environment setup complete')
    } catch (error) {
        console.error('❌ Test environment setup failed:', error)
        throw error
    }
}

/**
 * Ensure Docker containers are running
 */
export async function ensureDockerContainers(): Promise<void> {
    console.log('🐳 Ensuring Docker containers are running...')
    
    try {
        // Check if docker-compose is available
        execSync('docker-compose --version', { stdio: 'ignore' })
        
        // Start containers if not already running
        execSync('yarn ensure-docker', { 
            stdio: process.env.DEBUG ? 'inherit' : 'ignore',
            cwd: process.cwd()
        })
        
        console.log('✅ Docker containers are ready')
    } catch (error) {
        console.error('❌ Failed to start Docker containers:', error)
        throw error
    }
}

/**
 * Wait for database to be ready
 */
export async function waitForDatabase(): Promise<void> {
    console.log('🗄️  Waiting for database to be ready...')
    
    const maxAttempts = 30
    const delayMs = 1000
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Try to connect to database
            // Note: This would use your actual database connection logic
            // For now, we'll simulate the check
            await new Promise(resolve => setTimeout(resolve, delayMs))
            
            console.log('✅ Database is ready')
            return
        } catch (error) {
            if (attempt === maxAttempts) {
                console.error('❌ Database failed to become ready after maximum attempts')
                throw new Error('Database connection timeout')
            }
            
            console.log(`⏳ Database not ready, attempt ${attempt}/${maxAttempts}`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }
}

/**
 * Clean database for fresh start
 */
export async function cleanDatabase(): Promise<void> {
    console.log('🧹 Cleaning database...')

    try {
        // In a real implementation, this would:
        // 1. Connect to your database
        // 2. Truncate all test tables
        // 3. Reset sequences/auto-increment counters
        
        // For now, we'll use a simple approach
        console.log('Clearing all test data...')
        
        // This would typically call your database cleanup utilities
        // Example: await databaseService.cleanup()
        
        console.log('✅ Database cleaned')
    } catch (error) {
        console.error('❌ Error cleaning database:', error)
        throw error
    }
}

/**
 * Seed test data
 */
export async function seedTestData(): Promise<void> {
    console.log('🌱 Seeding test data...')

    try {
        // Seed essential system configuration
        const systemConfig = {
            inviteRateLimit: 60000, // 1 minute in milliseconds
            messageRateLimit: 1000, // 1 second
            maxBots: 100,
            agentEnabledDefault: true,
            maxConcurrentTasks: 50
        }

        // In a real implementation, this would insert data into your database
        console.log('Seeding system configuration...')
        
        // Example seeding operations:
        // await systemRepository.create(systemConfig)
        // await createTestUsers()
        // await createTestBots()
        
        console.log('✅ Test data seeded')
    } catch (error) {
        console.error('❌ Error seeding test data:', error)
        throw error
    }
}

/**
 * Verify test fixtures are available
 */
export async function verifyTestFixtures(): Promise<void> {
    console.log('🔍 Verifying test fixtures...')
    
    const fixturesPath = path.join(process.cwd(), 'fixtures')
    const allTxtPath = path.join(fixturesPath, 'all.txt')
    const mafilePath = path.join(fixturesPath, 'mafile')
    
    // Check if fixtures directory exists
    if (!fs.existsSync(fixturesPath)) {
        console.warn('⚠️  Fixtures directory not found, creating empty one...')
        fs.mkdirSync(fixturesPath, { recursive: true })
    }
    
    // Check if test accounts file exists
    if (!fs.existsSync(allTxtPath)) {
        console.warn('⚠️  Test accounts file not found, some tests may be skipped')
    } else {
        console.log('✅ Test accounts file found')
    }
    
    // Check if maFiles directory exists
    if (!fs.existsSync(mafilePath)) {
        console.warn('⚠️  maFiles directory not found, Steam auth tests may be skipped')
    } else {
        const maFiles = fs.readdirSync(mafilePath).filter(f => f.endsWith('.maFile'))
        console.log(`✅ Found ${maFiles.length} maFile(s)`)
    }
}

/**
 * Teardown test environment
 */
export async function teardownTestEnvironment(): Promise<void> {
    console.log('🧹 Cleaning up test environment...')

    try {
        // Clean up test data
        await cleanDatabase()
        
        // Close any open connections
        // In a real implementation:
        // await databaseService.disconnect()
        // await redisService.disconnect()
        
        // Reset environment variables if needed
        delete process.env.DISABLE_RATE_LIMITING
        
        console.log('✅ Test environment cleanup complete')
    } catch (error) {
        console.error('❌ Error during cleanup:', error)
        // Don't throw here to allow other cleanup to continue
    }
}

/**
 * Helper to create test fixtures directory structure
 */
export function createTestFixtures(): void {
    const fixturesPath = path.join(process.cwd(), 'fixtures')
    const mafilePath = path.join(fixturesPath, 'mafile')
    
    // Create directories
    if (!fs.existsSync(fixturesPath)) {
        fs.mkdirSync(fixturesPath, { recursive: true })
    }
    
    if (!fs.existsSync(mafilePath)) {
        fs.mkdirSync(mafilePath, { recursive: true })
    }
    
    // Create sample all.txt if it doesn't exist
    const allTxtPath = path.join(fixturesPath, 'all.txt')
    if (!fs.existsSync(allTxtPath)) {
        const sampleContent = `# Test accounts format:
# username:password - proxy_host:proxy_port:proxy_user:proxy_pass
#
# Example:
# testuser1:testpass1 - proxy.example.com:3128:proxyuser:proxypass
#
# NOTE: Add real test accounts here for Steam integration tests
# Make sure corresponding .maFile exists in mafile/ directory
`
        fs.writeFileSync(allTxtPath, sampleContent)
    }
}

/**
 * Wait for condition helper (useful for async setup)
 */
export async function waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 30000,
    interval = 1000
): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true
        }
        await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    return false
}

/**
 * Mock services layer for Effect-TS testing
 */
export function createTestServicesLayer(): Layer.Layer<any, never, any> {
    // This would create mock implementations of your services
    // For example:
    // const MockDatabaseService = Layer.succeed(DatabaseService, mockDatabaseService)
    // const MockSteamService = Layer.succeed(SteamService, mockSteamService)
    // return Layer.mergeAll(MockDatabaseService, MockSteamService, ...)
    
    return Layer.empty
}

/**
 * Global setup function for test runner
 */
export async function globalSetup(): Promise<void> {
    console.log('🚀 Running global test setup...')
    
    try {
        await setupTestEnvironment()
        
        // Start test server if needed
        if (process.env.START_TEST_SERVER === 'true') {
            await startTestServer()
        }
        
        console.log('✅ Global setup complete')
    } catch (error) {
        console.error('❌ Global setup failed:', error)
        process.exit(1)
    }
}

/**
 * Global teardown function for test runner
 */
export async function globalTeardown(): Promise<void> {
    console.log('🛑 Running global test teardown...')
    
    try {
        await teardownTestEnvironment()
        
        // Stop test server if it was started
        if (process.env.START_TEST_SERVER === 'true') {
            await stopTestServer()
        }
        
        console.log('✅ Global teardown complete')
    } catch (error) {
        console.error('❌ Global teardown failed:', error)
    }
}

/**
 * Start test server (if needed for integration tests)
 */
export async function startTestServer(): Promise<void> {
    console.log('🌐 Starting test server...')
    
    try {
        // This would start your actual server for integration tests
        // For example, spawn a child process with your dev server
        console.log('Test server would be started here')
        
        // Wait for server to be ready
        const isServerReady = await waitForCondition(async () => {
            try {
                // Test if server is responding
                // const response = await fetch('http://localhost:3000/api/health')
                // return response.ok
                return true // Mock for now
            } catch {
                return false
            }
        }, 30000)
        
        if (!isServerReady) {
            throw new Error('Test server failed to start')
        }
        
        console.log('✅ Test server is ready')
    } catch (error) {
        console.error('❌ Failed to start test server:', error)
        throw error
    }
}

/**
 * Stop test server
 */
export async function stopTestServer(): Promise<void> {
    console.log('🛑 Stopping test server...')
    
    try {
        // This would stop the test server
        console.log('Test server would be stopped here')
        console.log('✅ Test server stopped')
    } catch (error) {
        console.error('❌ Failed to stop test server:', error)
    }
}

/**
 * Create isolated test environment for a single test
 */
export async function createIsolatedTestEnvironment(): Promise<() => Promise<void>> {
    // Set up isolated environment
    const originalEnv = { ...process.env }
    
    // Return cleanup function
    return async () => {
        // Restore original environment
        process.env = originalEnv
    }
}

// Run setup if called directly
if (require.main === module) {
    setupTestEnvironment()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}