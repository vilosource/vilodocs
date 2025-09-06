import { FileNode, Workspace, WorkspaceFolder } from '../common/ipc';

export interface WorkspaceState {
  workspace: Workspace | null;
  rootNodes: Map<string, FileNode[]>; // folder id -> nodes
  expandedFolders: Set<string>;
  selectedPath: string | null;
  focusedPath: string | null;
}

export class WorkspaceService {
  private state: WorkspaceState = {
    workspace: null,
    rootNodes: new Map(),
    expandedFolders: new Set(),
    selectedPath: null,
    focusedPath: null,
  };

  private changeListeners: Set<(state: WorkspaceState) => void> = new Set();
  private fileWatchIds: Map<string, string> = new Map(); // folder path -> watch id
  private readonly STORAGE_KEY = 'vilodocs-workspace-state';

  /**
   * Opens a workspace (single or multi-root)
   */
  async openWorkspace(workspace: Workspace): Promise<void> {
    // Clean up existing watches
    await this.cleanup();

    this.state.workspace = workspace;
    this.state.rootNodes.clear();
    this.state.selectedPath = null;
    this.state.focusedPath = null;
    
    // Load saved expanded folders for this workspace
    this.loadExpandedFolders();

    // Load root folders
    for (const folder of workspace.folders) {
      await this.loadFolder(folder);
    }
    
    // Load contents of already-expanded folders
    for (const expandedPath of this.state.expandedFolders) {
      await this.loadFolderContents(expandedPath);
    }

    this.notifyListeners();
  }

  /**
   * Loads a folder's contents
   */
  private async loadFolder(folder: WorkspaceFolder): Promise<void> {
    try {
      const nodes = await window.api.readDirectory(folder.path);
      this.state.rootNodes.set(folder.id, nodes);

      // Start watching for changes
      const watchId = await window.api.watchPath(folder.path);
      this.fileWatchIds.set(folder.path, watchId);
    } catch (error) {
      console.error(`Failed to load folder ${folder.path}:`, error);
      this.state.rootNodes.set(folder.id, []);
    }
  }

  /**
   * Refreshes a specific path
   */
  async refreshPath(path: string): Promise<void> {
    // Find which folder this path belongs to
    const folder = this.findFolderForPath(path);
    if (folder) {
      await this.loadFolder(folder);
      this.notifyListeners();
    }
  }

  /**
   * Expands or collapses a folder
   */
  async toggleFolder(path: string): Promise<void> {
    console.log('toggleFolder called for:', path);
    console.log('Current expanded folders:', Array.from(this.state.expandedFolders));
    
    // Create a new Set to trigger React re-render
    const newExpandedFolders = new Set(this.state.expandedFolders);
    
    if (newExpandedFolders.has(path)) {
      newExpandedFolders.delete(path);
      console.log('Collapsed folder:', path);
    } else {
      newExpandedFolders.add(path);
      console.log('Expanding folder:', path);
      // Load children if not already loaded
      await this.loadFolderContents(path);
    }
    
    // Replace the Set with the new one
    this.state.expandedFolders = newExpandedFolders;
    
    // Save expanded folders to localStorage
    this.saveExpandedFolders();
    
    console.log('Updated expanded folders:', Array.from(this.state.expandedFolders));
    this.notifyListeners();
  }

  /**
   * Loads the contents of a subfolder
   */
  private async loadFolderContents(folderPath: string): Promise<void> {
    try {
      const nodes = await window.api.readDirectory(folderPath);
      // Update the tree structure with the new nodes
      this.updateTreeNodes(folderPath, nodes);
    } catch (error) {
      console.error(`Failed to load folder contents ${folderPath}:`, error);
    }
  }

  /**
   * Updates tree nodes for a specific path
   */
  private updateTreeNodes(parentPath: string, children: FileNode[]): void {
    console.log('updateTreeNodes called for:', parentPath, 'with', children.length, 'children');
    // Find and update the parent node in the tree
    for (const [folderId, nodes] of this.state.rootNodes) {
      const clonedNodes = this.cloneAndUpdateNodes(nodes, parentPath, children);
      if (clonedNodes) {
        this.state.rootNodes.set(folderId, clonedNodes);
        console.log('Updated nodes for folder:', folderId);
        break;
      }
    }
  }

  /**
   * Clone nodes and update the target path with new children
   */
  private cloneAndUpdateNodes(
    nodes: FileNode[],
    targetPath: string,
    newChildren: FileNode[]
  ): FileNode[] | null {
    let found = false;
    
    const clonedNodes = nodes.map(node => {
      if (node.path === targetPath) {
        found = true;
        // Clone the node and update its children
        return {
          ...node,
          children: newChildren
        };
      } else if (node.children && node.children.length > 0) {
        // Recursively check children
        const updatedChildren = this.cloneAndUpdateNodes(node.children, targetPath, newChildren);
        if (updatedChildren) {
          found = true;
          return {
            ...node,
            children: updatedChildren
          };
        }
      }
      // Return the node unchanged
      return node;
    });
    
    return found ? clonedNodes : null;
  }
  
  /**
   * Recursively updates nodes (deprecated - keeping for reference)
   */
  private updateNodesRecursive(
    nodes: FileNode[],
    targetPath: string,
    newChildren: FileNode[]
  ): boolean {
    for (const node of nodes) {
      if (node.path === targetPath) {
        node.children = newChildren;
        return true;
      }
      if (node.children) {
        if (this.updateNodesRecursive(node.children, targetPath, newChildren)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Selects a file or folder
   */
  selectPath(path: string | null): void {
    this.state.selectedPath = path;
    this.state.focusedPath = path;
    this.notifyListeners();
  }

  /**
   * Creates a new file
   */
  async createFile(parentPath: string, name: string): Promise<void> {
    const filePath = `${parentPath}/${name}`;
    await window.api.createFile(filePath, '');
    await this.refreshPath(parentPath);
  }

  /**
   * Creates a new folder
   */
  async createFolder(parentPath: string, name: string): Promise<void> {
    const folderPath = `${parentPath}/${name}`;
    await window.api.createDirectory(folderPath);
    await this.refreshPath(parentPath);
  }

  /**
   * Renames a file or folder
   */
  async rename(oldPath: string, newName: string): Promise<void> {
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    await window.api.renamePath(oldPath, newPath);
    
    const parentPath = pathParts.slice(0, -1).join('/');
    await this.refreshPath(parentPath);
  }

  /**
   * Deletes a file or folder
   */
  async delete(path: string): Promise<void> {
    await window.api.deletePath(path);
    
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    await this.refreshPath(parentPath);
  }

  /**
   * Opens a file in the editor
   */
  async openFile(path: string): Promise<{ path: string; content: string }> {
    const content = await window.api.readFileContent(path);
    return { path, content };
  }

  /**
   * Finds which workspace folder contains a path
   */
  private findFolderForPath(path: string): WorkspaceFolder | null {
    if (!this.state.workspace) return null;
    
    for (const folder of this.state.workspace.folders) {
      if (path.startsWith(folder.path)) {
        return folder;
      }
    }
    return null;
  }

  /**
   * Gets the current state
   */
  getState(): WorkspaceState {
    return this.state;
  }

  /**
   * Subscribes to state changes
   */
  subscribe(listener: (state: WorkspaceState) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Notifies all listeners of state changes
   */
  private notifyListeners(): void {
    // Create a new state object to ensure React detects changes
    const stateSnapshot: WorkspaceState = {
      ...this.state,
      expandedFolders: new Set(this.state.expandedFolders),
      rootNodes: new Map(this.state.rootNodes)
    };
    
    for (const listener of this.changeListeners) {
      listener(stateSnapshot);
    }
  }

  /**
   * Cleans up watchers and state
   */
  async cleanup(): Promise<void> {
    // Stop all file watchers
    for (const [path, watchId] of this.fileWatchIds) {
      try {
        await window.api.unwatchPath(watchId);
      } catch (error) {
        console.error(`Failed to unwatch ${path}:`, error);
      }
    }
    this.fileWatchIds.clear();
  }

  /**
   * Checks if a folder is expanded
   */
  isExpanded(path: string): boolean {
    return this.state.expandedFolders.has(path);
  }

  /**
   * Checks if a path is selected
   */
  isSelected(path: string): boolean {
    return this.state.selectedPath === path;
  }

  /**
   * Gets a unique key for the current workspace
   */
  private getWorkspaceKey(): string {
    if (!this.state.workspace) return 'no-workspace';
    
    // Use the first folder path as the key (or combine all for multi-root)
    const folderPaths = this.state.workspace.folders.map(f => f.path).join('|');
    // Create a simple hash of the paths
    let hash = 0;
    for (let i = 0; i < folderPaths.length; i++) {
      const char = folderPaths.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `workspace-${Math.abs(hash)}`;
  }

  /**
   * Saves expanded folders to localStorage
   */
  private saveExpandedFolders(): void {
    if (this.state.workspace) {
      const key = `${this.STORAGE_KEY}-expanded-${this.getWorkspaceKey()}`;
      const expandedArray = Array.from(this.state.expandedFolders);
      localStorage.setItem(key, JSON.stringify(expandedArray));
      console.log('Saved expanded folders:', expandedArray.length, 'folders');
    }
  }

  /**
   * Loads expanded folders from localStorage
   */
  private loadExpandedFolders(): void {
    if (this.state.workspace) {
      const key = `${this.STORAGE_KEY}-expanded-${this.getWorkspaceKey()}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const expandedArray = JSON.parse(saved) as string[];
          this.state.expandedFolders = new Set(expandedArray);
          console.log('Loaded expanded folders:', expandedArray.length, 'folders');
        } catch (error) {
          console.error('Failed to load expanded folders:', error);
          this.state.expandedFolders = new Set();
        }
      } else {
        this.state.expandedFolders = new Set();
      }
    }
  }
}