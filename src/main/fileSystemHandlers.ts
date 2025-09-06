import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { watch } from 'chokidar';
import { Channels, type FileNode, type FileStats, type Workspace, type WorkspaceFolder } from '../common/ipc';
import { v4 as uuidv4 } from 'uuid';

// Store active file watchers
const fileWatchers = new Map<string, any>();

// Recent workspaces storage
const RECENT_WORKSPACES_KEY = 'recentWorkspaces';
const MAX_RECENT_WORKSPACES = 10;

/**
 * Validates that a path is safe to access
 */
function validatePath(filePath: string): void {
  // Prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new Error('Invalid path: directory traversal detected');
  }
}

/**
 * Creates a FileNode from a file system path
 */
async function createFileNode(filePath: string): Promise<FileNode> {
  const stats = await fs.stat(filePath);
  const name = path.basename(filePath);
  
  return {
    id: uuidv4(),
    name,
    path: filePath,
    type: stats.isDirectory() ? 'directory' : 'file',
    size: stats.size,
    modified: stats.mtime,
  };
}

/**
 * Recursively reads a directory and returns FileNode tree
 */
async function readDirectoryRecursive(dirPath: string, depth = 0, maxDepth = 1): Promise<FileNode[]> {
  if (depth >= maxDepth) return [];
  
  const items = await fs.readdir(dirPath);
  const nodes: FileNode[] = [];
  
  for (const item of items) {
    // Skip hidden files and common ignore patterns
    if (item.startsWith('.') || item === 'node_modules') continue;
    
    const itemPath = path.join(dirPath, item);
    try {
      const node = await createFileNode(itemPath);
      
      if (node.type === 'directory' && depth < maxDepth - 1) {
        node.children = await readDirectoryRecursive(itemPath, depth + 1, maxDepth);
      }
      
      nodes.push(node);
    } catch (error) {
      // Skip files we can't access
      console.warn(`Cannot access ${itemPath}:`, error);
    }
  }
  
  // Sort: directories first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets recent workspaces from storage
 */
function getRecentWorkspaces(): string[] {
  try {
    const stored = global.localStorage?.getItem(RECENT_WORKSPACES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a workspace to recent list
 */
function addRecentWorkspace(workspacePath: string): void {
  const recent = getRecentWorkspaces();
  const filtered = recent.filter(p => p !== workspacePath);
  filtered.unshift(workspacePath);
  const trimmed = filtered.slice(0, MAX_RECENT_WORKSPACES);
  
  try {
    global.localStorage?.setItem(RECENT_WORKSPACES_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save recent workspaces:', error);
  }
}

/**
 * Register all file system IPC handlers
 */
export function registerFileSystemHandlers(): void {
  // Read directory
  ipcMain.handle(Channels.ReadDirectory, async (_, dirPath: string) => {
    validatePath(dirPath);
    return readDirectoryRecursive(dirPath);
  });
  
  // Create file
  ipcMain.handle(Channels.CreateFile, async (_, filePath: string, content = '') => {
    validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf8');
  });
  
  // Create directory
  ipcMain.handle(Channels.CreateDirectory, async (_, dirPath: string) => {
    validatePath(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
  });
  
  // Delete path (file or directory)
  ipcMain.handle(Channels.DeletePath, async (_, filePath: string) => {
    validatePath(filePath);
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
  });
  
  // Rename/move path
  ipcMain.handle(Channels.RenamePath, async (_, oldPath: string, newPath: string) => {
    validatePath(oldPath);
    validatePath(newPath);
    await fs.rename(oldPath, newPath);
  });
  
  // Get file stats
  ipcMain.handle(Channels.GetFileStats, async (_, filePath: string): Promise<FileStats> => {
    validatePath(filePath);
    const stats = await fs.stat(filePath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  });
  
  // Read file content
  ipcMain.handle(Channels.ReadFileContent, async (_, filePath: string) => {
    validatePath(filePath);
    return fs.readFile(filePath, 'utf8');
  });
  
  // Write file content
  ipcMain.handle(Channels.WriteFileContent, async (_, filePath: string, content: string) => {
    validatePath(filePath);
    await fs.writeFile(filePath, content, 'utf8');
  });
  
  // Watch path for changes
  ipcMain.handle(Channels.WatchPath, async (event, watchPath: string) => {
    validatePath(watchPath);
    const watchId = uuidv4();
    
    const watcher = watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 1,
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
    });
    
    const sender = event.sender;
    
    watcher
      .on('add', (filePath) => {
        if (!sender.isDestroyed()) {
          sender.send(Channels.FileCreated, { type: 'created', path: filePath });
        }
      })
      .on('change', (filePath) => {
        if (!sender.isDestroyed()) {
          sender.send(Channels.FileChanged, { type: 'modified', path: filePath });
        }
      })
      .on('unlink', (filePath) => {
        if (!sender.isDestroyed()) {
          sender.send(Channels.FileDeleted, { type: 'deleted', path: filePath });
        }
      })
      .on('addDir', (dirPath) => {
        if (!sender.isDestroyed()) {
          sender.send(Channels.FileCreated, { type: 'created', path: dirPath });
        }
      })
      .on('unlinkDir', (dirPath) => {
        if (!sender.isDestroyed()) {
          sender.send(Channels.FileDeleted, { type: 'deleted', path: dirPath });
        }
      });
    
    fileWatchers.set(watchId, watcher);
    return watchId;
  });
  
  // Stop watching path
  ipcMain.handle(Channels.UnwatchPath, async (_, watchId: string) => {
    const watcher = fileWatchers.get(watchId);
    if (watcher) {
      await watcher.close();
      fileWatchers.delete(watchId);
    }
  });
  
  // Open folder dialog
  ipcMain.handle(Channels.OpenFolder, async (): Promise<Workspace | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Open Folder',
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const folderPath = result.filePaths[0];
    const folderName = path.basename(folderPath);
    
    addRecentWorkspace(folderPath);
    
    return {
      type: 'single',
      folders: [{
        id: uuidv4(),
        path: folderPath,
        name: folderName,
      }],
      name: folderName,
    };
  });
  
  // Open workspace file
  ipcMain.handle(Channels.OpenWorkspace, async (): Promise<Workspace | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Open Workspace',
      filters: [
        { name: 'Workspace Files', extensions: ['vilodocs-workspace', 'code-workspace'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const workspacePath = result.filePaths[0];
    const workspaceContent = await fs.readFile(workspacePath, 'utf8');
    const workspaceData = JSON.parse(workspaceContent);
    
    addRecentWorkspace(workspacePath);
    
    // Convert relative paths to absolute
    const workspaceDir = path.dirname(workspacePath);
    const folders: WorkspaceFolder[] = workspaceData.folders.map((folder: any) => ({
      id: folder.id || uuidv4(),
      path: path.isAbsolute(folder.path) ? folder.path : path.join(workspaceDir, folder.path),
      name: folder.name || path.basename(folder.path),
    }));
    
    return {
      type: folders.length > 1 ? 'multi' : 'single',
      folders,
      name: workspaceData.name || path.basename(workspacePath, '.vilodocs-workspace'),
      path: workspacePath,
    };
  });
  
  // Save workspace
  ipcMain.handle(Channels.SaveWorkspace, async (_, workspace: Workspace): Promise<string | null> => {
    const result = await dialog.showSaveDialog({
      title: 'Save Workspace',
      defaultPath: `${workspace.name || 'workspace'}.vilodocs-workspace`,
      filters: [
        { name: 'Workspace Files', extensions: ['vilodocs-workspace'] },
      ],
    });
    
    if (result.canceled || !result.filePath) {
      return null;
    }
    
    const workspacePath = result.filePath;
    const workspaceDir = path.dirname(workspacePath);
    
    // Convert absolute paths to relative for portability
    const workspaceData = {
      version: 1,
      name: workspace.name,
      folders: workspace.folders.map(folder => ({
        id: folder.id,
        path: path.relative(workspaceDir, folder.path),
        name: folder.name,
      })),
    };
    
    await fs.writeFile(workspacePath, JSON.stringify(workspaceData, null, 2), 'utf8');
    addRecentWorkspace(workspacePath);
    
    return workspacePath;
  });
  
  // Get recent workspaces
  ipcMain.handle(Channels.GetRecentWorkspaces, async () => {
    return getRecentWorkspaces();
  });
}

/**
 * Clean up file watchers on app quit
 */
export function cleanupFileWatchers(): void {
  for (const [id, watcher] of fileWatchers) {
    watcher.close();
  }
  fileWatchers.clear();
}