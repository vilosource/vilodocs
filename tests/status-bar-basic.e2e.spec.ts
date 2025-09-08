import { test, expect } from './fixtures/electronTest';

test.describe('Status Bar Basic Tests', () => {
  test('should not show widget headers', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Verify that widget headers don't exist
    const editorHeader = await page.locator('.editor-header').count();
    const markdownHeader = await page.locator('.markdown-header').count();
    
    expect(editorHeader).toBe(0);
    expect(markdownHeader).toBe(0);
  });

  test('should show status bar', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Check status bar exists and is visible
    const statusBar = await page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    // Status bar should have left and right sections
    const leftSection = await page.locator('.status-bar-left');
    const rightSection = await page.locator('.status-bar-right');
    
    await expect(leftSection).toBeVisible();
    await expect(rightSection).toBeVisible();
  });

  test('should show default Ready status when no widget is active', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    const statusBar = await page.locator('.status-bar');
    const statusText = await statusBar.textContent();
    
    // Should show Ready when no widget is active
    expect(statusText).toContain('Ready');
    
    // Should show encoding and EOL
    expect(statusText).toContain('UTF-8');
    expect(statusText).toContain('LF');
  });
});