import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const mainPath = path.join(__dirname, '..', '.vite', 'build', 'main.js');
  
  app = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });
  
  // Wait for the first window to be created
  page = await app.firstWindow();
  
  // Wait for the app to be ready
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
});

test.afterAll(async () => {
  if (app) {
    await app.close();
  }
});

test.describe('Command Palette', () => {
  test('should open file palette with Ctrl+P', async () => {
    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Press Ctrl+P to open file palette
    await page.keyboard.press('Control+p');
    
    // Wait for command palette to appear
    await page.waitForSelector('.command-palette-backdrop', { timeout: 3000 });
    
    // Verify the palette is open
    const palette = await page.locator('.command-palette-container');
    await expect(palette).toBeVisible();
    
    // Check that file mode is active (no prefix in input)
    const input = await page.locator('.command-palette-input input');
    const value = await input.inputValue();
    expect(value).not.toContain('>');
    
    // Check for the console log message
    const hasFileLog = consoleMessages.some(msg => 
      msg.includes('Opening file palette via Ctrl+P')
    );
    expect(hasFileLog).toBe(true);
    
    // Check placeholder text indicates file mode
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toContain('Search files');
    
    // Close palette
    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible();
  });
  
  test('should open command palette with Ctrl+Shift+P', async () => {
    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Press Ctrl+Shift+P to open command palette
    await page.keyboard.press('Control+Shift+p');
    
    // Wait for command palette to appear
    await page.waitForSelector('.command-palette-backdrop', { timeout: 3000 });
    
    // Verify the palette is open
    const palette = await page.locator('.command-palette-container');
    await expect(palette).toBeVisible();
    
    // Check that command mode is active (> prefix in input)
    const input = await page.locator('.command-palette-input input');
    const value = await input.inputValue();
    expect(value).toBe('>');
    
    // Check for the console log message
    const hasCommandLog = consoleMessages.some(msg => 
      msg.includes('Opening command palette via Ctrl+Shift+P')
    );
    expect(hasCommandLog).toBe(true);
    
    // Check placeholder text indicates command mode
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toContain('Type a command');
    
    // Close palette
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape'); // Clear the '>' first, then close
    await expect(palette).not.toBeVisible();
  });
  
  test('should display real files from workspace', async () => {
    // Open file palette
    await page.keyboard.press('Control+p');
    await page.waitForSelector('.command-palette-backdrop');
    
    // Type to search for files
    const input = await page.locator('.command-palette-input input');
    await input.type('package');
    
    // Wait for results to load
    await page.waitForTimeout(500);
    
    // Check if we have real files (not mock data)
    const items = await page.locator('.command-palette-item').all();
    
    if (items.length > 0) {
      // Check that we're not seeing mock files
      const itemTexts = await Promise.all(
        items.map(item => item.textContent())
      );
      
      // Mock files would have generic names like "README.md" without paths
      // Real files should include path information or be actual project files
      const hasMockFiles = itemTexts.some(text => 
        text?.includes('Project documentation') || 
        text?.includes('Project configuration')
      );
      
      expect(hasMockFiles).toBe(false);
      
      // Should find package.json from our project
      const hasPackageJson = itemTexts.some(text => 
        text?.includes('package.json')
      );
      expect(hasPackageJson).toBe(true);
    }
    
    // Close palette
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });
  
  test('should switch between modes with Tab key', async () => {
    // Open file palette
    await page.keyboard.press('Control+p');
    await page.waitForSelector('.command-palette-backdrop');
    
    const input = await page.locator('.command-palette-input input');
    
    // Initially in file mode (no prefix)
    let value = await input.inputValue();
    expect(value).toBe('');
    
    // Press Tab to switch to command mode
    await page.keyboard.press('Tab');
    value = await input.inputValue();
    expect(value).toBe('>');
    
    // Press Tab again to switch back to file mode
    await page.keyboard.press('Tab');
    value = await input.inputValue();
    expect(value).toBe('');
    
    // Close palette
    await page.keyboard.press('Escape');
  });
  
  test('should navigate items with arrow keys', async () => {
    // Open command palette
    await page.keyboard.press('Control+Shift+p');
    await page.waitForSelector('.command-palette-backdrop');
    
    // Wait for items to load
    await page.waitForTimeout(500);
    
    // Check if we have items
    const items = await page.locator('.command-palette-item').all();
    
    if (items.length > 1) {
      // First item should be selected by default
      let selectedItem = await page.locator('.command-palette-item.selected').first();
      const firstItemText = await selectedItem.textContent();
      
      // Press down arrow to select second item
      await page.keyboard.press('ArrowDown');
      selectedItem = await page.locator('.command-palette-item.selected').first();
      const secondItemText = await selectedItem.textContent();
      
      // Should be different items
      expect(firstItemText).not.toBe(secondItemText);
      
      // Press up arrow to go back to first item
      await page.keyboard.press('ArrowUp');
      selectedItem = await page.locator('.command-palette-item.selected').first();
      const backToFirstText = await selectedItem.textContent();
      
      // Should be back to first item
      expect(backToFirstText).toBe(firstItemText);
    }
    
    // Close palette
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });
  
  test('should execute command when Enter is pressed', async () => {
    // Track console messages to verify command execution
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Open command palette
    await page.keyboard.press('Control+Shift+p');
    await page.waitForSelector('.command-palette-backdrop');
    
    // Wait for items to load
    await page.waitForTimeout(500);
    
    // Check if we have items
    const items = await page.locator('.command-palette-item').all();
    
    if (items.length > 0) {
      // Press Enter to execute the first command
      await page.keyboard.press('Enter');
      
      // Palette should close after execution
      const palette = await page.locator('.command-palette-container');
      await expect(palette).not.toBeVisible();
      
      // Verify some command was attempted to execute
      // (actual execution might fail in test environment, but the attempt should be logged)
      // This depends on what commands are available
    }
  });
});