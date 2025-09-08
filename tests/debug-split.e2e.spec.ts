import { test, expect } from '@playwright/test';

test.describe('Debug Split Commands', () => {
  test('reproduce split command duplication bug', async ({ page }) => {
    // Listen for console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('🔧')) {
        logs.push(`${msg.type()}: ${text}`);
        console.log(`${msg.type()}: ${text}`);
      }
    });

    // Go to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for app to load
    await page.waitForSelector('.app', { timeout: 10000 });
    
    // Let the app initialize
    await page.waitForTimeout(1000);
    
    console.log('=== CommandManager Creation Logs ===');
    logs.forEach(log => console.log(log));
    
    console.log('=== Now executing split command via Command Palette ===');
    
    // Clear previous logs for cleaner output
    logs.length = 0;
    
    // Open command palette with Ctrl+Shift+P
    await page.keyboard.press('Control+Shift+p');
    
    // Wait for command palette
    await page.waitForSelector('.command-palette-container', { state: 'visible' });
    
    // Type "split"
    await page.type('.command-palette-input', 'split editor right');
    await page.waitForTimeout(200);
    
    // Click the Split Editor Right command
    const splitCommand = page.locator('.command-palette-item').filter({ hasText: 'Split Editor Right' }).first();
    await splitCommand.click();
    
    // Wait for any async operations
    await page.waitForTimeout(500);
    
    console.log('=== Command Execution Logs ===');
    logs.forEach(log => console.log(log));
    
    // Count the number of editor leaves
    const leafCount = await page.locator('.editor-leaf').count();
    console.log(`Number of editor leaves: ${leafCount}`);
    
    // Should be 2, not 3
    expect(leafCount).toBe(2);
  });
});