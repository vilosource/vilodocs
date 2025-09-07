# Build Scripts

This directory contains build and automation scripts for the vilodocs project.

## auto-fix-build.js

An intelligent Claude Code agent that automatically runs the GitHub build pipeline and attempts to fix any failures.

### Features

- 🤖 **Automated Build Execution**: Runs the GitHub build script automatically
- 🔍 **Error Analysis**: Intelligently analyzes build failures and categorizes errors
- 🔧 **Automatic Fixes**: Applies appropriate fixes based on error types
- 🔄 **Retry Logic**: Continues fixing and retrying until all issues are resolved or max attempts reached
- 📊 **Progress Tracking**: Shows detailed progress and fix attempts
- 📝 **Auto-Commit**: Automatically commits successful fixes
- 📋 **Summary Report**: Provides comprehensive summary of all fix attempts

### Supported Error Types & Auto-Fixes

| Error Type | Auto-Fix Action | Description |
|------------|----------------|-------------|
| **Lint Errors** | `npm run lint -- --fix` | Runs ESLint auto-fix for code style issues |
| **TypeScript Errors** | Type analysis & fixes | Attempts to resolve TypeScript compilation errors |
| **Test Failures** | Smart test fixes | Analyzes and fixes common test patterns (timeouts, selectors) |
| **Dependency Issues** | `npm install` | Installs missing dependencies |
| **Build Failures** | Build analysis | Analyzes compilation errors and suggests fixes |
| **E2E Test Issues** | Selector & timeout fixes | Updates Playwright test selectors and timeouts |

### Usage

**Option 1: Via npm script (recommended)**
```bash
npm run auto-fix-build
```

**Option 2: Direct execution**
```bash
node ./scripts/auto-fix-build.js
```

### Workflow

1. **🚀 Build Execution**
   - Runs the GitHub build script (`npm run github-build`)
   - Waits for complete build pipeline completion
   - Captures all output and error information

2. **🔍 Error Analysis**
   - Parses build output for error patterns
   - Categorizes errors by type (lint, test, TypeScript, etc.)
   - Extracts relevant error details and logs

3. **🔧 Fix Application**
   - Determines appropriate fixes for each error type
   - Applies fixes automatically where possible
   - Commits successful fixes to git

4. **🔄 Retry Cycle**
   - Re-runs build pipeline after applying fixes
   - Repeats up to 3 times or until all issues resolved
   - Provides detailed progress updates

5. **📊 Final Report**
   - Shows summary of all attempts and fixes
   - Lists successful and failed fix attempts
   - Provides guidance for manual intervention if needed

### Configuration

The agent can be configured by modifying the constructor parameters:

```javascript
class AutoBuildFixer {
    constructor() {
        this.maxRetries = 3;           // Maximum retry attempts
        this.buildScriptPath = './scripts/github-build.sh';  // Build script path
    }
}
```

### Example Output

```
🤖 Automated GitHub Build Fixer Starting...
======================================================

🚀 Build Attempt 1/4
==================================================
🔄 Running GitHub build script...
[GitHub build output...]
📊 Build script completed with exit code: 1

🔍 Build failed. Analyzing errors...
🔍 Analyzing error in workflow: Build
  📝 Error type: lint_error - ESLint error detected

🔧 Applying 1 fix(es)...
  🔨 Run ESLint auto-fix
    Output: ✓ 15 problems fixed automatically
  ✅ Fix applied: Run ESLint auto-fix
  📝 Committed fixes: Run ESLint auto-fix

🚀 Build Attempt 2/4
==================================================
[Build succeeds...]
🎉 BUILD SUCCESS! All GitHub Actions passed.
✅ No fixes needed. Build pipeline completed successfully.
```

### Integration with Development Workflow

Use this agent when you want to automatically resolve build failures:

```bash
# Make your changes
git add .
git commit -m "your changes"

# Let the agent handle the build pipeline and any failures
npm run auto-fix-build

# Agent will automatically:
# 1. Run the build
# 2. Fix any issues it can
# 3. Retry until success or max attempts
# 4. Commit any fixes applied
```

### Manual Intervention

The agent will clearly indicate when manual intervention is required:
- Unknown error types that can't be automatically fixed
- Complex test failures requiring human analysis
- Build failures that need architectural changes
- Maximum retry attempts exceeded

### Error Analysis Patterns

The agent uses regex patterns to identify error types:

- **Lint Errors**: `/npm.*test.*failed|test.*failed|expect.*received/`
- **TypeScript**: `/typescript.*error|ts.*error|cannot find module/`
- **Tests**: `/npm.*test.*failed|test.*failed|expect.*received/`
- **Dependencies**: `/package.*not.*found|module.*not.*found/`
- **E2E Tests**: `/playwright.*error|browser.*error/`

## github-build.sh

A comprehensive build pipeline script that handles the complete CI/CD workflow.

### Features

- ✅ **Pre-commit validation**: Checks for uncommitted changes and prevents accidental pushes
- 🚀 **Automated push**: Pushes committed changes to GitHub main branch
- 👀 **CI/CD monitoring**: Monitors GitHub Actions in real-time
- ⚠️ **Error reporting**: Reports failed workflows with details and logs
- 🎯 **Smart waiting**: Waits up to 30 minutes for all actions to complete
- 📊 **Status reporting**: Shows clear success/failure status with colored output

### Prerequisites

- `gh` (GitHub CLI) - [Install here](https://cli.github.com/)
- `jq` (JSON processor) - Usually available via package manager
- `git` - For repository operations
- Authenticated GitHub CLI: `gh auth login`

### Usage

**Option 1: Via npm script (recommended)**
```bash
npm run github-build
```

**Option 2: Direct execution**
```bash
./scripts/github-build.sh
```

### Workflow

1. **🔍 Validation Phase**
   - Checks if GitHub CLI is installed and authenticated
   - Verifies you're in a git repository
   - Ensures no uncommitted changes exist
   - Warns about untracked files (optional continue)

2. **🚀 Push Phase**
   - Shows commits that will be pushed
   - Pushes current branch to GitHub
   - Confirms successful push

3. **⏳ Monitoring Phase**
   - Waits for GitHub Actions to start (5 second delay)
   - Monitors all running workflows
   - Shows progress updates every minute
   - Times out after 30 minutes

4. **📊 Results Phase**
   - Shows results for all workflows on current commit
   - Reports success/failure status with colors
   - Provides direct links to failed workflow runs
   - Shows abbreviated logs for failed jobs

### Exit Codes

- `0`: Success - All workflows passed
- `1`: Failure - Some workflows failed or script errors
- `2`: Pending - Some workflows still running (timeout)
- `130`: Interrupted - User cancelled with Ctrl+C

### Sample Output

```
🚀 GitHub Build Pipeline
=================================

ℹ️  Checking prerequisites...
✅ Prerequisites check passed

ℹ️  Checking for uncommitted changes...
✅ No uncommitted changes found

ℹ️  Pushing to GitHub...
ℹ️  Current branch: main
ℹ️  Commits to be pushed:
  d26e5aa docs: add comprehensive debugging methodology
✅ Successfully pushed to GitHub

ℹ️  Waiting for GitHub Actions to start...
ℹ️  Monitoring GitHub Actions...
ℹ️  GitHub Actions still running (2 active):
  • CI: in_progress
  • Build: queued

✅ All GitHub Actions completed

ℹ️  Checking GitHub Actions results...
ℹ️  Results for current commit (d26e5aa):

✅ CI: Passed
✅ Build: Passed

🎉 All GitHub Actions passed! Build pipeline completed successfully.
```

### Error Handling

If workflows fail, the script will show:
- Which workflows failed
- Direct links to the failed runs
- Abbreviated logs from failed jobs
- Suggested next steps

### Integration with Development Workflow

This script is designed to be used after you've completed and committed your work:

```bash
# 1. Make your changes
git add .
git commit -m "your changes"

# 2. Run the build pipeline
npm run github-build

# 3. Script handles push + CI monitoring automatically
```

### Troubleshooting

**"GitHub CLI (gh) is not installed"**
- Install GitHub CLI from https://cli.github.com/

**"Not authenticated with GitHub CLI"**
- Run `gh auth login` and follow the prompts

**"You have uncommitted changes"**
- Commit or stash your changes before running the script

**"Timeout waiting for GitHub Actions"**
- Check GitHub Actions page manually
- Some workflows may take longer than 30 minutes

**"Some GitHub Actions failed"**
- Check the provided URLs for detailed failure logs
- Fix the issues and run the script again