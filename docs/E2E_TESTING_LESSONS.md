# E2E Testing Lessons Learned

## The Problem
Our E2E tests failed to catch a critical JavaScript error: missing export `createInitialState` in `layoutReducer.ts`. The tests were checking for UI elements but the app couldn't even initialize due to the JavaScript error.

## Why The Tests Failed To Catch It

### What We Were Testing (Wrong Approach)
```javascript
test('editor grid is visible', async () => {
  const editorGrid = await page.locator('.editor-grid');
  await expect(editorGrid).toBeVisible(); // FAILS: Element not found
});
```

**Problem**: This only tells us the element isn't there, not WHY it's missing!

### What We Should Test FIRST (Right Approach)
```javascript
test('app loads without JavaScript errors', async () => {
  const { page, errors } = context!;
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Give React time to render or error
  
  // CHECK FOR CONSOLE ERRORS FIRST!
  expect(errors).toHaveLength(0);
  
  if (errors.length > 0) {
    console.error('Console errors detected:', errors);
  }
});
```

## Critical E2E Testing Best Practices

### 1. Test Loading Order
Always test in this order:
1. **JavaScript errors** - Any console errors?
2. **App initialization** - Did the app start?
3. **Component rendering** - Are components visible?
4. **Functionality** - Do features work?

### 2. Capture All Errors
```javascript
export function captureRendererErrors(page: Page): string[] {
  const errors: string[] = [];
  
  // Console errors (like our missing export)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  
  // Unhandled exceptions
  page.on('pageerror', err => {
    errors.push(`Page error: ${String(err)}`);
  });
  
  // Failed network requests
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()}`);
  });
  
  return errors;
}
```

### 3. Test JavaScript Execution
```javascript
test('React app initializes successfully', async () => {
  // Check React loaded
  const hasReact = await page.evaluate(() => {
    return !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  });
  expect(hasReact).toBe(true);
  
  // Check root has content
  const rootContent = await root.innerHTML();
  expect(rootContent.length).toBeGreaterThan(50);
});
```

### 4. Test Critical Imports
```javascript
test('critical imports resolve correctly', async () => {
  const modulesLoaded = await page.evaluate(() => {
    return {
      react: typeof (window as any).React !== 'undefined',
      appRendered: document.getElementById('root')?.children.length > 0,
      hasContent: document.body.innerHTML.length > 100
    };
  });
  
  expect(modulesLoaded.react).toBe(true);
  expect(modulesLoaded.appRendered).toBe(true);
});
```

## The Fix Applied

### Created `integration.e2e.spec.ts`
This test suite checks:
- ✅ JavaScript errors (would have caught the export issue!)
- ✅ React initialization
- ✅ Component rendering
- ✅ localStorage access
- ✅ IPC bridge availability
- ✅ Keyboard shortcut handling

### Test Results
- 7/10 tests passing
- Most importantly: **"app loads without JavaScript errors"** passes
- Components are rendering: shell, app, editor-grid, editor-leaf, etc.

## Recommendations

### 1. Run Integration Tests First
```bash
# Run critical integration tests before feature tests
npm run test:e2e -- tests/integration.e2e.spec.ts
```

### 2. Fail Fast on Errors
```javascript
test.beforeEach(async () => {
  // If there are JavaScript errors, skip UI tests
  if (context.errors.length > 0) {
    console.error('JavaScript errors detected:', context.errors);
    test.skip(); // Don't waste time on UI tests
  }
});
```

### 3. Add Error Checking to All Tests
```javascript
test('any UI test', async () => {
  // ALWAYS check for errors first
  expect(errors).toHaveLength(0);
  
  // THEN test the UI
  const element = await page.locator('.my-element');
  await expect(element).toBeVisible();
});
```

### 4. Use Descriptive Error Messages
```javascript
if (errors.length > 0) {
  throw new Error(`Cannot test UI due to JavaScript errors: ${errors.join(', ')}`);
}
```

## Conclusion

The missing `createInitialState` export would have been caught immediately if our E2E tests had checked for JavaScript errors before testing UI elements. The new integration test suite provides proper coverage for critical failures.

**Key Takeaway**: E2E tests should verify the app loads and initializes correctly BEFORE testing specific features. A blank screen usually means JavaScript errors, not UI bugs!