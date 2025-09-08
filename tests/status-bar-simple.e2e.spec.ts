import { test as baseTest, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';

// Simple test without localStorage reset
const test = baseTest.extend<{
  electronApp: ElectronApplication;
  page: Page;
}>({
  electronApp: async (_, use) => {
    const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
    const appPath = path.join(__dirname, '..');
    
    const app = await electron.launch({
      executablePath: electronPath,
      args: [appPath],
      env: { 
        E2E: '1',
        NODE_ENV: 'test',
        ELECTRON_DISABLE_SANDBOX: '1'
      }
    });

    await use(app);
    await app.close();
  },
  
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  }
});

test.describe('Status Bar Implementation', () => {
  test('should not have widget headers', async ({ page }) => {
    // Wait a bit for the app to load
    await page.waitForTimeout(2000);
    
    // Check that old header elements don't exist
    const editorHeaders = await page.$$('.editor-header');
    expect(editorHeaders.length).toBe(0);
    
    const markdownHeaders = await page.$$('.markdown-header');
    expect(markdownHeaders.length).toBe(0);
    
    console.log('✓ No widget headers found');
  });

  test('should have status bar visible', async ({ page }) => {
    // Wait a bit for the app to load
    await page.waitForTimeout(2000);
    
    // Check for status bar
    const statusBar = await page.$('.status-bar');
    expect(statusBar).not.toBeNull();
    
    if (statusBar) {
      const isVisible = await statusBar.isVisible();
      expect(isVisible).toBe(true);
      console.log('✓ Status bar is visible');
    }
  });

  test('should have status bar sections', async ({ page }) => {
    // Wait a bit for the app to load
    await page.waitForTimeout(2000);
    
    // Check for status bar sections
    const leftSection = await page.$('.status-bar-left');
    const rightSection = await page.$('.status-bar-right');
    
    expect(leftSection).not.toBeNull();
    expect(rightSection).not.toBeNull();
    
    console.log('✓ Status bar sections present');
  });
});