import { test, expect } from '@playwright/test';
import { 
  launchElectronE2E, 
  captureRendererErrors, 
  setupMainProcessMonitoring,
  closeApp,
  type TestContext 
} from './helpers/e2e';

let context: TestContext;

test.beforeAll(async () => {
  // Launch the Electron app
  context = await launchElectronE2E();
  
  // Capture any renderer errors
  context.errors = captureRendererErrors(context.page);
  
  // Monitor main process
  setupMainProcessMonitoring(context.app);
});

test.afterAll(async () => {
  // Close the app
  await closeApp(context);
});

test.describe('vilodocs E2E Tests', () => {
  test('app launches without errors', async () => {
    const { page, errors } = context;
    
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Check that we're in E2E mode
    const isE2E = await page.evaluate(() => 
      document.documentElement.getAttribute('data-e2e')
    );
    expect(isE2E).toBe('true');
    
    // Verify no console errors
    expect(errors, `Renderer errors found:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('main UI elements are visible', async () => {
    const { page } = context;
    
    // Check for the main editor area
    const editor = page.locator('#editor');
    await expect(editor).toBeVisible();
    
    // Check for Open and Save buttons
    const openButton = page.locator('#open');
    await expect(openButton).toBeVisible();
    await expect(openButton).toHaveText('Open');
    
    const saveButton = page.locator('#save');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toHaveText('Save');
    
    // Check for the pong element (IPC test)
    const pongElement = page.locator('#pong');
    await expect(pongElement).toBeVisible();
    await expect(pongElement).toHaveText('pong:hello');
  });

  test('editor accepts text input', async () => {
    const { page, errors } = context;
    
    // Get the editor
    const editor = page.locator('#editor');
    
    // Clear existing content
    await editor.fill('');
    
    // Type some text
    const testText = 'Hello from E2E test!';
    await editor.fill(testText);
    
    // Verify the text was entered
    const value = await editor.inputValue();
    expect(value).toBe(testText);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('Open button can be clicked without errors', async () => {
    const { page, errors } = context;
    
    // Click the Open button
    const openButton = page.locator('#open');
    
    // Set up a dialog handler to cancel the file dialog
    page.once('dialog', dialog => dialog.dismiss());
    
    // Click should not throw
    await openButton.click();
    
    // Small wait to ensure any async errors would have been caught
    await page.waitForTimeout(500);
    
    // Verify no errors
    expect(errors).toHaveLength(0);
  });

  test('Save button can be clicked without errors', async () => {
    const { page, errors } = context;
    
    // Add some content to save
    const editor = page.locator('#editor');
    await editor.fill('Test content to save');
    
    // Click the Save button
    const saveButton = page.locator('#save');
    
    // Set up a dialog handler to cancel the save dialog
    page.once('dialog', dialog => dialog.dismiss());
    
    // Click should not throw
    await saveButton.click();
    
    // Small wait to ensure any async errors would have been caught
    await page.waitForTimeout(500);
    
    // Verify no errors
    expect(errors).toHaveLength(0);
  });

  test('app version is valid', async () => {
    const { app } = context;
    
    // Query the app version from main process
    const version = await app.evaluate(async ({ app }) => {
      return app.getVersion();
    });
    
    // Check version format
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version).toBe('0.3.1');
  });

  test('window title is correct', async () => {
    const { page } = context;
    
    // Get the window title
    const title = await page.title();
    
    // Should match the title in index.html
    expect(title).toBe('vilodocs');
  });

  test('theme switching works', async () => {
    const { page } = context;
    
    // Check that theme is set on document
    const theme = await page.evaluate(() => 
      document.documentElement.dataset.theme
    );
    
    // Should be either 'light' or 'dark'
    expect(['light', 'dark']).toContain(theme);
  });

  test('no console errors after all interactions', async () => {
    const { errors } = context;
    
    // Final check - no errors should have been logged
    expect(errors, `Console errors detected:\n${errors.join('\n')}`).toHaveLength(0);
  });
});