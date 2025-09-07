# Build Scripts

This directory contains build and automation scripts for the vilodocs project.

## ci-trigger-and-monitor.sh

A script that handles the complete CI trigger and monitoring workflow.

### Features

- ✅ **Git Status Management**: Automatically commits any uncommitted changes
- 🚀 **CI Triggering**: Creates/updates `.ci-builds.txt` and pushes to trigger GitHub Actions
- ⏳ **Action Monitoring**: Polls GitHub Actions until completion (30 min timeout)
- 📊 **Results Gathering**: Outputs structured results for AI parsing
- 🔗 **Error Details**: Includes raw error logs for failed workflows

### Usage

**Via npm script (recommended):**
```bash
npm run ci-build
```

**Direct execution:**
```bash
./scripts/ci-trigger-and-monitor.sh
```

**Via Claude Code agent:**
```
@github-build-analyzer
```

### Output Format

The script outputs structured data for AI parsing:
- Workflow results between `=== WORKFLOW_RESULTS_START ===` markers
- Failed workflow details between `=== FAILED_WORKFLOW_DETAILS_START ===` markers

### Prerequisites

- `gh` (GitHub CLI) installed and authenticated
- `jq` (JSON processor)
- Git repository with GitHub Actions configured

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