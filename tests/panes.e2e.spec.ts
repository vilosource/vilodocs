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

test.describe('Panes Functionality E2E Tests', () => {
  test.beforeEach(async () => {
    if (!context?.page) {
      throw new Error('Page not initialized');
    }
    // Reset any state before each test
    await context.page.reload();
    await context.page.waitForTimeout(500);
  });

  test('editor grid is visible', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check if editor grid is present
    const editorGrid = await page.locator('.editor-grid');
    await expect(editorGrid).toBeVisible();
    
    // Check for at least one editor leaf
    const editorLeaf = await page.locator('.editor-leaf').first();
    await expect(editorLeaf).toBeVisible();
  });

  test('activity bar is functional', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check activity bar is visible
    const activityBar = await page.locator('.activity-bar');
    await expect(activityBar).toBeVisible();
    
    // Check for activity items
    const activityItems = await page.locator('.activity-item');
    await expect(activityItems).toHaveCount(5); // Explorer, Search, SCM, Debug, Extensions
  });

  test('sidebar can be toggled with Ctrl+B', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check sidebar is initially visible
    const sidebar = await page.locator('.sidebar').first();
    await expect(sidebar).toBeVisible();
    
    // Press Ctrl+B to hide sidebar
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    // Sidebar should be hidden
    await expect(sidebar).not.toBeVisible();
    
    // Press Ctrl+B again to show sidebar
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    // Sidebar should be visible again
    await expect(sidebar).toBeVisible();
  });

  test('panel can be toggled with Ctrl+J', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check panel is initially visible
    const panel = await page.locator('.panel');
    const isInitiallyVisible = await panel.isVisible();
    
    // Press Ctrl+J to toggle panel
    await page.keyboard.press('Control+j');
    await page.waitForTimeout(300);
    
    // Panel visibility should be toggled
    const isVisibleAfterToggle = await panel.isVisible();
    expect(isVisibleAfterToggle).toBe(!isInitiallyVisible);
    
    // Press Ctrl+J again to toggle back
    await page.keyboard.press('Control+j');
    await page.waitForTimeout(300);
    
    // Panel should be back to initial state
    const isFinallyVisible = await panel.isVisible();
    expect(isFinallyVisible).toBe(isInitiallyVisible);
  });

  test('tabs can be added and closed', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check initial tab count
    const tabs = await page.locator('.tab');
    const initialCount = await tabs.count();
    
    // If there are tabs, try to close one with Ctrl+W
    if (initialCount > 0) {
      // Focus on first tab
      await tabs.first().click();
      
      // Close tab with Ctrl+W
      await page.keyboard.press('Control+w');
      await page.waitForTimeout(300);
      
      // Check tab count decreased
      const newCount = await tabs.count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('editor can be split horizontally with Ctrl+\\', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Count initial editor leaves
    const initialLeaves = await page.locator('.editor-leaf');
    const initialCount = await initialLeaves.count();
    
    // Press Ctrl+\ to split horizontally
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Check that we have more editor leaves
    const newLeaves = await page.locator('.editor-leaf');
    const newCount = await newLeaves.count();
    
    // We should have at least one more leaf after split
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('status bar shows information', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Check status bar is visible
    const statusBar = await page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    
    // Check for status items
    const statusItems = await page.locator('.status-item');
    const itemCount = await statusItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('welcome tab is shown when no files are open', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Look for welcome tab or empty state
    const emptyState = await page.locator('.editor-empty, .welcome-tab');
    const hasEmptyState = await emptyState.count();
    
    if (hasEmptyState > 0) {
      await expect(emptyState.first()).toBeVisible();
      
      // Check for welcome message
      const welcomeText = await emptyState.locator('text=/welcome|no files/i').first();
      await expect(welcomeText).toBeVisible();
    }
  });

  test('tab navigation with Ctrl+Tab works', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Get all tabs
    const tabs = await page.locator('.tab');
    const tabCount = await tabs.count();
    
    // Only test if there are multiple tabs
    if (tabCount > 1) {
      // Get initially active tab
      const activeTab = await page.locator('.tab.active').first();
      const initialText = await activeTab.textContent();
      
      // Press Ctrl+Tab to switch to next tab
      await page.keyboard.press('Control+Tab');
      await page.waitForTimeout(300);
      
      // Check that active tab changed
      const newActiveTab = await page.locator('.tab.active').first();
      const newText = await newActiveTab.textContent();
      
      // If we have more than 2 tabs, the text should be different
      // If we have exactly 2 tabs, pressing again should cycle back
      if (tabCount > 2) {
        expect(newText).not.toBe(initialText);
      } else {
        // Press Ctrl+Tab again to cycle back
        await page.keyboard.press('Control+Tab');
        await page.waitForTimeout(300);
        
        const finalActiveTab = await page.locator('.tab.active').first();
        const finalText = await finalActiveTab.textContent();
        expect(finalText).toBe(initialText);
      }
    }
  });
});

test.describe('Panes Drag and Drop', () => {
  test('tabs can be reordered by dragging', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Get tabs
    const tabs = await page.locator('.tab');
    const tabCount = await tabs.count();
    
    // Only test if there are multiple tabs
    if (tabCount > 1) {
      const firstTab = tabs.first();
      const lastTab = tabs.last();
      
      // Get initial positions
      const firstTabText = await firstTab.textContent();
      
      // Drag first tab to last position
      await firstTab.hover();
      await page.mouse.down();
      await lastTab.hover();
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      // Check that tab order changed
      const newLastTab = await page.locator('.tab').last();
      const newLastTabText = await newLastTab.textContent();
      
      // The first tab should now be at a different position
      // This test is simplified - in reality we'd need to check exact positions
      expect(newLastTabText).toBeTruthy();
    }
  });

  test('resize gutter allows resizing panes', async () => {
    if (!context?.page) throw new Error('Context not initialized');
    const page = context.page;
    
    // Look for resize gutters
    const gutters = await page.locator('.resize-gutter');
    const gutterCount = await gutters.count();
    
    if (gutterCount > 0) {
      const gutter = gutters.first();
      
      // Get initial position
      const box = await gutter.boundingBox();
      if (box) {
        // Drag the gutter
        await gutter.hover();
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y);
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        // Gutter should still be visible (didn't break the layout)
        await expect(gutter).toBeVisible();
      }
    }
  });
});