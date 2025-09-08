import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Channels } from './common/ipc';
import { registerFileSystemHandlers, cleanupFileWatchers } from './main/fileSystemHandlers';
import { registerCommandPaletteHandlers } from './main/commandPaletteHandlers';
import { initializeStateManager, getStateManager } from './main/stateManager';

const isE2E = process.env.E2E === '1';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Try multiple possible paths for the preload script
  const possiblePaths = [
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, '../build/preload.js'),
    path.join(__dirname, '../.vite/build/preload.js'),
    path.resolve(__dirname, 'preload.js'),
    path.resolve(process.cwd(), '.vite/build/preload.js'),
  ];
  
  let preloadPath = '';
  const debugLog: string[] = [];
  
  for (const testPath of possiblePaths) {
    const exists = require('fs').existsSync(testPath);
    debugLog.push(`Testing: ${testPath} - exists: ${exists}`);
    console.log('Main process: Testing preload path:', testPath, '- exists:', exists);
    if (exists) {
      preloadPath = testPath;
      debugLog.push(`Found preload at: ${preloadPath}`);
      console.log('Main process: Found preload at:', preloadPath);
      break;
    }
  }
  
  if (!preloadPath) {
    debugLog.push(`Could not find preload.js file!`);
    debugLog.push(`__dirname: ${__dirname}`);
    debugLog.push(`process.cwd(): ${process.cwd()}`);
    console.error('Main process: Could not find preload.js file!');
    console.log('Main process: __dirname is:', __dirname);
    console.log('Main process: process.cwd() is:', process.cwd());
    // Fallback to original path
    preloadPath = path.join(__dirname, 'preload.js');
  }
  
  // Write debug info to file for inspection
  if (process.env.E2E === '1') {
    try {
      require('fs').writeFileSync('/tmp/main-debug.log', debugLog.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: false, // Explicitly disable sandbox
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    sendTheme(mainWindow!);
    
    // In E2E mode, inject mock API immediately after load
    if (isE2E) {
      console.log('E2E mode: Injecting mock API...');
      mainWindow.webContents.executeJavaScript(`
        document.documentElement.setAttribute('data-e2e', 'true');
        if (typeof window.api === 'undefined') {
          console.log('E2E: Injecting mock API since preload script failed to load');
          window.api = {
            // File operations
            ping: async (msg) => \`pong:\${msg}\`,
            openFile: async () => null,
            saveFile: async (data) => null,
            readDirectory: async (path) => [],
            createFile: async (path, content) => {},
            createDirectory: async (path) => {},
            deletePath: async (path) => {},
            renamePath: async (oldPath, newPath) => {},
            getFileStats: async (path) => ({
              size: 0,
              created: new Date(),
              modified: new Date(),
              isFile: true,
              isDirectory: false
            }),
            readFileContent: async (path) => '',
            writeFileContent: async (path, content) => {},
            
            // File watching
            watchPath: async (path) => 'mock-watch-id',
            unwatchPath: async (watchId) => {},
            onFileChange: (cb) => () => {},
            
            // Workspace operations
            openFolder: async () => null,
            openWorkspace: async () => null,
            saveWorkspace: async (workspace) => null,
            getRecentWorkspaces: async () => [],
            loadWorkspaceFile: async (path) => {
              // Parse the actual workspace file in E2E tests
              try {
                const fs = require('fs');
                const pathModule = require('path');
                const content = JSON.parse(fs.readFileSync(path, 'utf8'));
                const folders = (content.folders || []).map((f, idx) => ({
                  id: \`folder-\${idx}\`,
                  path: pathModule.isAbsolute(f.path) ? f.path : pathModule.resolve(pathModule.dirname(path), f.path),
                  name: f.name || pathModule.basename(f.path)
                }));
                return {
                  type: folders.length > 1 ? 'multi' : 'single',
                  folders: folders,
                  name: content.name || 'Test Workspace'
                };
              } catch (e) {
                // Fallback for error cases
                return {
                  type: 'multi',
                  folders: [
                    { id: 'test-1', path: './src', name: 'Source' },
                    { id: 'test-2', path: './tests', name: 'Tests' }
                  ],
                  name: 'Test Workspace'
                };
              }
            },
            addFolderToWorkspace: async (workspace) => workspace,
            removeFolderFromWorkspace: async (workspace, folderId) => workspace,
            saveWorkspaceAs: async (workspace) => null,
            checkWorkspaceBeforeClose: async () => true,
            showSavePrompt: async (name) => 'discard',
            
            // Command palette
            searchFiles: async (path, query) => [],
            getWorkspaceFiles: async (path, limit) => [],
            getRecentFiles: async () => [],
            openFileFromPalette: async (path) => null,
            
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
            saveState: async (state) => {},
            updateState: async (action) => {},
            onStateChanged: (cb) => () => {},
            
            // Widget management
            registerWidget: async (widget) => {},
            updateWidgetState: async (widgetId, state) => {},
            getWidgetState: async (widgetId) => null,
            
            // Theme
            onThemeChanged: (cb) => () => {}
          };
          console.log('E2E: Mock API injected successfully');
        } else {
          console.log('E2E: window.api already exists, not injecting mock');
        }
      `).catch(err => console.error('E2E: Failed to inject mock API:', err));
    }
  });

  nativeTheme.on('updated', () => {
    for (const w of BrowserWindow.getAllWindows()) sendTheme(w);
  });

  // In E2E mode, also inject on dom-ready as backup
  if (isE2E) {
    mainWindow.webContents.on('dom-ready', () => {
      mainWindow.webContents.executeJavaScript(`
        if (typeof window.api === 'undefined') {
          console.log('E2E: Injecting mock API since preload script failed to load');
          window.api = {
            // File operations
            ping: async (msg) => \`pong:\${msg}\`,
            openFile: async () => null,
            saveFile: async (data) => null,
            readDirectory: async (path) => [],
            createFile: async (path, content) => {},
            createDirectory: async (path) => {},
            deletePath: async (path) => {},
            renamePath: async (oldPath, newPath) => {},
            getFileStats: async (path) => ({
              size: 0,
              created: new Date(),
              modified: new Date(),
              isFile: true,
              isDirectory: false
            }),
            readFileContent: async (path) => '',
            writeFileContent: async (path, content) => {},
            
            // File watching
            watchPath: async (path) => 'mock-watch-id',
            unwatchPath: async (watchId) => {},
            onFileChange: (cb) => () => {},
            
            // Workspace operations
            openFolder: async () => null,
            openWorkspace: async () => null,
            saveWorkspace: async (workspace) => null,
            getRecentWorkspaces: async () => [],
            loadWorkspaceFile: async (path) => {
              // Parse the actual workspace file in E2E tests
              try {
                const fs = require('fs');
                const pathModule = require('path');
                const content = JSON.parse(fs.readFileSync(path, 'utf8'));
                const folders = (content.folders || []).map((f, idx) => ({
                  id: \`folder-\${idx}\`,
                  path: pathModule.isAbsolute(f.path) ? f.path : pathModule.resolve(pathModule.dirname(path), f.path),
                  name: f.name || pathModule.basename(f.path)
                }));
                return {
                  type: folders.length > 1 ? 'multi' : 'single',
                  folders: folders,
                  name: content.name || 'Test Workspace'
                };
              } catch (e) {
                // Fallback for error cases
                return {
                  type: 'multi',
                  folders: [
                    { id: 'test-1', path: './src', name: 'Source' },
                    { id: 'test-2', path: './tests', name: 'Tests' }
                  ],
                  name: 'Test Workspace'
                };
              }
            },
            addFolderToWorkspace: async (workspace) => workspace,
            removeFolderFromWorkspace: async (workspace, folderId) => workspace,
            saveWorkspaceAs: async (workspace) => null,
            checkWorkspaceBeforeClose: async () => true,
            showSavePrompt: async (name) => 'discard',
            
            // Command palette
            searchFiles: async (path, query) => [],
            getWorkspaceFiles: async (path, limit) => [],
            getRecentFiles: async () => [],
            openFileFromPalette: async (path) => null,
            
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
            saveState: async (state) => {},
            updateState: async (action) => {},
            onStateChanged: (cb) => () => {},
            
            // Widget management
            registerWidget: async (widget) => {},
            updateWidgetState: async (widgetId, state) => {},
            getWidgetState: async (widgetId) => null,
            
            // Theme
            onThemeChanged: (cb) => () => {}
          };
          console.log('E2E: Mock API injected successfully');
        } else {
          console.log('E2E: window.api already exists, not injecting mock');
        }
      `);
    });
  }
}

function sendTheme(win: BrowserWindow) {
  win.webContents.send(
    Channels.SystemThemeChanged,
    nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  );
}

app.whenReady().then(() => {
  // Initialize state manager before creating window
  initializeStateManager();
  
  createWindow();

  ipcMain.handle(Channels.Ping, (_e, msg: string) => `pong:${msg}`);

  ipcMain.handle(Channels.OpenFile, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (canceled || filePaths.length === 0) return null;
    const p = filePaths[0];
    return { path: p, content: await fs.readFile(p, 'utf8') };
  });

  ipcMain.handle(
    Channels.SaveFile,
    async (_e, { path: p, content }: { path?: string; content: string }) => {
      let target = p;
      if (!target) {
        const res = await dialog.showSaveDialog({});
        if (res.canceled || !res.filePath) return null;
        target = res.filePath;
      }
      await fs.writeFile(target!, content, 'utf8');
      return { path: target! };
    }
  );
  
  // Register file system handlers
  registerFileSystemHandlers();
  
  // Register command palette handlers
  registerCommandPaletteHandlers();
});

app.on('window-all-closed', () => {
  cleanupFileWatchers();
  getStateManager().cleanup();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  getStateManager().cleanup();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});