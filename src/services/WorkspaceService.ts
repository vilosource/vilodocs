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

  /**
   * Opens a workspace (single or multi-root)
   */
  async openWorkspace(workspace: Workspace): Promise<void> {
    // Clean up existing watches
    await this.cleanup();

    this.state.workspace = workspace;
    this.state.rootNodes.clear();
    this.state.expandedFolders.clear();
    this.state.selectedPath = null;
    this.state.focusedPath = null;

    // Load root folders
    for (const folder of workspace.folders) {
      await this.loadFolder(folder);
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
    if (this.state.expandedFolders.has(path)) {
      this.state.expandedFolders.delete(path);
    } else {
      this.state.expandedFolders.add(path);
      // Load children if not already loaded
      await this.loadFolderContents(path);
    }
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
    // Find and update the parent node in the tree
    for (const [folderId, nodes] of this.state.rootNodes) {
      const updated = this.updateNodesRecursive(nodes, parentPath, children);
      if (updated) {
        this.state.rootNodes.set(folderId, [...nodes]);
        break;
      }
    }
  }

  /**
   * Recursively updates nodes
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
    for (const listener of this.changeListeners) {
      listener(this.state);
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
}