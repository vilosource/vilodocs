# Testing Guide

This guide covers how to run tests for the vilodocs Electron application.

## Table of Contents

- [Unit Tests](#unit-tests)
- [E2E Tests](#e2e-tests)
  - [Prerequisites](#prerequisites)
  - [Running Tests Locally](#running-tests-locally)
  - [Test Modes](#test-modes)
  - [Debugging Tests](#debugging-tests)
  - [CI/CD](#cicd)
  - [Writing New Tests](#writing-new-tests)

## Unit Tests

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

Run all tests (currently just linting):

```bash
npm test
```

## E2E Tests

End-to-end tests use Playwright to test the Electron application as a real user would, clicking buttons, typing text, and verifying the UI behaves correctly.

### Prerequisites

1. **Install Playwright** (one-time setup):
   ```bash
   npx playwright install
   npx playwright install-deps
   ```

2. **Package the application** (required before each test run):
   ```bash
   npm run package
   ```
   
   This builds the Electron app that tests will launch.

### Running Tests Locally

#### Quick Start

The fastest way to run all E2E tests:

```bash
# Package the app first
npm run package

# Run tests with virtual display (recommended for Linux)
xvfb-run -a npm run test:e2e
```

#### Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run test:e2e` | Run tests in headless mode | CI/CD, quick local testing |
| `npm run test:e2e:headed` | Run tests with visible app window | Debugging, seeing what's happening |
| `npm run test:e2e:ui` | Open Playwright Test UI | Interactive testing, debugging specific tests |
| `xvfb-run -a npm run test:e2e` | Run with virtual display | Linux without display, SSH sessions |

### Test Modes

#### 1. Headless Mode (Default)

Runs tests without showing the app window:

```bash
npm run test:e2e
```

**Pros:** Fast, doesn't interrupt your work
**Cons:** Can't see what's happening

#### 2. Headed Mode

Shows the Electron app while tests run:

```bash
npm run test:e2e:headed
```

**Pros:** Visual feedback, easier debugging
**Cons:** Takes over your screen

#### 3. UI Mode

Opens Playwright's interactive test explorer:

```bash
npm run test:e2e:ui
```

**Features:**
- Run individual tests
- See live test execution
- Time travel debugging
- Inspect DOM snapshots

#### 4. Virtual Display Mode (Linux)

For systems without a display (servers, CI, SSH):

```bash
xvfb-run -a npm run test:e2e
```

This uses Xvfb (X Virtual Framebuffer) to provide a virtual display.

### Debugging Tests

#### View Test Reports

After tests run, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results (pass/fail)
- Execution time
- Error messages
- Screenshots on failure
- Test steps trace

#### Run Specific Tests

Run a single test file:

```bash
npx playwright test tests/app.e2e.spec.ts
```

Run tests matching a pattern:

```bash
npx playwright test -g "editor"
```

#### Debug Mode

Run tests with built-in debugging:

```bash
npx playwright test --debug
```

This opens Playwright Inspector for step-by-step debugging.

### Test Coverage

Current E2E tests verify:

1. **App Launch** - No errors on startup
2. **UI Elements** - Buttons, editor, labels visible
3. **Text Input** - Editor accepts and displays text
4. **File Operations** - Open/Save dialogs work
5. **IPC Communication** - Main/renderer process messaging
6. **Version Check** - Correct app version
7. **Window Properties** - Title, theme settings
8. **Error Detection** - Console errors fail tests

### CI/CD

Tests run automatically on:
- Every push to `main` branch
- Every pull request

GitHub Actions workflow:
- Uses Ubuntu with Xvfb
- Runs all E2E tests
- Uploads test reports as artifacts
- Takes screenshots on failure

View CI test results:
- Go to [GitHub Actions](https://github.com/vilosource/vilodocs/actions)
- Click on "E2E Tests" workflow
- Download artifacts for reports/screenshots

### Writing New Tests

#### Test Structure

Tests are located in `tests/` directory:

```typescript
// tests/my-feature.e2e.spec.ts
import { test, expect } from '@playwright/test';
import { launchElectronE2E, captureRendererErrors } from './helpers/e2e';

test('my feature works', async () => {
  const { app, page, errors } = await launchElectronE2E();
  
  // Your test code here
  await page.locator('#my-button').click();
  await expect(page.locator('#result')).toBeVisible();
  
  // Always check for errors
  expect(errors).toHaveLength(0);
  
  await app.close();
});
```

#### Best Practices

1. **Use semantic selectors**:
   ```typescript
   // Good
   page.getByRole('button', { name: 'Save' })
   page.getByLabel('Username')
   
   // Avoid
   page.locator('.btn-primary')
   ```

2. **Check for console errors**:
   ```typescript
   const errors = captureRendererErrors(page);
   // ... test actions ...
   expect(errors).toHaveLength(0);
   ```

3. **Wait for elements**:
   ```typescript
   await expect(element).toBeVisible();
   await page.waitForLoadState('networkidle');
   ```

4. **Clean up**:
   ```typescript
   test.afterAll(async () => {
     await app.close();
   });
   ```

### Troubleshooting

#### Tests fail with "Display not found"

Use xvfb:
```bash
xvfb-run -a npm run test:e2e
```

#### Tests timeout

Increase timeout in `playwright.config.ts`:
```typescript
timeout: 120_000, // 2 minutes
```

#### Can't see what's happening

Use headed mode:
```bash
npm run test:e2e:headed
```

#### Tests pass locally but fail in CI

Check for:
- Timing issues (add waits)
- Display dependencies (use Xvfb)
- File paths (use absolute paths)

### Performance

Current test metrics:
- **Total tests:** 9
- **Execution time:** ~3 seconds
- **Parallel execution:** No (single Electron instance)
- **Screenshots:** Only on failure
- **Video:** Disabled for performance

### Configuration

Test configuration is in `playwright.config.ts`:

```typescript
{
  testDir: 'tests',           // Test file location
  timeout: 60_000,             // Test timeout (1 minute)
  screenshot: 'only-on-failure', // Screenshot strategy
  video: 'off',                // Video recording disabled
  trace: 'retain-on-failure'   // Keep trace for debugging
}
```

## Summary

- **Quick test:** `xvfb-run -a npm run test:e2e`
- **Debug:** `npm run test:e2e:headed` or `npm run test:e2e:ui`
- **CI/CD:** Automatic on push/PR
- **Reports:** `npx playwright show-report`

For questions or issues, check the [GitHub Issues](https://github.com/vilosource/vilodocs/issues).