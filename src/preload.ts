import { contextBridge, ipcRenderer } from 'electron';
import { Channels, type RendererApis, type Theme, type FileChangeEvent } from './common/ipc';
import { ApplicationState } from './common/state-types';

const api: RendererApis = {
  ping: (msg) => ipcRenderer.invoke(Channels.Ping, msg),

  onThemeChanged: (cb) => {
    const listener = (_e: unknown, t: Theme) => cb(t);
    ipcRenderer.on(Channels.SystemThemeChanged, listener);
    return () => ipcRenderer.removeListener(Channels.SystemThemeChanged, listener);
  },

  openFile: () => ipcRenderer.invoke(Channels.OpenFile),
  saveFile: (data) => ipcRenderer.invoke(Channels.SaveFile, data),
  
  // File system operations
  readDirectory: (path) => ipcRenderer.invoke(Channels.ReadDirectory, path),
  createFile: (path, content) => ipcRenderer.invoke(Channels.CreateFile, path, content),
  createDirectory: (path) => ipcRenderer.invoke(Channels.CreateDirectory, path),
  deletePath: (path) => ipcRenderer.invoke(Channels.DeletePath, path),
  renamePath: (oldPath, newPath) => ipcRenderer.invoke(Channels.RenamePath, oldPath, newPath),
  getFileStats: (path) => ipcRenderer.invoke(Channels.GetFileStats, path),
  readFileContent: (path) => ipcRenderer.invoke(Channels.ReadFileContent, path),
  writeFileContent: (path, content) => ipcRenderer.invoke(Channels.WriteFileContent, path, content),
  
  // File watching
  watchPath: (path) => ipcRenderer.invoke(Channels.WatchPath, path),
  unwatchPath: (watchId) => ipcRenderer.invoke(Channels.UnwatchPath, watchId),
  onFileChange: (cb) => {
    const listener = (_e: unknown, event: FileChangeEvent) => cb(event);
    ipcRenderer.on(Channels.FileChanged, listener);
    return () => ipcRenderer.removeListener(Channels.FileChanged, listener);
  },
  
  // Workspace operations
  openFolder: () => ipcRenderer.invoke(Channels.OpenFolder),
  openWorkspace: () => ipcRenderer.invoke(Channels.OpenWorkspace),
  saveWorkspace: (workspace) => ipcRenderer.invoke(Channels.SaveWorkspace, workspace),
  getRecentWorkspaces: () => ipcRenderer.invoke(Channels.GetRecentWorkspaces),
  
  // Command palette file operations
  searchFiles: (workspacePath, query) => ipcRenderer.invoke(Channels.SearchFiles, workspacePath, query),
  getWorkspaceFiles: (workspacePath, limit) => ipcRenderer.invoke(Channels.GetWorkspaceFiles, workspacePath, limit),
  getRecentFiles: () => ipcRenderer.invoke(Channels.GetRecentFiles),
  openFileFromPalette: (filePath) => ipcRenderer.invoke(Channels.OpenFileFromPalette, filePath),
  
  // State management
  loadState: () => ipcRenderer.invoke(Channels.LoadState),
  saveState: (state) => ipcRenderer.invoke(Channels.SaveState, state),
  updateState: (action) => ipcRenderer.invoke(Channels.UpdateState, action),
  onStateChanged: (cb) => {
    const listener = (_e: unknown, state: ApplicationState) => cb(state);
    ipcRenderer.on(Channels.StateChanged, listener);
    return () => ipcRenderer.removeListener(Channels.StateChanged, listener);
  },
  
  // Widget management
  registerWidget: (widget) => ipcRenderer.invoke(Channels.RegisterWidget, widget),
  updateWidgetState: (widgetId, state) => ipcRenderer.invoke(Channels.UpdateWidgetState, widgetId, state),
  getWidgetState: (widgetId) => ipcRenderer.invoke(Channels.GetWidgetState, widgetId),
};

contextBridge.exposeInMainWorld('api', api);