#!/bin/bash

# Setup script for git hooks

echo "Setting up git hooks..."

# Configure git to use the .githooks directory
git config core.hooksPath .githooks

if [ $? -eq 0 ]; then
    echo "✅ Git hooks configured successfully"
    echo "   Hooks directory: .githooks"
    echo ""
    echo "Active hooks:"
    for hook in .githooks/*; do
        if [ -f "$hook" ] && [ -x "$hook" ] && [ "$(basename "$hook")" != "README.md" ]; then
            echo "   - $(basename "$hook")"
        fi
    done
else
    echo "❌ Failed to configure git hooks"
    exit 1
fi