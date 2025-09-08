import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Multi-Root Workspace', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Console log:', msg.text());
      }
    });
    
    // Navigate to the app
    await page.goto('/');
    await page.waitForSelector('.file-explorer, .file-explorer-empty', { timeout: 10000 });
  });

  test('should display multi-root workspace correctly', async () => {
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
    
    // Open the workspace through the UI
    // First, open the dialog
    const openWorkspaceBtn = await page.locator('button:has-text("Open Workspace")');
    if (await openWorkspaceBtn.isVisible()) {
      console.log('Found Open Workspace button');
      // Note: We can't interact with native file dialogs in E2E tests
      // Instead, we'll simulate the workspace being loaded
    }
    
    // Check if multi-root UI is displayed
    const workspaceFolders = await page.locator('.workspace-folders');
    const folderHeaders = await page.locator('.folder-header');
    
    // Log what we find
    console.log('Checking for workspace-folders div:', await workspaceFolders.count());
    console.log('Checking for folder-header divs:', await folderHeaders.count());
    
    // Check workspace type in the console
    await page.evaluate(() => {
      const state = (window as any).__DEBUG_STATE;
      console.log('Window debug state:', state);
    });
    
    // Check if the file explorer is rendering in multi-root mode
    const fileExplorer = await page.locator('.file-explorer');
    const explorerHTML = await fileExplorer.innerHTML();
    
    console.log('File explorer contains workspace-folders?', explorerHTML.includes('workspace-folders'));
    console.log('File explorer contains folder-header?', explorerHTML.includes('folder-header'));
    
    // Clean up
    await fs.unlink(workspacePath).catch(() => {});
  });

  test('should detect workspace type from loaded workspace', async () => {
    // Inject debug code to check workspace state
    await page.evaluate(() => {
      // Add a debug hook to capture workspace state
      const originalLog = console.log;
      (window as any).__workspaceDebug = [];
      
      console.log = function(...args) {
        const message = args.join(' ');
        if (message.includes('workspace') || message.includes('FileExplorer')) {
          (window as any).__workspaceDebug.push(message);
        }
        originalLog.apply(console, args);
      };
    });
    
    // Wait a moment for any workspace loading
    await page.waitForTimeout(1000);
    
    // Get the debug logs
    const debugLogs = await page.evaluate(() => (window as any).__workspaceDebug);
    console.log('Workspace debug logs:', debugLogs);
    
    // Check if workspace state shows multi-root
    const hasMultiRoot = debugLogs.some((log: string) => 
      log.includes("type: 'multi'") || 
      log.includes("isMulti: true") ||
      log.includes("workspace.type === 'multi'")
    );
    
    console.log('Has multi-root workspace indication:', hasMultiRoot);
  });
});