# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## WSL Wayland Support

The application has automatic WSL Wayland support configured. When running on WSL with Wayland display:
- The `npm start` command automatically detects WSL and WAYLAND_DISPLAY environment variable
- It adds the necessary Chromium flags: `--enable-features=UseOzonePlatform --ozone-platform=wayland`
- This is handled by `scripts/start-wsl.js` which wraps the electron-forge start command
- Manual flag passing is not required - just use `npm start` as normal

## Git Commit Hooks

The repository has a commit-msg hook that prevents AI attribution in commit messages:
- **Location**: `.githooks/commit-msg`
- **Setup**: Run `git config core.hooksPath .githooks` or `./scripts/setup-hooks.sh`
- **Purpose**: Blocks commits containing AI references, "Generated with" attributions, robot emojis, etc.
- **Important**: When using AI assistance, ensure commit messages are written as if by a human developer
- The hook ensures clean, professional commit history without AI tool references

## PRIMARY DEVELOPMENT METHODOLOGY: Test-Driven Development (TDD)

**MANDATORY**: All new features and bug fixes MUST follow Test-Driven Development:

1. **RED** - Write a failing test first
2. **GREEN** - Write minimal code to make the test pass  
3. **REFACTOR** - Improve the code while keeping tests green

**NO EXCEPTIONS**: Writing code without tests first is considered a bug. The recent "items.map is not a function" bug in CommandPalette is a direct result of not following TDD - the component was changed from sync to async without tests, causing a runtime crash that tests would have caught immediately.

## Project Overview

This is an Electron application built with TypeScript, Vite, and Electron Forge. The application uses a multi-process architecture typical of Electron apps with main, renderer, and preload processes.

## Development Commands

```bash
# Start the application in development mode
npm start

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Package the application for distribution
npm run package

# Create platform-specific installers
npm run make

# Publish the application
npm run publish

# Run ESLint on TypeScript files
npm run lint
```

## Architecture

### Build Configuration
- **Electron Forge** handles packaging and distribution with makers for Windows (Squirrel), macOS (ZIP), and Linux (DEB/RPM)
- **Vite** powers the build system with separate configs for main, preload, and renderer processes
- **TypeScript** is configured with ESNext target and CommonJS modules

### Process Structure
- **Main Process** (`src/main.ts`): Creates browser windows, handles app lifecycle
- **Preload Script** (`src/preload.ts`): Bridge between main and renderer processes
- **Renderer Process** (`src/renderer.ts`): Frontend code loaded by `index.html`

### Key Configuration Files
- `forge.config.ts`: Electron Forge configuration defining build entries, makers, and security fuses
- `vite.*.config.ts`: Separate Vite configs for each process type
- Security fuses are enabled to prevent Node.js access in renderer, enforce ASAR integrity, and enable cookie encryption

## Testing Strategy - CRITICAL

### Test-Driven Development (TDD) - MANDATORY

**CRITICAL**: Write tests BEFORE implementing features. This prevents bugs like "items.map is not a function" that occur when APIs change from synchronous to asynchronous.

#### TDD Process:
1. **Write the test first** - Define expected behavior before implementation
2. **Watch it fail** - Ensures the test actually tests something
3. **Write minimal code to pass** - Focus on making the test green
4. **Refactor with confidence** - Tests ensure nothing breaks

#### Example of TDD preventing async bugs:
```typescript
// 1. Write test first (forces you to think about the API)
test('should handle async data loading', async () => {
  mockGetItems.mockResolvedValue([...]); // Is this async? Decision made upfront
  render(<Component />);
  await waitFor(() => ...); // Explicitly handle async behavior
});

// 2. Implementation is guided by the test
// You CANNOT accidentally make items.map fail because the test defines the contract
```

### Console Error Detection
**IMPORTANT**: The FIRST test to run or write should ALWAYS check for console errors. Runtime errors that appear in the console often indicate critical issues that will crash the application.

### Testing Hierarchy
1. **Console Error Check** - Before ANY other tests, verify no console.error calls occur
2. **Unit Tests** - Test individual components and functions in isolation
3. **Integration Tests** - Test component interactions and state management
4. **E2E Tests** - Test full application workflows including:
   - Application launch without JavaScript errors
   - UI component rendering
   - User interactions (clicks, keyboard shortcuts)
   - File operations through IPC
   - Layout persistence

### Test Implementation Requirements
- **ALWAYS write tests BEFORE implementation** - No exceptions for new features
- **Update tests BEFORE changing APIs** - Especially for sync → async migrations
- All React component tests MUST import React explicitly
- Use the console error detection setup in `tests/setup/console-error-detection.ts`
- E2E tests should check for JavaScript errors before checking UI elements
- When creating new features, write tests that would have caught any bugs encountered
- **Run tests before every commit** - Use `npm test` to catch issues early

### Common Bug Patterns That TDD Prevents

#### Synchronous to Asynchronous Migration Bugs
**Most common React error**: "Cannot read property 'map' of undefined" or "items.map is not a function"
```typescript
// TEST FIRST - Forces you to handle async properly
test('handles async data correctly', async () => {
  const items = Promise.resolve([{id: 1}]); // Explicitly async
  mockHook.mockReturnValue(items);
  
  render(<Component />);
  
  // Won't pass without proper async handling in component
  await waitFor(() => {
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

#### State Update Timing Issues
```typescript
// TEST FIRST - Catches race conditions
test('updates state in correct order', async () => {
  const { rerender } = render(<Component />);
  
  fireEvent.click(button);
  await waitFor(() => expect(mockApi).toHaveBeenCalled());
  
  // Forces you to handle loading states
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Common Testing Patterns
```typescript
// Always check for console errors first
test('component renders without errors', () => {
  // This will automatically fail if console.error is called
  render(<Component />);
  expect(screen.getByRole('...')).toBeInTheDocument();
});

// E2E test pattern
test('app loads without JavaScript errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  expect(errors).toHaveLength(0); // FIRST assertion
  // Only then check UI elements
});

// Async hook testing pattern
test('handles async hooks correctly', async () => {
  const TestComponent = () => {
    const { data, loading } = useAsyncHook();
    if (loading) return <div>Loading...</div>;
    return <div>{data.map(item => <span key={item.id}>{item.name}</span>)}</div>;
  };
  
  render(<TestComponent />);
  
  // First check loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Then wait for data
  await waitFor(() => {
    expect(screen.getByText('Expected item')).toBeInTheDocument();
  });
});
```

### Critical Testing Areas
- Widget rendering (especially with persisted state)
- Tab management and lifecycle
- File system operations
- Layout persistence and migration
- IPC communication between processes
- Remember that it is 2025 when searching the internet

## Debugging Methodology - CRITICAL

### E2E Test-Driven Debugging
For complex UI interactions that are hard to reproduce manually, **always start with E2E tests**:

```typescript
// Example: Tab closing bug reproduction
test('close button click is handled for single tab', async () => {
  // Set up dialog handlers for debug alerts
  page.on('dialog', async dialog => {
    console.log(`Alert: ${dialog.message()}`);
    await dialog.accept();
  });
  
  // Systematic reproduction of user scenario
  const tabs = await page.locator('.tab');
  const closeButton = tabs.first().locator('.tab-close');
  await closeButton.click();
  
  // Verify expected behavior
  // This approach revealed the dirty flag issue
});
```

**Why E2E debugging works better than manual testing:**
- Provides reliable, repeatable reproduction
- Captures the complete user interaction flow
- Can be preserved as regression tests
- Reveals issues that manual testing might miss

### Systematic Event Flow Tracing

**NEVER assume where the problem lies.** Always trace the complete call chain:

1. **UI Layer**: Is the button clickable? (CSS, DOM structure)
2. **Event Handlers**: Are click events reaching handlers? 
3. **Component Props**: Are callbacks being passed correctly?
4. **State Dispatch**: Are Redux actions being dispatched?
5. **Reducer Logic**: Are state updates being processed?
6. **Business Logic**: Are business rules blocking the operation?

**Example from tab closing bug:**
```
✅ Button click works
✅ Event handlers called  
✅ Redux dispatch works
✅ Reducer receives action
🔴 Business logic blocks: dirty tabs won't close without force flag
```

### State Management Debugging (React/Redux)

**Key insight**: UI issues in state-driven apps are often state management issues in disguise.

**Common patterns to check:**
- **Business rules overriding UI expectations** (e.g., dirty flag blocking tab close)
- **State not updating as expected** (reducer logic issues)
- **Props not flowing correctly** (component hierarchy problems)
- **Async state updates** (timing issues)

**Debug approach:**
1. Add systematic logging to trace state changes
2. Use Redux DevTools to inspect state transitions  
3. Verify business logic rules match user expectations
4. Check if `force` flags or override mechanisms are needed

### Debug Tool Escalation Strategy

Match your debugging tools to the complexity level:

**Level 1 - Simple Issues**:
```javascript
console.log('Value:', value);
```

**Level 2 - UI Interactions**:  
```javascript
// Visual debugging aids
element.style.background = 'red'; // Make elements obvious
alert('Button clicked: ' + buttonId); // Immediate feedback
```

**Level 3 - Complex Flows**:
- Write E2E tests with systematic logging
- Use Playwright's trace viewer for step-by-step analysis
- Create reproduction scenarios that can be shared and debugged

### Common Debugging Pitfalls to Avoid

1. **Don't start with random CSS/DOM fixes** - Verify the issue is actually in the UI layer first
2. **Don't rely only on console.log** - Console output can be missed; use alerts for critical debugging
3. **Don't assume the obvious cause** - UI issues often have deeper state management roots
4. **Don't debug in isolation** - Use systematic approaches that trace through all layers

### Business Logic vs User Expectations

**Critical lesson**: Sometimes the "bug" is actually correct technical behavior that doesn't match user expectations.

**Example from tab closing**:
- **Technical**: "Don't close dirty tabs unless forced" 
- **User expectation**: "X button should always close tabs"
- **Solution**: Force-close when clicking X button (match VS Code behavior)

**Always ask**: Should we change the technical behavior to match user expectations, or educate users about the technical behavior?

### Debugging Infrastructure Best Practices

**Turn debugging artifacts into permanent value:**

1. **E2E Tests**: Convert reproduction scenarios into regression tests
2. **Visual Debugging**: Create reusable debug modes (e.g., always-visible close buttons)
3. **Logging**: Add systematic logging that can be enabled for debugging
4. **Documentation**: Record debugging approaches that worked for similar issues

**Example**: The tab closing E2E test now prevents future regressions and serves as documentation of the expected behavior.

### When to Escalate Debugging Approaches

**Start simple, escalate systematically:**

1. **Quick check**: Console logs and visual inspection
2. **Systematic**: Add logging to trace event flow  
3. **Comprehensive**: Write E2E test to reproduce reliably
4. **Deep dive**: Use browser dev tools, Redux DevTools, Playwright traces

**Rule of thumb**: If you can't reproduce the issue reliably within 15 minutes of manual testing, write an E2E test.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.