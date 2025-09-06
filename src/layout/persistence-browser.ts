import { LayoutNode } from './types';
import { Workspace } from '../common/ipc';

export interface PersistedLayout {
  version: number;
  editorGrid: LayoutNode;
  regions: {
    activityBar: { visible: boolean };
    primarySideBar: { visible: boolean; width: number };
    secondarySideBar: { visible: boolean; width: number };
    panel: { visible: boolean; position: 'bottom' | 'right'; height: number };
    statusBar: { visible: boolean };
  };
  lastFocused: {
    region: string;
    leafId?: string;
    tabId?: string;
  };
  workspace?: Workspace | null;
  expandedFolders?: string[];
}

/**
 * Browser-compatible version of LayoutPersistence using localStorage
 */
export class LayoutPersistence {
  private readonly storageKey = 'vilodocs-layout';
  private saveTimeout: NodeJS.Timeout | null = null;

  async save(layout: PersistedLayout): Promise<void> {
    // Debounce saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(() => {
        try {
          const serialized = JSON.stringify(layout);
          localStorage.setItem(this.storageKey, serialized);
          console.log('Layout saved to localStorage, workspace:', layout.workspace ? 'present' : 'missing');
          if (layout.workspace) {
            console.log('Saved workspace:', layout.workspace.name || layout.workspace.folders[0]?.path);
          }
          resolve();
        } catch (error) {
          console.error('Failed to save layout:', error);
          resolve(); // Don't reject, just log the error
        }
      }, 300); // 300ms debounce
    });
  }

  async load(): Promise<PersistedLayout | null> {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        console.log('No saved layout found');
        return null;
      }

      const layout = JSON.parse(serialized) as PersistedLayout;
      
      // Validate layout - check if it has valid structure
      if (!this.validateLayout(layout)) {
        console.warn('Invalid layout detected, clearing storage');
        await this.clear();
        return null;
      }
      
      console.log('Layout loaded from localStorage, workspace:', layout.workspace ? 'present' : 'missing');
      if (layout.workspace) {
        console.log('Loaded workspace:', layout.workspace.name || layout.workspace.folders[0]?.path);
      }
      return layout;
    } catch (error) {
      console.error('Failed to load layout:', error);
      
      // Try to load backup
      try {
        const backup = localStorage.getItem(`${this.storageKey}-backup`);
        if (backup) {
          const layout = JSON.parse(backup) as PersistedLayout;
          console.log('Layout loaded from backup');
          return layout;
        }
      } catch (backupError) {
        console.error('Failed to load backup:', backupError);
      }
      
      return null;
    }
  }

  async createBackup(): Promise<void> {
    try {
      const current = localStorage.getItem(this.storageKey);
      if (current) {
        localStorage.setItem(`${this.storageKey}-backup`, current);
        console.log('Backup created');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(`${this.storageKey}-backup`);
      console.log('Layout cleared');
    } catch (error) {
      console.error('Failed to clear layout:', error);
    }
  }

  private validateLayout(layout: PersistedLayout): boolean {
    // Check basic structure
    if (!layout || !layout.editorGrid || !layout.regions) {
      return false;
    }

    // Check version compatibility
    if (layout.version !== 1) {
      console.warn('Incompatible layout version:', layout.version);
      return false;
    }

    // Validate tabs have required properties
    const validateNode = (node: any): boolean => {
      if (!node) return false;
      
      if (node.type === 'leaf' && node.tabs) {
        for (const tab of node.tabs) {
          // Check if tab has widget property (required in new version)
          // Migration will handle missing widgets, but if structure is completely broken, reject
          if (!tab.id || !tab.title) {
            console.warn('Invalid tab structure:', tab);
            return false;
          }
        }
      }
      
      if (node.children) {
        for (const child of node.children) {
          if (!validateNode(child)) return false;
        }
      }
      
      return true;
    };

    return validateNode(layout.editorGrid);
  }
}