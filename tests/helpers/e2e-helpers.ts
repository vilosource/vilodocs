import { Page } from '@playwright/test';
import * as path from 'path';

export async function ensureAPIAvailable(page: Page) {
  // Check if window.api exists, if not inject mock
  const hasAPI = await page.evaluate(() => typeof window.api !== 'undefined');
  
  if (!hasAPI) {
    console.log('API not available, injecting mock...');
    await page.evaluate(() => {
      window.api = {
        // File operations
        ping: async (msg: string) => `pong:${msg}`,
        openFile: async () => null,
        saveFile: async (data: any) => null,
        readDirectory: async (path: string) => [],
        createFile: async (path: string, content: string) => { return; },
        createDirectory: async (path: string) => { return; },
        deletePath: async (path: string) => { return; },
        renamePath: async (oldPath: string, newPath: string) => { return; },
        getFileStats: async (path: string) => ({
          size: 0,
          created: new Date(),
          modified: new Date(),
          isFile: true,
          isDirectory: false
        }),
        readFileContent: async (path: string) => '',
        writeFileContent: async (path: string, content: string) => { return; },
        
        // File watching
        watchPath: async (path: string) => 'mock-watch-id',
        unwatchPath: async (watchId: string) => { return; },
        onFileChange: (cb: (event: any) => void) => () => { return; },
        
        // Workspace operations
        openFolder: async () => null,
        openWorkspace: async () => null,
        saveWorkspace: async (workspace: any) => null,
        getRecentWorkspaces: async () => [],
        loadWorkspaceFile: async (wsPath: string) => {
          // For E2E tests, return appropriate mock data based on the workspace file name
          const fileName = wsPath.split('/').pop() || '';
          const basePath = '/home/kuja/GitHub/vilodocs';
          
          if (fileName.includes('single')) {
            return {
              type: 'single',
              folders: [
                { id: 'folder-0', path: `${basePath}/src`, name: 'Source' }
              ],
              name: 'Single Folder'
            };
          } else if (fileName.includes('multi')) {
            const folders = [
              { id: 'folder-0', path: `${basePath}/src`, name: fileName.includes('multi2') ? 'Source' : 'Source Code' },
              { id: 'folder-1', path: `${basePath}/tests`, name: fileName.includes('multi2') ? 'Tests' : 'Test Files' }
            ];
            if (fileName.includes('multi2')) {
              // Don't add third folder for multi2
            } else if (!fileName.includes('single')) {
              folders.push({ id: 'folder-2', path: `${basePath}/docs`, name: 'Documentation' });
            }
            return {
              type: 'multi',
              folders: folders,
              name: fileName.includes('multi2') ? 'Multi Folder' : 'Multi-Root Test'
            };
          } else {
            // Default workspace for test-basic
            return {
              type: 'multi',
              folders: [
                { id: 'folder-0', path: `${basePath}/src`, name: 'Source' },
                { id: 'folder-1', path: `${basePath}/tests`, name: 'Tests' }
              ],
              name: 'Basic Test Workspace'
            };
          }
        },
        addFolderToWorkspace: async (workspace: any) => workspace,
        removeFolderFromWorkspace: async (workspace: any, folderId: string) => workspace,
        saveWorkspaceAs: async (workspace: any) => null,
        checkWorkspaceBeforeClose: async () => true,
        showSavePrompt: async (name: string) => 'discard',
        
        // Command palette
        searchFiles: async (path: string, query: string) => [],
        getWorkspaceFiles: async (path: string, limit: number) => [],
        getRecentFiles: async () => [],
        openFileFromPalette: async (path: string) => null,
        
        // State management
        loadState: async () => ({
          version: 1,
          workspace: { current: null, recent: [] },
          layout: {
            activityBar: { visible: true, width: 48 },
            sidebar: { visible: true, width: 240, activeView: 'explorer' },
            panel: { visible: false, height: 200, activeView: 'terminal' },
            statusBar: { visible: true },
            editorGrid: null,
            lastFocused: { region: 'editor', leafId: null }
          },
          widgets: {},
          preferences: { theme: 'light' }
        }),
        saveState: async (state: any) => { return; },
        updateState: async (action: any) => { return; },
        onStateChanged: (cb: (state: any) => void) => () => { return; },
        
        // Widget management
        registerWidget: async (widget: any) => { return; },
        updateWidgetState: async (widgetId: string, state: any) => { return; },
        getWidgetState: async (widgetId: string) => null,
        
        // Theme
        onThemeChanged: (cb: (theme: string) => void) => () => { return; }
      };
      console.log('Mock API injected in test');
    });
  }
  
  return hasAPI;
}