module.exports = {
    // 4-space indentation
    tabWidth: 4,
    useTabs: false,
    
    // No semicolons
    semi: false,
    
    // Single quotes
    singleQuote: true,
    
    // Other formatting rules
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'avoid',
    printWidth: 100,
    endOfLine: 'lf',
    
    // Override for specific file types
    overrides: [
        {
            files: '*.ts',
            options: {
                singleQuote: true,
                semi: false,
                tabWidth: 4
            }
        },
        {
            files: '*.tsx',
            options: {
                singleQuote: true,
                semi: false,
                tabWidth: 4
            }
        },
        {
            files: ['*.json', '*.md'],
            options: {
                tabWidth: 2
            }
        }
    ]
}