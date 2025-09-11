---
allowed-tools: "*"
description: "Analyze input and ask targeted questions to enhance the prompt"
argument-hint: "your task or question"
---

**Original request:** $ARGUMENTS

---

Please analyze the above request and:

1. **Identify the core task type** (e.g., bug fix, new feature, refactoring, analysis, etc.)

2. **Ask 3-5 specific clarifying questions** based on what's being requested:
   - If it's about implementation: Ask about patterns, error handling, testing needs
   - If it's about debugging: Ask about symptoms, error messages, expected behavior
   - If it's about refactoring: Ask about goals, constraints, performance requirements
   - If it's about analysis: Ask about scope, depth, specific concerns

3. **Consider context-specific details**:
   - Which packages/slices are involved?
   - Should this follow Effect-TS patterns?
   - Are there existing patterns in the codebase to follow?

4. **Determine missing information** that would help provide a better solution:
   - Technical constraints
   - Success criteria
   - Edge cases to consider

5. **Reformulate an enhanced prompt** that incorporates:
   - The original request
   - Anticipated clarifications
   - Relevant codebase context
   - Best practices for this type of task

After analyzing, provide the enhanced prompt that includes all necessary context and specifications for a comprehensive solution.