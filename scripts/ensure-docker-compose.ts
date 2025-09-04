#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function isDockerComposeUp(): Promise<boolean> {
    try {
        const { stdout } = await execAsync('docker-compose ps --services --filter status=running')
        const runningServices = stdout.trim().split('\n').filter(Boolean)
        return runningServices.length > 0
    } catch (error) {
        return false
    }
}

async function startDockerCompose(): Promise<void> {
    console.log('🐳 Starting Docker Compose services...')
    try {
        await execAsync('docker-compose up -d')
        console.log('✅ Docker Compose services started successfully')
    } catch (error) {
        console.error('❌ Failed to start Docker Compose:', error)
        process.exit(1)
    }
}

async function ensureDockerCompose(): Promise<void> {
    console.log('🔍 Checking Docker Compose status...')
    
    const isUp = await isDockerComposeUp()
    
    if (isUp) {
        console.log('✅ Docker Compose services are already running')
        return
    }
    
    await startDockerCompose()
}

if (import.meta.url === `file://${process.argv[1]}`) {
    ensureDockerCompose().catch((error) => {
        console.error('❌ Error ensuring Docker Compose:', error)
        process.exit(1)
    })
}

export { ensureDockerCompose }