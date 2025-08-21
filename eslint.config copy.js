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
                sourceType: 'module',
                project: './tsconfig.json'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier
        },
        rules: {
            // Enforce no semicolons
            'semi': ['error', 'never'],
            '@typescript-eslint/semi': ['error', 'never'],
            
            // Enforce single quotes
            'quotes': ['error', 'single'],
            '@typescript-eslint/quotes': ['error', 'single'],
            
            // Prefer arrow functions
            'prefer-arrow-callback': 'error',
            'func-style': ['error', 'expression', { 'allowArrowFunctions': true }],
            
            // Indentation (4 spaces)
            'indent': ['error', 4],
            '@typescript-eslint/indent': ['error', 4],
            
            // TypeScript strict mode preferences
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/prefer-const': 'error',
            '@typescript-eslint/no-inferrable-types': 'off',
            
            // Prettier integration
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
            'semi': ['error', 'never'],
            'quotes': ['error', 'single'],
            'prefer-arrow-callback': 'error',
            'func-style': ['error', 'expression', { 'allowArrowFunctions': true }],
            'indent': ['error', 4],
            'prettier/prettier': 'error'
        }
    }
]