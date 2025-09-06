import { beforeAll, afterEach, expect } from 'vitest';

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Track console errors and warnings
let consoleErrors: Array<any> = [];
let consoleWarnings: Array<any> = [];

// Critical React warnings that should fail tests
const CRITICAL_WARNINGS = [
  'Encountered two children with the same key',
  'Each child in a list should have a unique "key" prop',
  'Cannot update a component',
  'Cannot read properties of undefined',
  'Warning: Failed prop type'
];

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

  // Check for critical warnings that should always fail tests
  const criticalWarningsFound: string[] = [];
  for (const warning of consoleWarnings) {
    const warningText = warning.join(' ');
    for (const criticalPattern of CRITICAL_WARNINGS) {
      if (warningText.includes(criticalPattern)) {
        criticalWarningsFound.push(warningText);
      }
    }
  }
  
  if (criticalWarningsFound.length > 0) {
    consoleWarnings = [];
    throw new Error(
      `Test logged critical warning(s):\n${criticalWarningsFound.join('\n')}\n\n` +
      `These warnings indicate serious issues like duplicate React keys or undefined errors.`
    );
  }

  // Optionally check all warnings (can be configured)
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