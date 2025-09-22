import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer

export async function setupTestDatabase(): Promise<string> {
    mongoServer = await MongoMemoryServer.create({
        instance: {
            dbName: 'test_db'
        }
    })
    
    return mongoServer.getUri()
}

export async function teardownTestDatabase(): Promise<void> {
    if (mongoServer) {
        await mongoServer.stop()
    }
}

// Helper to create a unique test database name
export function getTestDbName(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}