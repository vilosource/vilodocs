# Git Hooks

This project uses Git hooks to maintain code quality and prevent common issues.

## Active Hooks

### pre-push
**Purpose**: Prevents pushing code that doesn't pass linting

The pre-push hook runs `npm run lint` before allowing any push to remote repositories. This ensures that:
- No code with linting errors reaches the repository
- Code style remains consistent across the codebase
- TypeScript errors are caught before CI/CD

**If the push is rejected:**
1. Fix the linting errors shown in the output
2. For auto-fixable issues, run: `npm run lint -- --fix`
3. Commit the fixes
4. Try pushing again

### commit-msg
**Purpose**: Prevents AI attributions in commit messages

This hook rejects commits that contain:
- AI-related keywords (Claude, ChatGPT, OpenAI, etc.)
- Co-Authored-By lines
- AI-generated indicators

## Setup

The hooks are located in `.git/hooks/` and are automatically active once the repository is cloned.

## Bypassing Hooks (Emergency Only)

If you absolutely need to bypass the hooks in an emergency:
- For pre-push: `git push --no-verify`
- For commit-msg: `git commit --no-verify`

⚠️ **Use with caution** - bypassing hooks defeats their purpose and may introduce issues into the codebase.

## Adding New Hooks

To add a new Git hook:
1. Create the hook script in `.git/hooks/`
2. Make it executable: `chmod +x .git/hooks/hook-name`
3. Document it in this file

Note: Git hooks in `.git/hooks/` are not version controlled. For team-wide hooks, consider using a tool like Husky or creating a setup script.