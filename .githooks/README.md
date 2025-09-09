# Git Hooks

This directory contains custom git hooks for the project.

## Setup

To enable these hooks, run:

```bash
git config core.hooksPath .githooks
```

Or use the setup script:

```bash
./scripts/setup-hooks.sh
```

## Hooks

### commit-msg

Prevents commits with AI attribution in the commit message. This includes:
- References to Claude, GPT, or other AI tools
- "Generated with" or "Co-Authored-By" AI attributions  
- Robot emojis (🤖)
- AI service email addresses (e.g., noreply@anthropic.com)

## Testing

To test the commit-msg hook:

```bash
# This should fail
echo "feat: add feature 🤖 Generated with Claude Code" | .githooks/commit-msg /dev/stdin

# This should pass
echo "feat: add feature" | .githooks/commit-msg /dev/stdin
```