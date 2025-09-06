import { beforeAll, afterEach, expect } from 'vitest';

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Track console errors and warnings
let consoleErrors: Array<any> = [];
let consoleWarnings: Array<any> = [];

beforeAll(() => {
  // Override console.error
  console.error = (...args: any[]) => {
    consoleErrors.push(args);
    originalError.apply(console, args);
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    consoleWarnings.push(args);
    originalWarn.apply(console, args);
  };
});

afterEach(() => {
  // Check for console errors after each test
  if (consoleErrors.length > 0) {
    const errors = [...consoleErrors];
    consoleErrors = []; // Clear for next test
    
    // Fail the test if there were console errors
    throw new Error(
      `Test logged ${errors.length} console error(s):\n${
        errors.map(args => args.join(' ')).join('\n')
      }`
    );
  }

  // Optionally check warnings (can be configured)
  if (process.env.FAIL_ON_CONSOLE_WARN === 'true' && consoleWarnings.length > 0) {
    const warnings = [...consoleWarnings];
    consoleWarnings = [];
    
    throw new Error(
      `Test logged ${warnings.length} console warning(s):\n${
        warnings.map(args => args.join(' ')).join('\n')
      }`
    );
  }
  
  // Clear warnings even if not failing on them
  consoleWarnings = [];
});

// Export utility functions for tests that expect errors
export function expectConsoleError(fn: () => void, expectedError?: string | RegExp) {
  const errorsBefore = consoleErrors.length;
  fn();
  const errorsAfter = consoleErrors.length;
  
  expect(errorsAfter).toBeGreaterThan(errorsBefore);
  
  if (expectedError) {
    const lastError = consoleErrors[consoleErrors.length - 1];
    const errorMessage = lastError.join(' ');
    
    if (typeof expectedError === 'string') {
      expect(errorMessage).toContain(expectedError);
    } else {
      expect(errorMessage).toMatch(expectedError);
    }
  }
  
  // Clear the expected error so it doesn't fail the test
  consoleErrors.pop();
}

export function clearConsoleErrors() {
  consoleErrors = [];
}

export function clearConsoleWarnings() {
  consoleWarnings = [];
}