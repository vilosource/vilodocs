import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Channels } from './common/ipc';
import { registerFileSystemHandlers, cleanupFileWatchers } from './main/fileSystemHandlers';
import { initializeStateManager, getStateManager } from './main/stateManager';

const isE2E = process.env.E2E === '1';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    sendTheme(mainWindow!);
  });

  nativeTheme.on('updated', () => {
    for (const w of BrowserWindow.getAllWindows()) sendTheme(w);
  });

  // In E2E mode, add a data attribute to help with testing
  if (isE2E) {
    mainWindow.webContents.executeJavaScript(`
      document.documentElement.setAttribute('data-e2e', 'true');
    `);
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