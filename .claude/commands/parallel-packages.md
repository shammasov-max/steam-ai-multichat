---
description: Run a task across all packages in parallel using auto-discovery  
---

I'll run the task "{{prompt}}" across all packages in your monorepo in parallel.

First, let me discover all packages and then launch parallel agents:

Use the Glob tool to find all packages/*/package.json files.

Based on the discovered packages, I'll launch general-purpose agents in parallel, one for each package:

For each discovered package, use the Task tool with:
- subagent_type: "general-purpose"
- description: "Process [package-name]"
- prompt: "Working in packages/[package-name]: {{prompt}}"

All agents will be launched in a single message to ensure they run in parallel.

The agents will:
1. Navigate to their assigned package directory
2. Execute the requested task: {{prompt}}
3. Report results back for their specific package

This ensures efficient parallel processing across your entire monorepo.