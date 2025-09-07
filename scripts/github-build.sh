#!/bin/bash

# GitHub Build Script
# Checks for uncommitted changes, pushes to GitHub, and monitors GitHub Actions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}🚀 GitHub Build Pipeline${NC}"
    echo -e "${BLUE}=================================${NC}"
}

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

check_uncommitted_changes() {
    print_info "Checking for uncommitted changes..."
    
    # Check for unstaged changes
    if [ -n "$(git diff --name-only)" ]; then
        print_error "You have unstaged changes:"
        git diff --name-only | sed 's/^/  /'
        echo
        print_warning "Please stage your changes with 'git add' or stash them before running this script."
        exit 1
    fi
    
    # Check for staged but uncommitted changes
    if [ -n "$(git diff --staged --name-only)" ]; then
        print_error "You have staged but uncommitted changes:"
        git diff --staged --name-only | sed 's/^/  /'
        echo
        print_warning "Please commit your changes with 'git commit' before running this script."
        exit 1
    fi
    
    # Check for untracked files (optional warning)
    if [ -n "$(git ls-files --others --exclude-standard)" ]; then
        print_warning "You have untracked files:"
        git ls-files --others --exclude-standard | sed 's/^/  /'
        echo
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Aborted by user"
            exit 1
        fi
    fi
    
    print_success "No uncommitted changes found"
}

push_to_github() {
    print_info "Pushing to GitHub..."
    
    # Get current branch name
    current_branch=$(git branch --show-current)
    print_info "Current branch: $current_branch"
    
    # Check if there are any commits to push
    if [ -z "$(git log origin/$current_branch..$current_branch 2>/dev/null)" ]; then
        print_success "No new commits to push - already up to date"
        return 0
    fi
    
    # Show commits that will be pushed
    print_info "Commits to be pushed:"
    git log origin/$current_branch..$current_branch --oneline | sed 's/^/  /'
    echo
    
    # Push to GitHub
    if git push origin $current_branch; then
        print_success "Successfully pushed to GitHub"
    else
        print_error "Failed to push to GitHub"
        exit 1
    fi
}

wait_for_actions() {
    print_info "Waiting for GitHub Actions to start..."
    
    # Wait a moment for actions to trigger
    sleep 5
    
    print_info "Monitoring GitHub Actions..."
    
    local max_wait=1800  # 30 minutes max wait
    local wait_time=0
    local check_interval=10
    
    while [ $wait_time -lt $max_wait ]; do
        # Get list of recent workflow runs
        local runs=$(gh run list --limit 5 --json status,conclusion,workflowName,createdAt,url)
        
        # Check if we have any running workflows
        local running_count=$(echo "$runs" | jq '[.[] | select(.status == "in_progress" or .status == "queued")] | length')
        
        if [ "$running_count" -eq 0 ]; then
            print_success "All GitHub Actions completed"
            return 0
        fi
        
        # Show status of running workflows
        print_info "GitHub Actions still running ($running_count active):"
        echo "$runs" | jq -r '.[] | select(.status == "in_progress" or .status == "queued") | "  • \(.workflowName): \(.status)"'
        
        sleep $check_interval
        wait_time=$((wait_time + check_interval))
        
        # Show progress
        if [ $((wait_time % 60)) -eq 0 ]; then
            local minutes=$((wait_time / 60))
            print_info "Waiting for ${minutes} minutes..."
        fi
    done
    
    print_error "Timeout waiting for GitHub Actions to complete (30 minutes)"
    return 1
}

check_action_results() {
    print_info "Checking GitHub Actions results..."
    
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
    
    print_info "Results for current commit ($current_sha):"
    echo
    
    local has_failures=false
    local has_pending=false
    
    # Check each workflow run
    while IFS= read -r run; do
        local name=$(echo "$run" | jq -r '.workflowName')
        local status=$(echo "$run" | jq -r '.status')
        local conclusion=$(echo "$run" | jq -r '.conclusion')
        local url=$(echo "$run" | jq -r '.url')
        
        if [ "$status" != "completed" ]; then
            print_warning "$name: Still $status"
            has_pending=true
        elif [ "$conclusion" = "success" ]; then
            print_success "$name: Passed"
        elif [ "$conclusion" = "failure" ]; then
            print_error "$name: Failed"
            print_info "  View details: $url"
            has_failures=true
        elif [ "$conclusion" = "cancelled" ]; then
            print_warning "$name: Cancelled"
        else
            print_warning "$name: $conclusion"
        fi
    done <<< "$(echo "$current_runs" | jq -c '.[]')"
    
    # Set exit code based on results
    if [ "$has_failures" = true ]; then
        return 1
    elif [ "$has_pending" = true ]; then
        return 2
    else
        return 0
    fi
}

show_failure_details() {
    print_error "Some GitHub Actions failed. Getting details..."
    
    local runs=$(gh run list --limit 10 --json status,conclusion,workflowName,createdAt,url,headSha)
    local current_sha=$(git rev-parse HEAD)
    local failed_runs=$(echo "$runs" | jq --arg sha "$current_sha" '[.[] | select(.headSha == $sha and .conclusion == "failure")]')
    
    echo "$failed_runs" | jq -c '.[]' | while IFS= read -r run; do
        local name=$(echo "$run" | jq -r '.workflowName')
        local url=$(echo "$run" | jq -r '.url')
        
        print_error "Failed workflow: $name"
        print_info "URL: $url"
        
        # Try to get job details
        local run_id=$(echo "$run" | jq -r '.url' | grep -o '[0-9]*$')
        if [ -n "$run_id" ]; then
            print_info "Job details:"
            gh run view "$run_id" --log-failed 2>/dev/null | head -20 | sed 's/^/  /' || true
        fi
        echo
    done
}

main() {
    print_header
    
    # Step 1: Check prerequisites
    check_prerequisites
    echo
    
    # Step 2: Check for uncommitted changes
    check_uncommitted_changes
    echo
    
    # Step 3: Push to GitHub
    push_to_github
    echo
    
    # Step 4: Wait for GitHub Actions
    if wait_for_actions; then
        echo
        
        # Step 5: Check results
        if check_action_results; then
            echo
            print_success "🎉 All GitHub Actions passed! Build pipeline completed successfully."
        elif [ $? -eq 1 ]; then
            echo
            print_error "❌ Some GitHub Actions failed."
            show_failure_details
            exit 1
        else
            echo
            print_warning "⏳ Some GitHub Actions are still pending."
            exit 2
        fi
    else
        echo
        print_error "❌ Timeout or error waiting for GitHub Actions."
        exit 1
    fi
}

# Handle Ctrl+C gracefully
trap 'echo; print_warning "Build interrupted by user"; exit 130' INT

# Run main function
main "$@"