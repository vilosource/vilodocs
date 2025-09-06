import fs from 'node:fs/promises';
import path from 'node:path';
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

export class LayoutPersistence {
  private configPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private maxBackups = 3;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(
      process.env.APPDATA || process.env.HOME || '.',
      '.vilodocs',
      'layout.json'
    );
  }

  async save(layout: PersistedLayout): Promise<void> {
    // Debounce saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          // Ensure directory exists
          const dir = path.dirname(this.configPath);
          await fs.mkdir(dir, { recursive: true });

          // Create backup if file exists
          try {
            await this.createBackup();
          } catch (error) {
            // File might not exist yet, that's ok
          }

          // Write the layout
          await fs.writeFile(
            this.configPath,
            JSON.stringify(layout, null, 2),
            'utf-8'
          );

          // Clean old backups
          await this.cleanOldBackups();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 250);
    });
  }

  async load(): Promise<PersistedLayout> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const layout = JSON.parse(data);

      // Migrate if needed
      if (layout.version !== 1) {
        return this.migrate(layout);
      }

      return layout;
    } catch (error) {
      // Return default layout if file doesn't exist or is corrupted
      return this.getDefaultLayout();
    }
  }

  private async createBackup(): Promise<void> {
    const timestamp = Date.now();
    const backupPath = `${this.configPath}.backup.${timestamp}`;
    
    try {
      await fs.copyFile(this.configPath, backupPath);
    } catch (error) {
      // Ignore errors, backup is best-effort
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      const files = await fs.readdir(dir);
      
      const backups = files
        .filter(f => f.startsWith(path.basename(this.configPath) + '.backup.'))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          timestamp: parseInt(f.split('.').pop() || '0')
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      // Delete old backups beyond maxBackups
      for (let i = this.maxBackups; i < backups.length; i++) {
        await fs.unlink(backups[i].path);
      }
    } catch (error) {
      // Ignore errors in cleanup
    }
  }

  private migrate(oldLayout: any): PersistedLayout {
    // Migration from version 0 to version 1
    if (oldLayout.version === 0 || !oldLayout.version) {
      return {
        version: 1,
        editorGrid: oldLayout.editorGrid || { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: oldLayout.activityBarVisible ?? true },
          primarySideBar: { 
            visible: oldLayout.sideBarVisible ?? true, 
            width: oldLayout.sideBarWidth ?? 280 
          },
          secondarySideBar: { 
            visible: oldLayout.secondarySideBarVisible ?? false, 
            width: oldLayout.secondarySideBarWidth ?? 280 
          },
          panel: { 
            visible: oldLayout.panelVisible ?? false, 
            position: oldLayout.panelPosition ?? 'bottom', 
            height: oldLayout.panelHeight ?? 300 
          },
          statusBar: { visible: oldLayout.statusBarVisible ?? true }
        },
        lastFocused: oldLayout.lastFocused || { region: 'editorGrid' }
      };
    }

    // Future migrations would go here
    return this.getDefaultLayout();
  }

  private getDefaultLayout(): PersistedLayout {
    return {
      version: 1,
      editorGrid: {
        id: 'root',
        tabs: [],
        activeTabId: undefined
      },
      regions: {
        activityBar: { visible: true },
        primarySideBar: { visible: true, width: 280 },
        secondarySideBar: { visible: false, width: 280 },
        panel: { visible: false, position: 'bottom', height: 300 },
        statusBar: { visible: true }
      },
      lastFocused: { region: 'editorGrid' }
    };
  }
}