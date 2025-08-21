import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '.next/**',
            '**/*.d.ts',
            '**/*.js.map',
            '.yarn/**',
            'test-results/**',
            'coverage/**',
            'playwright-report/**',
            'cjs-to-esm-*.js',
            'prettier.config.cjs'
        ]
    },
    
    // Base configs
    js.configs.recommended,
    ...tseslint.configs.recommended,
    
    // Custom rules
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            // Enforce no semicolons
            'semi': ['error', 'never'],
            
            // Enforce single quotes
            'quotes': ['error', 'single'],
            
            // Prefer arrow functions
            'prefer-arrow-callback': 'error',
            
            // Indentation (4 spaces)
            'indent': ['error', 4],
            
            // TypeScript specific (only apply to TS files)
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'error'
        }
    }
]