#!/bin/bash
# MCP Filesystem Server WSL Wrapper
# This script works around the path conversion issue in WSL

# Get the target directory (default to current directory)
TARGET_DIR="${1:-.}"

# Convert to absolute path if relative
if [[ ! "$TARGET_DIR" = /* ]]; then
    TARGET_DIR="$(pwd)/$TARGET_DIR"
fi

# Create a temporary directory that doesn't trigger WSL path conversion
TEMP_DIR="/tmp/mcp-fs-$$"
mkdir -p "$TEMP_DIR"

# Create a bind mount or symlink
ln -sfn "$TARGET_DIR" "$TEMP_DIR/workspace"

# Run the MCP server with the symlinked path
cd "$TEMP_DIR" && exec npx @modelcontextprotocol/server-filesystem workspace
