import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'

export default [
    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '**/*.d.ts',
            '**/*.js.map',
            '.yarn/**',
            'test-results/**',
            'coverage/**',
            'playwright-report/**'
        ]
    },
    
    // Base JavaScript config
    js.configs.recommended,
    
    // TypeScript files
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier
        },
        rules: {
            // Prefer arrow functions
            'prefer-arrow-callback': 'error',
            'func-style': ['error', 'expression', { 'allowArrowFunctions': true }],
            
            // Basic TypeScript preferences (using base rule names)
            'no-explicit-any': 'off', // Let TypeScript handle this
            'no-unused-vars': 'off', // Let TypeScript handle this
            
            // Prettier will handle formatting (semicolons, quotes, indentation)
            'prettier/prettier': 'error'
        }
    },
    
    // JavaScript files (less strict)
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module'
        },
        plugins: {
            prettier
        },
        rules: {
            // Basic rules for JavaScript
            'prefer-arrow-callback': 'error',
            'func-style': ['error', 'expression', { 'allowArrowFunctions': true }],
            
            // Prettier will handle formatting (semicolons, quotes, indentation)
            'prettier/prettier': 'error'
        }
    }
]