import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        // Test environment configuration
        globals: true,
        environment: 'node',

        // Setup files
        setupFiles: ['./src/test-setup.ts'],

        // Test patterns
        include: [
            'src/**/*.{test,spec}.{js,ts}',
            'src/tests/**/*.{test,spec}.{js,ts}',
            'src/examples/**/*.{test,spec}.{js,ts}'
        ],
        exclude: [
            'node_modules/**',
            'dist/**',
            '.next/**',
            'coverage/**',
            'playwright-report/**',
            'test-results/**'
        ],

        // Timeouts for async operations
        testTimeout: 10000,
        hookTimeout: 5000,

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'coverage/**',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                'src/test-setup.ts',
                'src/tests/**',
                'src/examples/**'
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                }
            }
        },

        // Concurrent execution
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                minThreads: 1,
                maxThreads: 4
            }
        },

        // Test retry configuration
        retry: 1,

        // Reporter configuration
        reporter: process.env.CI ? ['verbose', 'json'] : ['verbose'],

        // Browser test configuration
        browser: {
            enabled: false, // Disable by default, enable with --browser flag
            name: 'chromium',
            provider: 'playwright',
            headless: true,
        }
    },

    // Module resolution
    resolve: {
        alias: {
            '@packages/isomorphic': path.resolve(__dirname, '../isomorphic/src'),
            '@packages/db': path.resolve(__dirname, '../db/src'),
            '@packages/dialogs': path.resolve(__dirname, '../dialogs/src'),
            '@packages/steam-api': path.resolve(__dirname, '../steam-api/src'),
            '@': path.resolve(__dirname, './src')
        }
    },

    // Define global types for tests
    define: {
        __TEST__: true
    },

    // Node.js optimization
    optimizeDeps: {
        include: [
            'effect',
            '@effect/schema',
            '@reduxjs/toolkit',
            'typeid-js'
        ]
    },

    // ESM configuration
    esbuild: {
        target: 'node18',
        format: 'esm'
    }
})