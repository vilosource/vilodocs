import { test, expect } from './fixtures/electronTest';

test.describe('vilodocs Panes Integration', () => {
  test.beforeEach(async ({ resetApp }) => {
    await resetApp();
  });

  test('app launches without errors', async ({ page, errors }) => {
    await page.waitForLoadState('networkidle');
    
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    expect(errors).toHaveLength(0);
  });

  test('panes UI is loaded', async ({ page }) => {
    const editorGrid = page.locator('.editor-grid');
    await expect(editorGrid).toBeVisible();
    
    const editorLeaf = page.locator('.editor-leaf').first();
    await expect(editorLeaf).toBeVisible();
  });

  test('activity bar provides navigation', async ({ page }) => {
    const activityBar = page.locator('.activity-bar');
    await expect(activityBar).toBeVisible();
    
    const explorerButton = page.locator('.activity-bar-item[data-item="explorer"]');
    await expect(explorerButton).toBeVisible();
  });

  test('panes can be split', async ({ page }) => {
    const leaves = page.locator('.editor-leaf');
    const initialCount = await leaves.count();
    
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    const newCount = await leaves.count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('tabs system works', async ({ page }) => {
    const tabs = page.locator('.tab');
    const tabCount = await tabs.count();
    
    expect(tabCount).toBeGreaterThan(0);
    
    if (tabCount > 0) {
      const firstTab = tabs.first();
      await expect(firstTab).toBeVisible();
    }
  });
});
