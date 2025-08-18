// interactive-prompt.ts
const createPrompt = (user: string, task: string, lang: string, context?: string) => `
You are a ${lang} expert.
User: ${user}
Task: ${task}
${context ? `Context: ${context}` : ''}

Please provide detailed guidance with:
- Step-by-step instructions
- Code examples
- Best practices
- Common pitfalls to avoid
`

// Examples
const prompts = [
    createPrompt("Alice", "debug API", "Node.js", "Express server with 500 errors"),
    createPrompt("Bob", "optimize React components", "TypeScript", "Performance issues in large lists"),
    createPrompt("Charlie", "implement authentication", "Effect-TS", "Steam bot system")
]

prompts.forEach((prompt, index) => {
    console.log(`\n=== Prompt ${index + 1} ===`)
    console.log(prompt)
})