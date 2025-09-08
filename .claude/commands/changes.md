---
allowed-tools: Bash(cat:*), Bash(ls:*), Bash(date:*), Bash(echo:*)
description: View current session statistics
---

# 📊 Current Session Statistics

## File Operations
!`if [ -d /tmp/claude-stats ]; then created=$(cat /tmp/claude-stats/files-created 2>/dev/null || echo '0'); modified=$(cat /tmp/claude-stats/files-modified 2>/dev/null || echo '0'); deleted=$(cat /tmp/claude-stats/files-deleted 2>/dev/null || echo '0'); added=$(cat /tmp/claude-stats/lines-added 2>/dev/null || echo '0'); removed=$(cat /tmp/claude-stats/lines-removed 2>/dev/null || echo '0'); echo "📁 Files: $((created + modified + deleted)) total ($created created, $modified modified, $deleted deleted)"; echo "📄 Lines: $((added + removed)) total ($added added, $removed removed)"; else echo "No session stats available yet"; fi`

## Tool Usage  
!`if [ -d /tmp/claude-stats ]; then bash_calls=$(cat /tmp/claude-stats/tool-bash 2>/dev/null || echo '0'); reads=$(cat /tmp/claude-stats/tool-read 2>/dev/null || echo '0'); writes=$(cat /tmp/claude-stats/tool-write 2>/dev/null || echo '0'); edits=$(cat /tmp/claude-stats/tool-edit 2>/dev/null || echo '0'); greps=$(cat /tmp/claude-stats/tool-grep 2>/dev/null || echo '0'); globs=$(cat /tmp/claude-stats/tool-glob 2>/dev/null || echo '0'); tasks=$(cat /tmp/claude-stats/tool-task 2>/dev/null || echo '0'); others=$(cat /tmp/claude-stats/tool-other 2>/dev/null || echo '0'); total_tools=$((bash_calls + reads + writes + edits + greps + globs + tasks + others)); echo "🔧 Tools: $total_tools total"; echo "   - Bash commands: $bash_calls"; echo "   - File reads: $reads"; echo "   - Write operations: $writes"; echo "   - Edit operations: $edits"; echo "   - Grep searches: $greps"; echo "   - Glob searches: $globs"; echo "   - Task agents: $tasks"; echo "   - Other tools: $others"; else echo "No tool stats available yet"; fi`

## Session Duration
!`if [ -f /tmp/claude-stats/session-start ]; then start_time=$(cat /tmp/claude-stats/session-start); current_time=$(date '+%s'); duration=$((current_time - start_time)); minutes=$((duration / 60)); seconds=$((duration % 60)); echo "⏱️  Session time: ${minutes}m ${seconds}s"; else echo "Session start time not available"; fi`