import { test, expect } from './fixtures/electronTest';

test.describe('Simple E2E Test', () => {
  test('app launches and root is visible', async ({ page }) => {
    // Just check the app launched
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    console.log('✅ App launched successfully!');
  });
  
  test('editor grid exists', async ({ page }) => {
    const editorGrid = page.locator('.editor-grid');
    const exists = await editorGrid.count() > 0;
    
    expect(exists).toBe(true);
    console.log('✅ Editor grid found!');
  });
});