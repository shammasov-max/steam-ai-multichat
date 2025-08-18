// prompt-example.ts
const userName = "John"
const taskType = "code review"
const codeLanguage = "TypeScript"

const prompt = `
You are a senior ${codeLanguage} developer.
Help ${userName} with their ${taskType}.

Rules:
- Be concise and direct
- Focus on best practices
- Provide specific examples
`

console.log(prompt)