# Makefile for vilodocs
# Provides convenient targets for development and CI/CD

# Variables
NODE_BIN := node_modules/.bin
PLAYWRIGHT := $(NODE_BIN)/playwright
VITEST := $(NODE_BIN)/vitest
ESLINT := $(NODE_BIN)/eslint

# Color output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Default target
.PHONY: help
help:
	@echo "vilodocs Makefile"
	@echo "================="
	@echo ""
	@echo "Available targets:"
	@echo "  make install       - Install all dependencies"
	@echo "  make lint          - Run ESLint on all TypeScript files"
	@echo "  make lint-fix      - Run ESLint with auto-fix"
	@echo "  make test-unit     - Run unit tests with Vitest"
	@echo "  make test-e2e      - Run E2E tests with Playwright"
	@echo "  make test          - Run all tests (lint, unit, E2E)"
	@echo "  make test-ci       - Run all tests in CI mode (no watch, with coverage)"
	@echo "  make build         - Build the application"
	@echo "  make start         - Start the application in dev mode"
	@echo "  make clean         - Clean build artifacts and node_modules"
	@echo ""

# Install dependencies
.PHONY: install
install:
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

# Lint the codebase
.PHONY: lint
lint:
	@echo "$(YELLOW)Running ESLint...$(NC)"
	@$(ESLINT) --ext .ts,.tsx . || (echo "$(RED)✗ Linting failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ Linting passed$(NC)"

# Lint with auto-fix
.PHONY: lint-fix
lint-fix:
	@echo "$(YELLOW)Running ESLint with auto-fix...$(NC)"
	@$(ESLINT) --ext .ts,.tsx . --fix
	@echo "$(GREEN)✓ Linting complete$(NC)"

# Run unit tests
.PHONY: test-unit
test-unit:
	@echo "$(YELLOW)Running unit tests...$(NC)"
	@$(VITEST) run --reporter=verbose || (echo "$(RED)✗ Unit tests failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ Unit tests passed$(NC)"

# Run unit tests with coverage
.PHONY: test-unit-coverage
test-unit-coverage:
	@echo "$(YELLOW)Running unit tests with coverage...$(NC)"
	@$(VITEST) run --coverage || (echo "$(RED)✗ Unit tests failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ Unit tests passed with coverage$(NC)"

# Run E2E tests
.PHONY: test-e2e
test-e2e:
	@echo "$(YELLOW)Running E2E tests...$(NC)"
	@$(PLAYWRIGHT) test || (echo "$(RED)✗ E2E tests failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ E2E tests passed$(NC)"

# Run E2E tests in headed mode (with browser UI)
.PHONY: test-e2e-headed
test-e2e-headed:
	@echo "$(YELLOW)Running E2E tests in headed mode...$(NC)"
	@$(PLAYWRIGHT) test --headed

# Run all tests (for local development)
.PHONY: test
test: lint test-unit test-e2e
	@echo "$(GREEN)✓ All tests passed!$(NC)"

# Run all tests in CI mode
.PHONY: test-ci
test-ci:
	@echo "$(YELLOW)Running CI test suite...$(NC)"
	@echo "$(YELLOW)[1/3] Linting...$(NC)"
	@$(ESLINT) --ext .ts,.tsx . --max-warnings 0 || (echo "$(RED)✗ Linting failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ Linting passed$(NC)"
	@echo ""
	@echo "$(YELLOW)[2/3] Running unit tests...$(NC)"
	@CI=true $(VITEST) run --coverage --reporter=json --reporter=default || (echo "$(RED)✗ Unit tests failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ Unit tests passed$(NC)"
	@echo ""
	@echo "$(YELLOW)[3/3] Running E2E tests...$(NC)"
	@CI=true $(PLAYWRIGHT) test --reporter=list || (echo "$(RED)✗ E2E tests failed$(NC)" && exit 1)
	@echo "$(GREEN)✓ E2E tests passed$(NC)"
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ All CI tests passed successfully!$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"

# Build the application
.PHONY: build
build:
	@echo "$(YELLOW)Building application...$(NC)"
	npm run package
	@echo "$(GREEN)✓ Build complete$(NC)"

# Start the application
.PHONY: start
start:
	@echo "$(YELLOW)Starting application...$(NC)"
	npm start

# Clean build artifacts
.PHONY: clean
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf out .vite node_modules coverage test-results
	@echo "$(GREEN)✓ Clean complete$(NC)"

# Check if all dependencies are installed
node_modules: package.json
	@echo "$(YELLOW)Dependencies not found. Installing...$(NC)"
	npm install

# Ensure dependencies before running tests
test-unit test-e2e test test-ci lint: node_modules

# GitHub Actions specific target
.PHONY: ci
ci: test-ci
	@echo "$(GREEN)CI pipeline completed successfully$(NC)"

# Quick test for pre-push
.PHONY: test-quick
test-quick: lint test-unit
	@echo "$(GREEN)✓ Quick tests passed$(NC)"

# Run specific test file
.PHONY: test-file
test-file:
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify a test file with FILE=path/to/test.ts$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Running test: $(FILE)$(NC)"
	@$(VITEST) run $(FILE)

# Install Playwright browsers
.PHONY: install-browsers
install-browsers:
	@echo "$(YELLOW)Installing Playwright browsers...$(NC)"
	@$(PLAYWRIGHT) install
	@echo "$(GREEN)✓ Browsers installed$(NC)"

# Update snapshots for E2E tests
.PHONY: update-snapshots
update-snapshots:
	@echo "$(YELLOW)Updating E2E test snapshots...$(NC)"
	@$(PLAYWRIGHT) test --update-snapshots

# Run tests in watch mode (for development)
.PHONY: test-watch
test-watch:
	@echo "$(YELLOW)Starting test watcher...$(NC)"
	@$(VITEST) watch

# Generate test report
.PHONY: test-report
test-report:
	@echo "$(YELLOW)Generating test report...$(NC)"
	@$(PLAYWRIGHT) show-report

# Validate that everything is ready for production
.PHONY: validate
validate: lint test-ci build
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ Application validated and ready!$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"

# Print environment info for debugging
.PHONY: info
info:
	@echo "Environment Information:"
	@echo "========================"
	@echo "Node version: $$(node --version)"
	@echo "NPM version: $$(npm --version)"
	@echo "Working directory: $$(pwd)"
	@echo "OS: $$(uname -s)"
	@echo ""
	@echo "Project Dependencies:"
	@echo "===================="
	@echo "Electron: $$(npm list electron --depth=0 | grep electron)"
	@echo "Vitest: $$(npm list vitest --depth=0 | grep vitest)"
	@echo "Playwright: $$(npm list @playwright/test --depth=0 | grep playwright)"
	@echo "TypeScript: $$(npm list typescript --depth=0 | grep typescript)"