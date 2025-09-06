import { LayoutNode } from './types';

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
          console.log('Layout saved to localStorage');
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
      console.log('Layout loaded from localStorage');
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
}