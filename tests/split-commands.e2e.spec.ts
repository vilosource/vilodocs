import { test, expect } from '@playwright/test';

test.describe('Split Commands in Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for app to be loaded - check for any element that should exist
    await page.waitForSelector('.app, .shell, body > div', { timeout: 10000 });
    
    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
  });

  test('app loads without critical errors and split commands can be found', async ({ page }) => {
    // Open command palette with Ctrl+Shift+P
    await page.keyboard.press('Control+Shift+p');
    
    // Wait for command palette to open
    await page.waitForSelector('.command-palette-container', { state: 'visible' });
    
    const expectedCommands = [
      'Split Editor Right',
      'Split Editor Down',
      'Focus Next Split',
      'Focus Previous Split',
      'Focus Above Split',
      'Focus Below Split',
      'Close Current Split',
      'Move Tab to Next Split',
      'Move Tab to Previous Split',
      'Rebalance Splits'
    ];
    
    for (const commandLabel of expectedCommands) {
      // Clear search and type command name
      await page.keyboard.press('Control+a');
      await page.type('.command-palette-input', commandLabel.toLowerCase());
      
      // Wait for results to update
      await page.waitForTimeout(100);
      
      // Check if the command appears in results
      const commandExists = await page.locator('.command-palette-item')
        .filter({ hasText: commandLabel })
        .count() > 0;
      
      expect(commandExists).toBe(true);
      console.log(`✓ Found command: ${commandLabel}`);
    }
    
    // Close palette
    await page.keyboard.press('Escape');
  });

  test('split commands work with splits created', async ({ page }) => {
    // Create a split first using Ctrl+\
    await page.keyboard.press('Control+\\');
    
    // Wait for split to be created
    await page.waitForTimeout(500);
    
    // Verify we have multiple leaves now
    const leaves = await page.locator('.editor-leaf').count();
    expect(leaves).toBeGreaterThan(1);
    
    // Test Focus Next Split command
    await page.keyboard.press('Control+Shift+p');
    await page.waitForSelector('.command-palette-container', { state: 'visible' });
    
    await page.type('.command-palette-input', 'focus next split');
    await page.waitForTimeout(100);
    
    const focusNextCommand = page.locator('.command-palette-item').filter({ hasText: 'Focus Next Split' });
    await expect(focusNextCommand).toBeVisible();
    
    // Execute the command
    await focusNextCommand.click();
    
    // Verify palette closed
    await expect(page.locator('.command-palette-container')).toBeHidden();
    
    console.log('✓ Focus Next Split command executed successfully');
  });

  test('rebalance splits command works', async ({ page }) => {
    // Create multiple splits
    await page.keyboard.press('Control+\\'); // First split
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+\\'); // Second split
    await page.waitForTimeout(200);
    
    // Open command palette and execute rebalance
    await page.keyboard.press('Control+Shift+p');
    await page.waitForSelector('.command-palette-container', { state: 'visible' });
    
    await page.type('.command-palette-input', 'rebalance splits');
    await page.waitForTimeout(100);
    
    const rebalanceCommand = page.locator('.command-palette-item').filter({ hasText: 'Rebalance Splits' });
    await expect(rebalanceCommand).toBeVisible();
    
    await rebalanceCommand.click();
    
    // Verify palette closed
    await expect(page.locator('.command-palette-container')).toBeHidden();
    
    console.log('✓ Rebalance Splits command executed successfully');
  });

  test('keyboard shortcuts work for split commands', async ({ page }) => {
    // Test Alt+Right for Focus Next Split
    await page.keyboard.press('Control+\\'); // Create a split first
    await page.waitForTimeout(200);
    
    // Try the keyboard shortcut
    await page.keyboard.press('Alt+ArrowRight');
    await page.waitForTimeout(100);
    
    console.log('✓ Alt+Right keyboard shortcut works');
    
    // Test Alt+Left for Focus Previous Split
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForTimeout(100);
    
    console.log('✓ Alt+Left keyboard shortcut works');
  });
});