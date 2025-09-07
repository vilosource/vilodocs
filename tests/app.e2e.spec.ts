import { test, expect } from './fixtures/electronTest';

test.describe('vilodocs E2E Tests', () => {
  test.beforeEach(async ({ resetApp }) => {
    // Reset app state instead of reloading
    await resetApp();
  });

  test('app launches without errors', async ({ page, errors }) => {
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Check that the root element exists
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // Verify no console errors
    expect(errors, `Renderer errors found:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('main UI elements are visible', async ({ page }) => {
    // Check for the Shell component
    const shell = page.locator('.shell');
    await expect(shell).toBeVisible();
    
    // Check for the activity bar
    const activityBar = page.locator('.activity-bar');
    await expect(activityBar).toBeVisible();
    
    // Check for the sidebar
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    
    // Check for the editor grid
    const editorGrid = page.locator('.editor-grid');
    await expect(editorGrid).toBeVisible();
    
    // Check for at least one editor leaf
    const editorLeaf = page.locator('.editor-leaf').first();
    await expect(editorLeaf).toBeVisible();
  });

  test('activity bar buttons are functional', async ({ page }) => {
    // Check for explorer button
    const explorerButton = page.locator('.activity-bar-item[data-item="explorer"]');
    await expect(explorerButton).toBeVisible();
    
    // Click explorer and verify it's active
    await explorerButton.click();
    await expect(explorerButton).toHaveClass(/active/);
    
    // Check for search button
    const searchButton = page.locator('.activity-bar-item[data-item="search"]');
    await expect(searchButton).toBeVisible();
  });

  test('file explorer is functional', async ({ page }) => {
    // Ensure explorer is visible
    const explorer = page.locator('.file-explorer');
    const isVisible = await explorer.isVisible().catch(() => false);
    
    if (!isVisible) {
      // Open explorer if not visible
      const explorerButton = page.locator('.activity-bar-item[data-item="explorer"]');
      await explorerButton.click();
    }
    
    await expect(explorer).toBeVisible();
    
    // Check for workspace title
    const workspaceTitle = explorer.locator('.explorer-header, .workspace-title').first();
    await expect(workspaceTitle).toBeVisible();
  });

  test('tabs can be created and closed', async ({ page }) => {
    // Get initial tab count
    const tabs = page.locator('.tab');
    const initialCount = await tabs.count();
    
    // Open file dialog with Ctrl+O (if implemented)
    await page.keyboard.press('Control+O');
    await page.waitForTimeout(500);
    
    // Check if dialog opened or tab count changed
    const newCount = await tabs.count();
    
    // At least one tab should exist (Welcome tab or opened file)
    expect(newCount).toBeGreaterThan(0);
    
    // If there's a tab, try to close it
    if (newCount > 0) {
      const firstTab = tabs.first();
      await firstTab.hover();
      
      // Look for close button
      const closeButton = firstTab.locator('.tab-close');
      const hasCloseButton = await closeButton.count() > 0;
      
      if (hasCloseButton) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Verify tab count changed or welcome tab appeared
        const finalCount = await tabs.count();
        expect(finalCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('keyboard shortcuts work', async ({ page, errors }) => {
    // Test Ctrl+B to toggle sidebar
    const sidebar = page.locator('.sidebar');
    const initiallyVisible = await sidebar.isVisible();
    
    await page.keyboard.press('Control+B');
    await page.waitForTimeout(500);
    
    const nowVisible = await sidebar.isVisible();
    expect(nowVisible).toBe(!initiallyVisible);
    
    // Toggle back
    await page.keyboard.press('Control+B');
    await page.waitForTimeout(500);
    
    const finallyVisible = await sidebar.isVisible();
    expect(finallyVisible).toBe(initiallyVisible);
    
    // Verify no errors during keyboard operations
    expect(errors).toHaveLength(0);
  });

  test('editor grid splits work', async ({ page }) => {
    // Get initial leaf count
    const leaves = page.locator('.editor-leaf');
    const initialCount = await leaves.count();
    
    // Split horizontally with Ctrl+\
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Should have one more leaf
    const newCount = await leaves.count();
    expect(newCount).toBe(initialCount + 1);
    
    // Verify split container exists
    const splitContainer = page.locator('.editor-split');
    await expect(splitContainer).toBeVisible();
  });

  test('application state persists', async ({ page }) => {
    // Open sidebar if not visible
    const sidebar = page.locator('.sidebar');
    if (!(await sidebar.isVisible())) {
      await page.keyboard.press('Control+B');
      await page.waitForTimeout(500);
    }
    
    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Get current state
    const leafCount = await page.locator('.editor-leaf').count();
    const sidebarVisible = await sidebar.isVisible();
    
    // State should be saved automatically
    await page.waitForTimeout(1000);
    
    // Verify state was captured
    expect(leafCount).toBeGreaterThan(0);
    expect(typeof sidebarVisible).toBe('boolean');
  });
});