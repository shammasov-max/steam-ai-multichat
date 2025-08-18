#!/bin/bash

# PowerShell-Optimized Claude Code Status Line
# Displays: Model | Directory/Project | Git Branch/Status | Tokens | Time | Tech Stack

input=$(cat)

# Extract JSON data
model_name=$(echo "$input" | jq -r '.model.display_name // "Unknown Model"')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // pwd')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // pwd')
version=$(echo "$input" | jq -r '.version // "Unknown"')

# Convert Windows paths for bash operations
if [[ "$current_dir" =~ ^[A-Z]: ]]; then
    # Convert Windows path to Unix-style for cd operations
    unix_current=$(echo "$current_dir" | sed 's|\\|/|g' | sed 's|^\([A-Z]\):|/\L\1|')
    unix_project=$(echo "$project_dir" | sed 's|\\|/|g' | sed 's|^\([A-Z]\):|/\L\1|')
else
    unix_current="$current_dir"
    unix_project="$project_dir"
fi

# Directory context
current_dir_name=$(basename "$current_dir")
project_name=$(basename "$project_dir")

# Git information (try both Windows and Unix paths)
cd "$current_dir" 2>/dev/null || cd "$unix_current" 2>/dev/null || cd "$project_dir" 2>/dev/null || cd "$unix_project" 2>/dev/null || true
git_branch=$(git branch --show-current 2>/dev/null || echo "no-git")
git_status=""
if git rev-parse --git-dir >/dev/null 2>&1; then
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        git_status="*"
    elif [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        git_status="+"
    fi
fi

# Token information from get-tokens.sh
token_info=""
if [ -f "./get-tokens.sh" ] && [ -x "./get-tokens.sh" ]; then
    token_info=$(./get-tokens.sh 2>/dev/null || echo "T:? R:?")
elif [ -f "get-tokens.sh" ] && [ -x "get-tokens.sh" ]; then
    token_info=$(./get-tokens.sh 2>/dev/null || echo "T:? R:?")
else
    token_info="T:? R:?"
fi

# System info
timestamp=$(date +"%H:%M:%S")

# Tech stack detection
node_version=""
if command -v node >/dev/null 2>&1; then
    node_version=" | Node $(node --version 2>/dev/null | sed 's/^v//')"
fi

package_manager=""
if [ -f "$project_dir/yarn.lock" ] || [ -f "./yarn.lock" ]; then
    package_manager=" | Yarn"
elif [ -f "$project_dir/package-lock.json" ] || [ -f "./package-lock.json" ]; then
    package_manager=" | npm"
elif [ -f "$project_dir/pnpm-lock.yaml" ] || [ -f "./pnpm-lock.yaml" ]; then
    package_manager=" | pnpm"
fi

# Build compact colorized status line for PowerShell
printf "\033[1;36m%s\033[0m" "$model_name"
printf " | \033[1;33m%s\033[0m/\033[1;35m%s\033[0m" "$current_dir_name" "$project_name"
if [ "$git_branch" != "no-git" ]; then
    printf " | \033[1;31m%s\033[0m%s" "$git_branch" "$git_status"
fi
printf " | \033[1;32m%s\033[0m" "$token_info"
printf " | \033[1;90m%s\033[0m" "$timestamp"
printf "%s%s\n" "$node_version" "$package_manager"