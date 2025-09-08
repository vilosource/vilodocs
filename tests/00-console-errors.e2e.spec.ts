import { test, expect } from './fixtures/electronTest';

// This test MUST run first to catch any console errors
test.describe('Console Error Detection', () => {
  test('should have no console errors on app launch', async ({ page, errors }) => {
    // Wait for app to fully load
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Give the app a moment to settle and any initial errors to appear
    await page.waitForTimeout(1000);
    
    // Check that no errors were logged
    expect(errors, `Console errors detected: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('should render main application components without errors', async ({ page, errors }) => {
    // Wait a bit more for app to fully render
    await page.waitForTimeout(2000);
    
    // Verify the shell component is present
    const shellCount = await page.locator('.shell').count();
    expect(shellCount, 'Shell component should be visible').toBeGreaterThan(0);
    
    // Verify status bar is present
    const statusBarCount = await page.locator('.status-bar').count();
    expect(statusBarCount, 'Status bar should be visible').toBeGreaterThan(0);
    
    // Final check: no console errors should have occurred
    expect(errors, `Console errors after rendering: ${errors.join(', ')}`).toHaveLength(0);
  });
});