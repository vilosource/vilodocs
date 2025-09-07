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

test.describe('Tab Closing Bug Reproduction', () => {
  test.beforeEach(async () => {
    if (!context?.page) {
      throw new Error('Page not initialized');
    }
    // Reset any state before each test
    await context.page.reload();
    await context.page.waitForTimeout(1000); // Give time for app to initialize
  });

  test('close button is visible on tabs', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Wait for tabs to be visible
    await page.waitForSelector('.tab', { timeout: 5000 });
    
    // Get all tabs
    const tabs = await page.locator('.tab');
    const tabCount = await tabs.count();
    
    console.log(`Found ${tabCount} tabs`);
    
    if (tabCount > 0) {
      // Check first tab for close button
      const firstTab = tabs.first();
      
      // Hover over the tab to make close button visible
      await firstTab.hover();
      
      // Look for close button
      const closeButton = firstTab.locator('.tab-close');
      await expect(closeButton).toBeVisible();
      
      // Check if close button has red background (our debug styling)
      const backgroundColor = await closeButton.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log('Close button background color:', backgroundColor);
    }
  });

  test('close button click is handled for single tab', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Wait for tabs to be visible
    await page.waitForSelector('.tab', { timeout: 5000 });
    
    // Get all tabs
    const tabs = await page.locator('.tab');
    const initialTabCount = await tabs.count();
    
    console.log(`Initial tab count: ${initialTabCount}`);
    
    if (initialTabCount > 0) {
      // Get the first tab
      const firstTab = tabs.first();
      const tabText = await firstTab.textContent();
      console.log(`Clicking close button on tab: ${tabText}`);
      
      // Hover to make close button visible
      await firstTab.hover();
      
      // Find and click the close button
      const closeButton = firstTab.locator('.tab-close');
      await expect(closeButton).toBeVisible();
      
      // Set up dialog handler for our debug alerts
      page.on('dialog', async dialog => {
        console.log(`Alert received: ${dialog.message()}`);
        await dialog.accept();
      });
      
      // Click the close button
      await closeButton.click();
      
      // Wait a bit for any state changes
      await page.waitForTimeout(1000);
      
      // Check what happened to the tabs
      const newTabCount = await tabs.count();
      console.log(`New tab count: ${newTabCount}`);
      
      // In the case of a single tab with our smart closing, 
      // it should be replaced with a welcome tab
      if (initialTabCount === 1) {
        // Should still have 1 tab (welcome tab)
        expect(newTabCount).toBe(1);
        
        // The tab should now be a welcome tab
        const remainingTab = await page.locator('.tab').first();
        const newTabText = await remainingTab.textContent();
        console.log(`Remaining tab text: ${newTabText}`);
        
        // Check if it's a welcome tab
        expect(newTabText?.toLowerCase()).toContain('welcome');
      } else {
        // Should have one less tab
        expect(newTabCount).toBe(initialTabCount - 1);
      }
    }
  });

  test('close button works with multiple tabs', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // First, let's try to create multiple tabs by splitting
    await page.waitForSelector('.tab', { timeout: 5000 });
    
    // Try to split the editor to create more tabs
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Get all tabs after split
    const tabs = await page.locator('.tab');
    const tabCount = await tabs.count();
    
    console.log(`Tab count after split: ${tabCount}`);
    
    if (tabCount > 1) {
      // Get the first tab
      const firstTab = tabs.first();
      const tabText = await firstTab.textContent();
      console.log(`Clicking close button on tab: ${tabText}`);
      
      // Hover to make close button visible
      await firstTab.hover();
      
      // Find and click the close button
      const closeButton = firstTab.locator('.tab-close');
      await expect(closeButton).toBeVisible();
      
      // Set up dialog handler for our debug alerts
      page.on('dialog', async dialog => {
        console.log(`Alert received: ${dialog.message()}`);
        await dialog.accept();
      });
      
      // Click the close button
      await closeButton.click();
      
      // Wait for state changes
      await page.waitForTimeout(1000);
      
      // Should have one less tab
      const newTabCount = await tabs.count();
      console.log(`New tab count: ${newTabCount}`);
      expect(newTabCount).toBe(tabCount - 1);
    }
  });

  test('console errors are captured during tab closing', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait for tabs and try to close one
    await page.waitForSelector('.tab', { timeout: 5000 });
    const tabs = await page.locator('.tab');
    
    if (await tabs.count() > 0) {
      const firstTab = tabs.first();
      await firstTab.hover();
      
      const closeButton = firstTab.locator('.tab-close');
      if (await closeButton.count() > 0) {
        // Set up dialog handler for alerts
        page.on('dialog', async dialog => {
          console.log(`Alert: ${dialog.message()}`);
          await dialog.accept();
        });
        
        await closeButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Print all console logs for debugging
    console.log('Console logs during test:');
    consoleLogs.forEach(log => console.log(`  ${log}`));
    
    // Check for any errors in our context.errors
    const { errors } = context;
    console.log(`Total renderer errors captured: ${errors.length}`);
    errors.forEach(error => console.log(`  Error: ${error}`));
  });

  test('state changes are properly handled during tab closing', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Wait for tabs
    await page.waitForSelector('.tab', { timeout: 5000 });
    
    // Get the current state by checking for editor content
    const editorContent = await page.locator('.editor-content, .editor-widget');
    const hasContent = await editorContent.count() > 0;
    
    console.log(`Has editor content initially: ${hasContent}`);
    
    // Try to close a tab
    const tabs = await page.locator('.tab');
    if (await tabs.count() > 0) {
      const firstTab = tabs.first();
      const tabTitle = await firstTab.textContent();
      console.log(`Attempting to close tab: ${tabTitle}`);
      
      await firstTab.hover();
      const closeButton = firstTab.locator('.tab-close');
      
      if (await closeButton.count() > 0) {
        // Set up dialog handler
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await closeButton.click();
        await page.waitForTimeout(1500);
        
        // Check what content is now visible
        const newEditorContent = await page.locator('.editor-content, .editor-widget');
        const hasNewContent = await newEditorContent.count() > 0;
        
        console.log(`Has editor content after close: ${hasNewContent}`);
        
        // Check for welcome state
        const welcomeElement = await page.locator('.editor-empty, [data-widget="welcome"], .welcome-tab');
        const hasWelcome = await welcomeElement.count() > 0;
        
        console.log(`Has welcome state: ${hasWelcome}`);
        
        // At least one should be true (either content or welcome)
        expect(hasNewContent || hasWelcome).toBe(true);
      }
    }
  });
});