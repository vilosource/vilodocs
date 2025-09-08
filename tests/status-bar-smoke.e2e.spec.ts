import { test, expect } from './fixtures/electronTest';

test.describe('Status Bar Smoke Test', () => {
  test('app should load and show shell', async ({ page, electronApp }) => {
    // Wait for app to load - give it more time
    await page.waitForSelector('.shell', { timeout: 30000 });
    
    // App loaded successfully
    const shell = await page.locator('.shell');
    await expect(shell).toBeVisible();
    
    console.log('App loaded successfully');
  });
});