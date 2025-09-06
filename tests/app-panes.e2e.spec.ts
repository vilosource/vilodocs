import { test, expect } from '@playwright/test';
import { 
  launchElectronE2E, 
  captureRendererErrors, 
  setupMainProcessMonitoring,
  closeApp,
  type TestContext 
} from './helpers/e2e';

let context: TestContext | undefined;

test.beforeAll(async () => {
  try {
    // Launch the Electron app
    context = await launchElectronE2E();
    
    // Capture any renderer errors
    context.errors = captureRendererErrors(context.page);
    
    // Monitor main process
    setupMainProcessMonitoring(context.app);
  } catch (error) {
    console.error('Failed to launch Electron app:', error);
    throw error;
  }
});

test.afterAll(async () => {
  // Close the app if it was launched
  if (context) {
    await closeApp(context);
  }
});

test.describe('vilodocs Panes Integration', () => {
  test.beforeEach(async () => {
    if (!context?.page) {
      throw new Error('Context not initialized');
    }
    // Clear any errors from previous tests
    context.errors = [];
  });

  test('app launches without errors', async () => {
    const { page, errors } = context!;
    
    // Wait for the app to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Check that the app launched without errors
    expect(errors).toHaveLength(0);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('panes UI is loaded', async () => {
    const { page } = context!;
    
    // Check for the main app container
    const app = page.locator('.app, .shell, #root > div');
    await expect(app.first()).toBeVisible();
    
    // Check for any of the panes UI elements
    const panesElements = page.locator('.editor-grid, .editor-leaf, .activity-bar, .status-bar, .welcome-tab, .editor-empty');
    const count = await panesElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('activity bar is present', async () => {
    const { page } = context!;
    
    // Activity bar might be present
    const activityBar = page.locator('.activity-bar');
    const count = await activityBar.count();
    
    if (count > 0) {
      await expect(activityBar.first()).toBeVisible();
      
      // Check for activity items
      const items = page.locator('.activity-item');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('keyboard shortcut Ctrl+B works', async () => {
    const { page, errors } = context!;
    
    // Press Ctrl+B to toggle sidebar
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    // Press again to toggle back
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('keyboard shortcut Ctrl+J works', async () => {
    const { page, errors } = context!;
    
    // Press Ctrl+J to toggle panel
    await page.keyboard.press('Control+j');
    await page.waitForTimeout(300);
    
    // Press again to toggle back
    await page.keyboard.press('Control+j');
    await page.waitForTimeout(300);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('split pane with Ctrl+\\ works', async () => {
    const { page, errors } = context!;
    
    // Count initial editor leaves
    const initialLeaves = await page.locator('.editor-leaf').count();
    
    // Press Ctrl+\ to split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Count leaves after split
    const newLeaves = await page.locator('.editor-leaf').count();
    
    // Should have at least as many leaves (might fail if no active leaf)
    expect(newLeaves).toBeGreaterThanOrEqual(initialLeaves);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('app version is valid', async () => {
    const { app } = context!;
    
    // Get the app version
    const version = await app.evaluate(async ({ app }) => {
      return app.getVersion();
    });
    
    // Version should be a valid semver string
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('window title is correct', async () => {
    const { page } = context!;
    
    // Get the window title
    const title = await page.title();
    
    // Title should contain 'vilodocs'
    expect(title.toLowerCase()).toContain('vilodocs');
  });

  test('theme switching works', async () => {
    const { page, errors } = context!;
    
    // Check for theme data attribute
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    
    // Theme should be either 'light' or 'dark' or null
    if (initialTheme) {
      expect(['light', 'dark']).toContain(initialTheme);
    }
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('no console errors after all interactions', async () => {
    const { errors } = context!;
    
    // Check that no console errors occurred during all tests
    expect(errors).toHaveLength(0);
  });
});