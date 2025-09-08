import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Basic Workspace Tests', () => {
  test('app should load and show file explorer', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to be ready - be more flexible with selectors
    const appLoaded = await page.waitForSelector('#root', { timeout: 30000 });
    expect(appLoaded).toBeTruthy();
    
    // Log what we see on the page
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body has content:', bodyContent.length > 100);
    
    // Check if we have either empty state or file explorer
    const hasFileExplorer = await page.locator('.file-explorer').count();
    const hasEmptyState = await page.locator('.file-explorer-empty').count();
    
    console.log('Has file explorer:', hasFileExplorer);
    console.log('Has empty state:', hasEmptyState);
    
    // At least one should be present
    expect(hasFileExplorer + hasEmptyState).toBeGreaterThan(0);
  });

  test('should load workspace file programmatically', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 30000 });
    
    // Create test workspace file
    const workspacePath = path.join(process.cwd(), 'test-basic.vilodocs-workspace');
    const workspaceContent = {
      version: 1,
      name: 'Basic Test Workspace',
      folders: [
        { path: './src', name: 'Source' },
        { path: './tests', name: 'Tests' }
      ]
    };
    
    await fs.writeFile(workspacePath, JSON.stringify(workspaceContent, null, 2));
    
    // Load workspace using our API
    const result = await page.evaluate(async (wsPath) => {
      try {
        const workspace = await window.api.loadWorkspaceFile(wsPath);
        return { success: true, workspace };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, workspacePath);
    
    console.log('Load workspace result:', result);
    
    expect(result.success).toBe(true);
    expect(result.workspace).toBeTruthy();
    expect(result.workspace.type).toBe('multi');
    expect(result.workspace.folders.length).toBe(2);
    
    // Clean up
    await fs.unlink(workspacePath).catch(() => {});
  });

  test('should verify multi-root workspace structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 30000 });
    
    // Create and load a multi-root workspace
    const workspacePath = path.join(process.cwd(), 'test-multi.vilodocs-workspace');
    const workspaceContent = {
      version: 1,
      name: 'Multi-Root Test',
      folders: [
        { path: './src', name: 'Source Code' },
        { path: './tests', name: 'Test Files' },
        { path: './docs', name: 'Documentation' }
      ]
    };
    
    await fs.writeFile(workspacePath, JSON.stringify(workspaceContent, null, 2));
    
    // Load the workspace
    const workspace = await page.evaluate(async (wsPath) => {
      return await window.api.loadWorkspaceFile(wsPath);
    }, workspacePath);
    
    // Verify the workspace structure
    expect(workspace).toBeTruthy();
    expect(workspace.type).toBe('multi');
    expect(workspace.name).toBe('Multi-Root Test');
    expect(workspace.folders).toHaveLength(3);
    
    // Verify each folder
    expect(workspace.folders[0].name).toBe('Source Code');
    expect(workspace.folders[1].name).toBe('Test Files');
    expect(workspace.folders[2].name).toBe('Documentation');
    
    // Each folder should have an absolute path
    workspace.folders.forEach(folder => {
      expect(path.isAbsolute(folder.path)).toBe(true);
      expect(folder.id).toBeTruthy();
    });
    
    // Clean up
    await fs.unlink(workspacePath).catch(() => {});
  });

  test('should distinguish between single and multi-root workspaces', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 30000 });
    
    // Test single folder workspace
    const singlePath = path.join(process.cwd(), 'test-single.vilodocs-workspace');
    await fs.writeFile(singlePath, JSON.stringify({
      version: 1,
      name: 'Single Folder',
      folders: [{ path: './src', name: 'Source' }]
    }));
    
    const singleWorkspace = await page.evaluate(async (wsPath) => {
      return await window.api.loadWorkspaceFile(wsPath);
    }, singlePath);
    
    expect(singleWorkspace.type).toBe('single');
    expect(singleWorkspace.folders).toHaveLength(1);
    
    // Test multi-root workspace
    const multiPath = path.join(process.cwd(), 'test-multi2.vilodocs-workspace');
    await fs.writeFile(multiPath, JSON.stringify({
      version: 1,
      name: 'Multi Folder',
      folders: [
        { path: './src', name: 'Source' },
        { path: './tests', name: 'Tests' }
      ]
    }));
    
    const multiWorkspace = await page.evaluate(async (wsPath) => {
      return await window.api.loadWorkspaceFile(wsPath);
    }, multiPath);
    
    expect(multiWorkspace.type).toBe('multi');
    expect(multiWorkspace.folders).toHaveLength(2);
    
    // Clean up
    await fs.unlink(singlePath).catch(() => {});
    await fs.unlink(multiPath).catch(() => {});
  });
});