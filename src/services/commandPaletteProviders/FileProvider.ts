import { PaletteItem } from '../../components/commandPalette/CommandPalette';
import { CommandPaletteProvider, FileItem, RecentFile } from './types';
import { PaletteFileItem } from '../../common/ipc';

export class FileProvider implements CommandPaletteProvider {
  id = 'files';
  name = 'Files';
  priority = 10;
  
  private recentFiles: Map<string, RecentFile> = new Map();
  private fileCache: Map<string, FileItem[]> = new Map();
  private workspacePath: string | null = null;
  private openedTabs: Array<{ id: string; title: string; filePath?: string }> = [];
  private onOpenFile?: (path: string) => Promise<void>;
  
  constructor(onOpenFile?: (path: string) => Promise<void>) {
    this.onOpenFile = onOpenFile;
    this.loadRecentFiles();
  }
  
  setWorkspace(workspacePath: string | null) {
    this.workspacePath = workspacePath;
    this.fileCache.clear(); // Clear cache when workspace changes
  }
  
  setOpenedTabs(tabs: Array<{ id: string; title: string; filePath?: string }>) {
    this.openedTabs = tabs || [];
  }
  
  async getItems(query: string): Promise<PaletteItem[]> {
    const items: PaletteItem[] = [];
    
    // First, add opened tabs
    if (this.openedTabs && this.openedTabs.length > 0) {
      const openedItems = this.openedTabs
        .filter(tab => tab.filePath)
        .map(tab => ({
          id: `opened-${tab.id}`,
          label: tab.title,
          description: tab.filePath,
          category: 'Opened',
          icon: '📂',
          action: async () => {
            if (this.onOpenFile && tab.filePath) {
              await this.onOpenFile(tab.filePath);
            }
          }
        }));
      
      if (!query) {
        // Show all opened tabs when no query
        items.push(...openedItems);
      } else {
        // Filter opened tabs by query
        const lowerQuery = query.toLowerCase();
        const matchingOpened = openedItems.filter(item => 
          item.label.toLowerCase().includes(lowerQuery) ||
          (item.description && item.description.toLowerCase().includes(lowerQuery))
        );
        items.push(...matchingOpened);
      }
    }
    
    // If no query, show recent files as well
    if (!query) {
      // Get recent files from IPC
      try {
        const recentFiles = await window.api.getRecentFiles();
        const recentItems = recentFiles.map(file => this.ipcFileItemToPaletteItem(file, 'Recent'));
        items.push(...recentItems);
      } catch (error) {
        console.error('Failed to get recent files:', error);
      }
      
      // Add some workspace files if available
      if (this.workspacePath) {
        try {
          const workspaceFiles = await window.api.getWorkspaceFiles(this.workspacePath, 20);
          const topFiles = workspaceFiles.map(file => this.ipcFileItemToPaletteItem(file, 'Files'));
          items.push(...topFiles);
        } catch (error) {
          console.error('Failed to get workspace files:', error);
        }
      }
    } else {
      // Search files in workspace using IPC
      if (this.workspacePath) {
        try {
          const searchResults = await window.api.searchFiles(this.workspacePath, query);
          const matchingFiles = searchResults.map(file => this.ipcFileItemToPaletteItem(file, 'Files'));
          items.push(...matchingFiles);
        } catch (error) {
          console.error('Failed to search files:', error);
        }
      }
      
      // Also search in recent files locally
      const recentMatches = this.searchRecentFiles(query);
      items.push(...recentMatches);
    }
    
    // Remove duplicates (recent files might also be in workspace)
    const uniqueItems = new Map<string, PaletteItem>();
    items.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });
    
    return Array.from(uniqueItems.values());
  }
  
  private getRecentFileItems(): PaletteItem[] {
    const recentArray = Array.from(this.recentFiles.values())
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, 5);
    
    return recentArray.map(file => ({
      id: `recent:${file.path}`,
      label: file.name,
      description: this.getRelativePath(file.path),
      icon: this.getFileIcon(file.path),
      category: 'Recent',
      action: async () => {
        await this.openFile(file.path);
      }
    }));
  }
  
  private searchRecentFiles(query: string): PaletteItem[] {
    const lowerQuery = query.toLowerCase();
    const matches = Array.from(this.recentFiles.values())
      .filter(file => 
        file.name.toLowerCase().includes(lowerQuery) ||
        file.path.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, 5);
    
    return matches.map(file => ({
      id: `recent:${file.path}`,
      label: file.name,
      description: this.getRelativePath(file.path),
      icon: this.getFileIcon(file.path),
      category: 'Recent',
      action: async () => {
        await this.openFile(file.path);
      }
    }));
  }
  
  private ipcFileItemToPaletteItem(file: PaletteFileItem, category: string): PaletteItem {
    return {
      id: `file:${file.path}`,
      label: file.name,
      description: file.relativePath || this.getRelativePath(file.path),
      icon: file.type === 'directory' ? '📁' : this.getFileIcon(file.path),
      category,
      action: async () => {
        if (file.type === 'file') {
          await this.openFile(file.path);
        } else {
          // For directories, could expand in explorer or change directory
          console.log('Opening directory:', file.path);
        }
      }
    };
  }
  
  
  private async openFile(path: string) {
    // Track as recent locally (IPC will also track it)
    const fileName = path.split('/').pop() || path;
    this.recentFiles.set(path, {
      path,
      name: fileName,
      lastOpened: Date.now(),
      workspaceId: this.workspacePath || undefined
    });
    this.saveRecentFiles();
    
    // Use IPC to open the file
    try {
      const result = await window.api.openFileFromPalette(path);
      if (result && this.onOpenFile) {
        // Call the local handler with the content
        await this.onOpenFile(path);
      }
    } catch (error) {
      console.error('Failed to open file:', path, error);
    }
  }
  
  private getRelativePath(fullPath: string): string {
    if (this.workspacePath && fullPath.startsWith(this.workspacePath)) {
      return fullPath.substring(this.workspacePath.length + 1);
    }
    // Show last two directories for context
    const parts = fullPath.split('/');
    if (parts.length > 2) {
      return '.../' + parts.slice(-2).join('/');
    }
    return fullPath;
  }
  
  private getFileIcon(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    
    const iconMap: Record<string, string> = {
      // Code files
      'ts': '📘',
      'tsx': '📘',
      'js': '📙',
      'jsx': '📙',
      'css': '🎨',
      'scss': '🎨',
      'html': '🌐',
      'json': '📋',
      'xml': '📋',
      'yaml': '📋',
      'yml': '📋',
      
      // Documents
      'md': '📝',
      'txt': '📄',
      'pdf': '📕',
      'doc': '📄',
      'docx': '📄',
      
      // Images
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      
      // Config files
      'env': '⚙️',
      'config': '⚙️',
      'gitignore': '⚙️',
      'eslintrc': '⚙️',
      
      // Archives
      'zip': '📦',
      'tar': '📦',
      'gz': '📦',
      'rar': '📦',
    };
    
    return iconMap[extension || ''] || '📄';
  }
  
  private loadRecentFiles() {
    // In a real implementation, load from electron-store or localStorage
    try {
      const stored = localStorage.getItem('commandPalette.recentFiles');
      if (stored) {
        const parsed = JSON.parse(stored) as RecentFile[];
        parsed.forEach(file => {
          this.recentFiles.set(file.path, file);
        });
      }
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }
  
  private saveRecentFiles() {
    // In a real implementation, save to electron-store or localStorage
    try {
      const recent = Array.from(this.recentFiles.values())
        .sort((a, b) => b.lastOpened - a.lastOpened)
        .slice(0, 20); // Keep only last 20
      localStorage.setItem('commandPalette.recentFiles', JSON.stringify(recent));
    } catch (error) {
      console.error('Failed to save recent files:', error);
    }
  }
  
  clearRecentFiles() {
    this.recentFiles.clear();
    this.saveRecentFiles();
  }
}