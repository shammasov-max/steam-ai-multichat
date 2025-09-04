#!/bin/bash

# Get git branch
branch=$(git branch --show-current 2>/dev/null || echo "no-git")

# Get git file counts
git_status=$(git status --porcelain 2>/dev/null)
added_files=$(echo "$git_status" | grep -c "^A" || echo "0")
modified_files=$(echo "$git_status" | grep -c "^M" || echo "0")
deleted_files=$(echo "$git_status" | grep -c "^D" || echo "0")
untracked_files=$(echo "$git_status" | grep -c "^??" || echo "0")

total_added=$((added_files + untracked_files))
total_changed=$((modified_files + deleted_files))

# Get diff line counts (staged + unstaged)
diff_output=$(git diff --numstat HEAD 2>/dev/null)
if [ -n "$diff_output" ]; then
    lines_added=$(echo "$diff_output" | awk '{sum+=$1} END {print sum+0}')
    lines_removed=$(echo "$diff_output" | awk '{sum+=$2} END {print sum+0}')
else
    lines_added=0
    lines_removed=0
fi

# Get context info from stdin (session data)
input=$(cat)
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // "."' 2>/dev/null || echo ".")

# Simple context estimation based on file count and sizes
if [ -d "$current_dir" ]; then
    file_count=$(find "$current_dir" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" 2>/dev/null | wc -l)
    ctx_est=$(echo "scale=1; $file_count * 0.3" | bc 2>/dev/null || echo "0.0")
    ctx_display="${ctx_est}K"
else
    ctx_display="0K"
fi

# Format output
if [ "$total_added" -gt 0 ] || [ "$total_changed" -gt 0 ]; then
    files_info="+${total_added}/-${total_changed} files"
else
    files_info="clean"
fi

if [ "$lines_added" -gt 0 ] || [ "$lines_removed" -gt 0 ]; then
    lines_info="+${lines_added}/-${lines_removed} lines"
else
    lines_info="no diff"
fi

echo "$branch | $files_info | $lines_info | ctx$ctx_display"