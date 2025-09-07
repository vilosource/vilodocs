#!/bin/bash

# CI Trigger and Monitor Script
# Handles git operations, triggers CI builds, and monitors results

set -e  # Exit on any error

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed. Please install it first:"
        print_info "https://cli.github.com/"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check if we're authenticated with GitHub CLI
    if ! gh auth status &> /dev/null; then
        print_error "Not authenticated with GitHub CLI. Run: gh auth login"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

handle_git_status() {
    print_info "Checking git status..."
    
    # Check for unstaged changes
    if [ -n "$(git diff --name-only)" ]; then
        print_warning "Found unstaged changes - adding and committing"
        git add -A
        git commit -m "ci: trigger build analysis"
        print_success "Committed unstaged changes"
    fi
    
    # Check for staged but uncommitted changes
    if [ -n "$(git diff --staged --name-only)" ]; then
        print_warning "Found staged changes - committing"
        git commit -m "ci: trigger build analysis"
        print_success "Committed staged changes"
    fi
    
    print_success "Git status handled"
}

trigger_ci_build() {
    print_info "Triggering CI build..."
    
    # Create or update .ci-builds.txt with timestamp
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "Build triggered at: $timestamp" > .ci-builds.txt
    
    # Commit and push to trigger CI
    git add .ci-builds.txt
    git commit -m "ci: trigger build analysis - $timestamp"
    
    # Get current branch and push
    local current_branch=$(git branch --show-current)
    git push origin $current_branch
    
    print_success "CI build triggered with timestamp: $timestamp"
}

wait_for_actions() {
    print_info "Waiting for GitHub Actions to start..."
    
    # Wait a moment for actions to trigger
    sleep 5
    
    print_info "Monitoring GitHub Actions..."
    
    local max_wait=1800  # 30 minutes max wait
    local wait_time=0
    local check_interval=30  # Check every 30 seconds
    
    while [ $wait_time -lt $max_wait ]; do
        # Get list of recent workflow runs
        local runs=$(gh run list --limit 5 --json status,conclusion,workflowName,createdAt,url)
        
        # Check if we have any running workflows
        local running_count=$(echo "$runs" | jq '[.[] | select(.status == "in_progress" or .status == "queued")] | length')
        
        if [ "$running_count" -eq 0 ]; then
            print_success "All GitHub Actions completed"
            return 0
        fi
        
        # Show status of running workflows (less verbose)
        if [ $((wait_time % 60)) -eq 0 ]; then
            local minutes=$((wait_time / 60))
            print_info "Still running ($running_count active) - ${minutes} minutes elapsed"
        fi
        
        sleep $check_interval
        wait_time=$((wait_time + check_interval))
    done
    
    print_error "Timeout waiting for GitHub Actions to complete (30 minutes)"
    return 1
}

gather_results() {
    print_info "Gathering GitHub Actions results..."
    
    # Get recent workflow runs (last 10 to catch all recent runs)
    local runs=$(gh run list --limit 10 --json status,conclusion,workflowName,createdAt,url,headSha)
    
    # Get current commit SHA
    local current_sha=$(git rev-parse HEAD)
    
    # Filter runs for current commit
    local current_runs=$(echo "$runs" | jq --arg sha "$current_sha" '[.[] | select(.headSha == $sha)]')
    
    if [ "$(echo "$current_runs" | jq length)" -eq 0 ]; then
        print_warning "No GitHub Actions found for current commit"
        return 0
    fi
    
    print_info "Results for commit $(git rev-parse --short HEAD):"
    echo
    
    # Output results in JSON format for AI to parse
    echo "=== WORKFLOW_RESULTS_START ==="
    echo "$current_runs" | jq -c '.[]'
    echo "=== WORKFLOW_RESULTS_END ==="
    
    # Also output failed workflow details
    echo "=== FAILED_WORKFLOW_DETAILS_START ==="
    echo "$current_runs" | jq -c '.[] | select(.conclusion == "failure")' | while IFS= read -r run; do
        local url=$(echo "$run" | jq -r '.url')
        local run_id=$(echo "$url" | grep -o '[0-9]*$')
        if [ -n "$run_id" ]; then
            echo "=== RUN_ID: $run_id ==="
            gh run view "$run_id" --log-failed 2>/dev/null || echo "Could not fetch logs for run $run_id"
            echo "=== END_RUN_ID: $run_id ==="
        fi
    done
    echo "=== FAILED_WORKFLOW_DETAILS_END ==="
    
    # Return appropriate exit code
    local has_failures=$(echo "$current_runs" | jq '[.[] | select(.conclusion == "failure")] | length')
    if [ "$has_failures" -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

main() {
    echo "🤖 CI Trigger and Monitor"
    echo "========================"
    
    # Step 1: Check prerequisites
    check_prerequisites
    echo
    
    # Step 2: Handle git status
    handle_git_status
    echo
    
    # Step 3: Trigger CI build
    trigger_ci_build
    echo
    
    # Step 4: Wait for GitHub Actions
    if wait_for_actions; then
        echo
        
        # Step 5: Gather results
        if gather_results; then
            print_success "🎉 All GitHub Actions passed!"
            exit 0
        else
            print_error "❌ Some GitHub Actions failed"
            exit 1
        fi
    else
        print_error "❌ Timeout or error waiting for GitHub Actions"
        exit 2
    fi
}

# Handle Ctrl+C gracefully
trap 'echo; print_warning "Script interrupted by user"; exit 130' INT

# Run main function
main "$@"