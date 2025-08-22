#!/bin/bash

# Git Bash PS1-style Claude Code Status Line
# Replicates: Green user@host | Purple MSYSTEM | Yellow workdir | Cyan git | Newline prompt
# Based on: \[\033[32m\]\u@\h \[\033[35m\]$MSYSTEM \[\033[33m\]\w\[\033[36m\]`__git_ps1`\[\033[0m\]\n$

input=$(cat)

# Extract JSON data
model_name=$(echo "$input" | jq -r '.model.display_name // "Unknown Model"')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // pwd')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // pwd')

# Convert Windows paths for bash operations
if [[ "$current_dir" =~ ^[A-Z]: ]]; then
    # Convert Windows path to Unix-style for cd operations
    unix_current=$(echo "$current_dir" | sed 's|\\|/|g' | sed 's|^\([A-Z]\):|/\L\1|')
    unix_project=$(echo "$project_dir" | sed 's|\\|/|g' | sed 's|^\([A-Z]\):|/\L\1|')
else
    unix_current="$current_dir"
    unix_project="$project_dir"
fi

# Get user and hostname info
username=$(whoami)
hostname_short=$(hostname -s 2>/dev/null || hostname 2>/dev/null || echo "localhost")

# System info (equivalent to MSYSTEM in Git Bash)
system_info="CLAUDE"
if [[ "$OSTYPE" == "msys" ]] || [[ "$MSYSTEM" ]]; then
    system_info="$MSYSTEM"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    system_info="LINUX"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    system_info="MACOS"
fi

# Working directory (use ~ for home directory like PS1 \w)
work_dir="$current_dir"
if [[ "$current_dir" == "$HOME"* ]]; then
    work_dir="~${current_dir#$HOME}"
fi

# Git information (equivalent to __git_ps1)
cd "$current_dir" 2>/dev/null || cd "$unix_current" 2>/dev/null || cd "$project_dir" 2>/dev/null || cd "$unix_project" 2>/dev/null || true
git_info=""
if git rev-parse --git-dir >/dev/null 2>&1; then
    git_branch=$(git branch --show-current 2>/dev/null || echo "HEAD")
    git_status=""
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        git_status="*"
    elif [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        git_status="+"
    fi
    
    git_info=" ($git_branch$git_status)"
fi

# Multi-line format matching Git Bash PS1
# Line 1: Green user@host | Purple system | Yellow workdir | Cyan git
printf "\033[32m%s@%s\033[0m " "$username" "$hostname_short"
printf "\033[35m%s\033[0m " "$system_info"
printf "\033[33m%s\033[0m" "$work_dir"
if [ -n "$git_info" ]; then
    printf "\033[36m%s\033[0m" "$git_info"
fi

# Line 2: Model info and prompt
printf "\n\033[90m[%s]\033[0m " "$model_name"