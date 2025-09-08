import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    
    include: [
      'packages/*/tests/**/*.{test,spec}.ts',
      'packages/*/src/**/*.{test,spec}.ts'
    ],
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      '**/type-*.ts',
      '**/fixtures/**'
    ],
    
    // Sequential for DB tests, parallel for others
    sequence: {
      hooks: 'list'
    },
    
    setupFiles: ['./vitest.setup.ts'],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.{test,spec}.ts',
        '**/tests/',
        '*.config.ts',
        'vitest.setup.ts'
      ]
    }
  },
  
  resolve: {
    alias: {
      '@packages/isomorphic': resolve(__dirname, 'packages/isomorphic/src'),
      '@packages/db': resolve(__dirname, 'packages/db/src'),
      '@packages/dialogs': resolve(__dirname, 'packages/dialogs/src'),
      '@packages/steam-api': resolve(__dirname, 'packages/steam-api/src'),
      '@packages/server': resolve(__dirname, 'packages/server/src')
    }
  }
})