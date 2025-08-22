import { test } from '@playwright/test'

test('Test Steam package imports', async () => {
    console.log('Testing Steam package imports...')
  
    try {
        console.log('Attempting to import steam-totp...')
        await import('steam-totp')
        console.log('✓ steam-totp imported successfully')
    
        console.log('Attempting to import steamcommunity...')
        await import('steamcommunity')
        console.log('✓ steamcommunity imported successfully')
    
        console.log('Attempting to import steam-user...')
        await import('steam-user')
        console.log('✓ steam-user imported successfully')
    
        console.log('All Steam packages imported successfully!')
    
    } catch (error) {
        console.error('Import error:', error)
        throw error
    }
})