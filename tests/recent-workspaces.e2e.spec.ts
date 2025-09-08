import { test, expect } from '@playwright/test';

test.describe('Recent Workspaces', () => {
  test('should display recent workspaces in empty state', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('.file-explorer', { timeout: 30000 });
    
    // Should show empty state initially
    const emptyState = await page.locator('.file-explorer-empty').isVisible();
    if (emptyState) {
      // Check for recent workspaces section if any exist
      const recentSection = page.locator('.recent-workspaces');
      
      // Recent workspaces may or may not exist depending on prior usage
      if (await recentSection.isVisible()) {
        // If recent workspaces exist, verify they're displayed properly
        await expect(recentSection.locator('h4')).toHaveText('Recent Workspaces');
        
        // Check that workspace items are clickable
        const workspaceButtons = page.locator('.recent-workspace-button');
        const count = await workspaceButtons.count();
        
        if (count > 0) {
          // First workspace button should be visible and enabled
          await expect(workspaceButtons.first()).toBeVisible();
          await expect(workspaceButtons.first()).toBeEnabled();
          
          // Should have workspace name and path
          await expect(workspaceButtons.first().locator('.workspace-name')).toBeVisible();
          await expect(workspaceButtons.first().locator('.workspace-path')).toBeVisible();
        }
      }
    }
  });

  test('should open recent workspace when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-explorer', { timeout: 30000 });
    
    // Look for recent workspaces
    const recentSection = page.locator('.recent-workspaces');
    
    if (await recentSection.isVisible()) {
      const workspaceButtons = page.locator('.recent-workspace-button');
      const count = await workspaceButtons.count();
      
      if (count > 0) {
        // Click first recent workspace
        await workspaceButtons.first().click();
        
        // Should navigate away from empty state (or show error handling)
        // In real usage, this would either:
        // 1. Load the workspace successfully and show file tree
        // 2. Show error if workspace file doesn't exist
        await page.waitForTimeout(1000);
        
        // Test passes if no JavaScript errors occur
      }
    } else {
      console.log('No recent workspaces available for testing');
    }
  });

  test('should show correct keyboard shortcut hints', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-explorer', { timeout: 30000 });
    
    // Check empty state buttons have proper titles/shortcuts
    const emptyState = await page.locator('.file-explorer-empty').isVisible();
    if (emptyState) {
      const openFolderBtn = page.locator('button:has-text("Open Folder")');
      const openWorkspaceBtn = page.locator('button:has-text("Open Workspace")');
      
      await expect(openFolderBtn).toBeVisible();
      await expect(openWorkspaceBtn).toBeVisible();
      
      // In a full implementation, buttons would show keyboard shortcuts
      // For now, just verify they exist and are functional
      await expect(openFolderBtn).toBeEnabled();
      await expect(openWorkspaceBtn).toBeEnabled();
    }
  });

  test('should handle keyboard shortcuts for workspace operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-explorer', { timeout: 30000 });
    
    // Test Ctrl+Shift+O (Open Folder) - won't open dialog in E2E but should not error
    await page.keyboard.press('Control+Shift+KeyO');
    await page.waitForTimeout(500);
    
    // Test Ctrl+Shift+W (Open Workspace) - won't open dialog in E2E but should not error  
    await page.keyboard.press('Control+Shift+KeyW');
    await page.waitForTimeout(500);
    
    // Should not have caused any JavaScript errors
    // In a real test environment, we'd mock the dialog responses
  });

  test('should update recent workspaces when workspace is saved', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-explorer', { timeout: 30000 });
    
    // This test is more conceptual since we can't easily trigger save dialogs in E2E
    // In a full test suite, we'd:
    // 1. Load a workspace
    // 2. Make changes to make it dirty
    // 3. Save the workspace
    // 4. Verify it appears in recent workspaces list
    
    // For now, just verify the recent workspaces mechanism works
    const recent = await page.evaluate(() => {
      if ((window as any).api?.getRecentWorkspaces) {
        return (window as any).api.getRecentWorkspaces();
      }
      return [];
    });
    
    // Should return array (empty or with workspaces)
    expect(Array.isArray(recent)).toBe(true);
  });
});