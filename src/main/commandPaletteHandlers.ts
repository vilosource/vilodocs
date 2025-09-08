import { ipcMain, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { Channels, type PaletteFileItem } from '../common/ipc';

// Store for recent files
const recentFiles = new Map<string, { path: string; lastOpened: number }>();
const MAX_RECENT_FILES = 20;

/**
 * Recursively search for files in a directory
 */
async function searchFilesInDirectory(
  dirPath: string,
  query: string,
  results: PaletteFileItem[],
  maxResults = 100,
  baseDir?: string
): Promise<void> {
  if (results.length >= maxResults) return;
  
  try {
    const items = await fs.readdir(dirPath);
    const lowerQuery = query.toLowerCase();
    
    for (const item of items) {
      if (results.length >= maxResults) break;
      
      // Skip hidden files and common ignore patterns
      if (item.startsWith('.') || 
          item === 'node_modules' || 
          item === 'dist' || 
          item === '.git' ||
          item === 'coverage' ||
          item === 'build' ||
          item === 'out') continue;
      
      const itemPath = path.join(dirPath, item);
      
      try {
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Search subdirectories
          await searchFilesInDirectory(itemPath, query, results, maxResults, baseDir || dirPath);
        } else if (stats.isFile()) {
          // Check if file matches query
          if (item.toLowerCase().includes(lowerQuery) || itemPath.toLowerCase().includes(lowerQuery)) {
            const relativePath = path.relative(baseDir || dirPath, itemPath);
            const extension = path.extname(item).slice(1);
            
            results.push({
              path: itemPath,
              name: item,
              type: 'file',
              relativePath,
              extension: extension || undefined
            });
          }
        }
      } catch (error) {
        // Skip files we can't access
        console.warn(`Cannot access ${itemPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${dirPath}:`, error);
  }
}

/**
 * Get all files in workspace (limited)
 */
async function getAllWorkspaceFiles(workspacePath: string, limit = 50): Promise<PaletteFileItem[]> {
  const results: PaletteFileItem[] = [];
  
  try {
    const items = await fs.readdir(workspacePath);
    
    for (const item of items) {
      if (results.length >= limit) break;
      
      // Skip hidden files and common ignore patterns
      if (item.startsWith('.') || 
          item === 'node_modules' || 
          item === 'dist' || 
          item === '.git' ||
          item === 'coverage' ||
          item === 'build' ||
          item === 'out') continue;
      
      const itemPath = path.join(workspacePath, item);
      
      try {
        const stats = await fs.stat(itemPath);
        
        if (stats.isFile()) {
          const extension = path.extname(item).slice(1);
          
          results.push({
            path: itemPath,
            name: item,
            type: 'file',
            relativePath: item,
            extension: extension || undefined
          });
        } else if (stats.isDirectory()) {
          // Add directory entry
          results.push({
            path: itemPath,
            name: item,
            type: 'directory',
            relativePath: item
          });
          
          // Add a few files from the directory
          const subItems = await fs.readdir(itemPath);
          for (const subItem of subItems.slice(0, 5)) {
            if (results.length >= limit) break;
            
            const subItemPath = path.join(itemPath, subItem);
            try {
              const subStats = await fs.stat(subItemPath);
              if (subStats.isFile()) {
                const extension = path.extname(subItem).slice(1);
                results.push({
                  path: subItemPath,
                  name: subItem,
                  type: 'file',
                  relativePath: path.join(item, subItem),
                  extension: extension || undefined
                });
              }
            } catch {
              // Skip inaccessible files
            }
          }
        }
      } catch (error) {
        console.warn(`Cannot access ${itemPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading workspace ${workspacePath}:`, error);
  }
  
  return results;
}

/**
 * Track a file as recently opened
 */
function trackRecentFile(filePath: string): void {
  recentFiles.set(filePath, {
    path: filePath,
    lastOpened: Date.now()
  });
  
  // Trim to max size
  if (recentFiles.size > MAX_RECENT_FILES) {
    const sortedEntries = Array.from(recentFiles.entries())
      .sort((a, b) => b[1].lastOpened - a[1].lastOpened)
      .slice(0, MAX_RECENT_FILES);
    
    recentFiles.clear();
    sortedEntries.forEach(([path, data]) => {
      recentFiles.set(path, data);
    });
  }
}

/**
 * Register command palette file handlers
 */
export function registerCommandPaletteHandlers(): void {
  // Search files in workspace
  ipcMain.handle(Channels.SearchFiles, async (_, workspacePath: string, query: string): Promise<PaletteFileItem[]> => {
    if (!workspacePath || !query) return [];
    
    const results: PaletteFileItem[] = [];
    await searchFilesInDirectory(workspacePath, query, results);
    
    // Sort by relevance
    return results.sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then prefer starts with
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Finally alphabetical
      return a.name.localeCompare(b.name);
    });
  });
  
  // Get workspace files (limited list)
  ipcMain.handle(Channels.GetWorkspaceFiles, async (_, workspacePath: string, limit?: number): Promise<PaletteFileItem[]> => {
    if (!workspacePath) return [];
    return getAllWorkspaceFiles(workspacePath, limit);
  });
  
  // Get recent files
  ipcMain.handle(Channels.GetRecentFiles, async (): Promise<PaletteFileItem[]> => {
    const sortedRecent = Array.from(recentFiles.entries())
      .sort((a, b) => b[1].lastOpened - a[1].lastOpened)
      .slice(0, 10);
    
    const results: PaletteFileItem[] = [];
    
    for (const [filePath] of sortedRecent) {
      // Check if file still exists
      try {
        await fs.access(filePath);
        const name = path.basename(filePath);
        const extension = path.extname(name).slice(1);
        
        results.push({
          path: filePath,
          name,
          type: 'file',
          extension: extension || undefined
        });
      } catch {
        // File no longer exists, remove from recent
        recentFiles.delete(filePath);
      }
    }
    
    return results;
  });
  
  // Open file from palette
  ipcMain.handle(Channels.OpenFileFromPalette, async (_, filePath: string): Promise<{ path: string; content: string } | null> => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      trackRecentFile(filePath);
      
      // Send file opened event to renderer if window exists
      const win = BrowserWindow.getFocusedWindow();
      if (win) {
        win.webContents.send('file:opened', { path: filePath, content });
      }
      
      return { path: filePath, content };
    } catch (error) {
      console.error(`Failed to open file ${filePath}:`, error);
      return null;
    }
  });
}