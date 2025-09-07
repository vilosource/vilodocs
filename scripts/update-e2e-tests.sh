#!/bin/bash

# Update integration.e2e.spec.ts
cat > tests/integration.e2e.spec.ts << 'EOF'
import { test, expect } from './fixtures/electronTest';

test.describe('Critical Integration Tests', () => {
  test.beforeEach(async ({ resetApp }) => {
    await resetApp();
  });

  test('app loads without JavaScript errors', async ({ page, errors }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    expect(errors, `Errors found: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('React app initializes successfully', async ({ page }) => {
    const rootElement = await page.$('#root');
    expect(rootElement).toBeTruthy();
    
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root._reactRootContainer ? 'React 17' : 
             root && root._reactRootContainer ? 'React 18' : 
             root && root.children.length > 0 ? 'React rendered' : null;
    });
    
    expect(reactRoot).toBeTruthy();
  });

  test('main components render without errors', async ({ page, errors }) => {
    const shell = await page.$('.shell');
    expect(shell).toBeTruthy();
    
    const editorGrid = await page.$('.editor-grid');
    expect(editorGrid).toBeTruthy();
    
    expect(errors).toHaveLength(0);
  });

  test('critical imports resolve correctly', async ({ page }) => {
    const hasReact = await page.evaluate(() => typeof window.React !== 'undefined');
    const hasAPI = await page.evaluate(() => typeof window.api !== 'undefined');
    
    expect(hasAPI).toBe(true);
  });

  test('no unhandled promise rejections', async ({ page }) => {
    const rejections: string[] = [];
    
    page.on('pageerror', (error) => {
      if (error.message.includes('Unhandled Promise Rejection')) {
        rejections.push(error.message);
      }
    });
    
    await page.waitForTimeout(3000);
    
    expect(rejections).toHaveLength(0);
  });

  test('IPC communication works', async ({ page }) => {
    const ipcWorks = await page.evaluate(async () => {
      if (window.api && window.api.getState) {
        try {
          const state = await window.api.getState();
          return state !== undefined;
        } catch {
          return false;
        }
      }
      return false;
    });
    
    expect(ipcWorks).toBe(true);
  });
});
EOF

# Update app-panes.e2e.spec.ts
cat > tests/app-panes.e2e.spec.ts << 'EOF'
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
EOF

echo "✅ E2E test files updated successfully"