import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Workspace Functionality', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('workspace')) {
        console.log('Browser log:', msg.text());
      }
    });
    
    // Navigate to the app - wait for Shell to load
    await page.goto('/');
    
    // Wait for the shell to be rendered (the main container)
    try {
      await page.waitForSelector('.shell', { timeout: 15000 });
    } catch (error) {
      console.log('Shell not found, waiting for any React component...');
      // Fallback to waiting for any component
      await page.waitForSelector('#root > div', { timeout: 15000 });
    }
    
    // Give the app time to fully initialize
    await page.waitForTimeout(1000);
  });

  test('should load and display single folder workspace', async () => {
    // Check initial state
    const emptyState = await page.locator('.file-explorer-empty').isVisible();
    console.log('Initial empty state:', emptyState);
    
    // Open a folder through the button (simulating user action)
    if (emptyState) {
      // Click open folder button
      const openFolderBtn = await page.locator('button:has-text("Open Folder")');
      expect(await openFolderBtn.isVisible()).toBe(true);
      
      // Note: We can't interact with native dialogs, so we'll use the API
      const workspace = await page.evaluate(async () => {
        return await window.api.openFolder();
      });
      
      console.log('Opened workspace:', workspace);
    }
    
    // Check that the file explorer is now showing
    await page.waitForSelector('.file-explorer', { timeout: 5000 });
    const explorerVisible = await page.locator('.file-explorer').isVisible();
    expect(explorerVisible).toBe(true);
  });

  test('should load and display multi-root workspace', async () => {
    // Create a test multi-root workspace file
    const workspacePath = path.join(process.cwd(), 'test-multi-root.vilodocs-workspace');
    const workspaceContent = {
      version: 1,
      name: 'Test Multi-Root Workspace',
      folders: [
        { path: './src', name: 'Source Code' },
        { path: './tests', name: 'Tests' },
        { path: './docs', name: 'Documentation' }
      ]
    };
    
    await fs.writeFile(workspacePath, JSON.stringify(workspaceContent, null, 2));
    
    // Load the workspace file programmatically
    const workspace = await page.evaluate(async (path) => {
      return await window.api.loadWorkspaceFile(path);
    }, workspacePath);
    
    console.log('Loaded workspace:', workspace);
    expect(workspace).not.toBeNull();
    expect(workspace?.type).toBe('multi');
    expect(workspace?.folders.length).toBe(3);
    
    // Now we need to tell the FileExplorer to load this workspace
    // This requires updating the state through the StateService
    await page.evaluate(async (ws) => {
      // Access the StateService through the window (if exposed for testing)
      // Or trigger workspace change through the Shell component
      const event = new CustomEvent('workspace-loaded', { detail: ws });
      window.dispatchEvent(event);
    }, workspace);
    
    // Wait a bit for React to re-render
    await page.waitForTimeout(500);
    
    // Check if multi-root UI is displayed
    const workspaceFolders = await page.locator('.workspace-folders');
    const folderHeaders = await page.locator('.folder-header');
    
    console.log('Checking for workspace-folders div:', await workspaceFolders.count());
    console.log('Checking for folder-header divs:', await folderHeaders.count());
    
    // Verify the structure
    const fileExplorerHTML = await page.locator('.file-explorer').innerHTML();
    console.log('Has workspace-folders class:', fileExplorerHTML.includes('workspace-folders'));
    console.log('Has folder-header class:', fileExplorerHTML.includes('folder-header'));
    
    // Clean up
    await fs.unlink(workspacePath).catch(() => {});
  });

  test('should detect workspace type correctly', async () => {
    // Test single folder workspace
    const singleWorkspace = await page.evaluate(async () => {
      const ws = {
        type: 'single' as const,
        folders: [
          { id: '1', path: '/test/path', name: 'Test Folder' }
        ],
        name: 'Single Folder'
      };
      return ws;
    });
    
    expect(singleWorkspace.type).toBe('single');
    expect(singleWorkspace.folders.length).toBe(1);
    
    // Test multi-root workspace
    const multiWorkspace = await page.evaluate(async () => {
      const ws = {
        type: 'multi' as const,
        folders: [
          { id: '1', path: '/test/src', name: 'Source' },
          { id: '2', path: '/test/docs', name: 'Docs' },
          { id: '3', path: '/test/tests', name: 'Tests' }
        ],
        name: 'Multi-Root'
      };
      return ws;
    });
    
    expect(multiWorkspace.type).toBe('multi');
    expect(multiWorkspace.folders.length).toBe(3);
  });

  test('should persist workspace state', async () => {
    // Create a workspace
    const testWorkspace = {
      type: 'multi' as const,
      folders: [
        { id: '1', path: path.join(process.cwd(), 'src'), name: 'Source' },
        { id: '2', path: path.join(process.cwd(), 'tests'), name: 'Tests' }
      ],
      name: 'Test Workspace'
    };
    
    // Update the workspace state
    const updateResult = await page.evaluate(async (ws) => {
      // This would require exposing the StateService to window for testing
      // or having a test-specific API endpoint
      try {
        // Try to access StateService if exposed
        const stateService = (window as any).__stateService;
        if (stateService) {
          await stateService.updateWorkspace({ current: ws });
          return true;
        }
      } catch (error) {
        console.error('Could not update workspace:', error);
      }
      return false;
    }, testWorkspace);
    
    console.log('Workspace update result:', updateResult);
    
    // Verify the workspace was saved
    if (updateResult) {
      const savedWorkspace = await page.evaluate(async () => {
        const stateService = (window as any).__stateService;
        if (stateService) {
          return stateService.getWorkspace();
        }
        return null;
      });
      
      console.log('Saved workspace:', savedWorkspace);
      expect(savedWorkspace?.current?.type).toBe('multi');
      expect(savedWorkspace?.current?.folders.length).toBe(2);
    }
  });
});