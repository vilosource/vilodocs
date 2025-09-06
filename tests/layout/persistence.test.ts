import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LayoutPersistence, PersistedLayout } from '../../src/layout/persistence';
import fs from 'node:fs/promises';
import path from 'node:path';

vi.mock('node:fs/promises');

describe('LayoutPersistence', () => {
  let persistence: LayoutPersistence;
  const mockConfigPath = '/mock/config/layout.json';

  beforeEach(() => {
    vi.clearAllMocks();
    persistence = new LayoutPersistence(mockConfigPath);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('save', () => {
    test('should save layout to file', async () => {
      const layout: PersistedLayout = {
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

      vi.mocked(fs.writeFile).mockResolvedValue();

      await persistence.save(layout);

      expect(fs.writeFile).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(layout, null, 2),
        'utf-8'
      );
    });

    test('should debounce multiple save calls', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();
      
      const layout: PersistedLayout = {
        version: 1,
        editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: true },
          primarySideBar: { visible: true, width: 280 },
          secondarySideBar: { visible: false, width: 280 },
          panel: { visible: false, position: 'bottom', height: 300 },
          statusBar: { visible: true }
        },
        lastFocused: { region: 'editorGrid' }
      };

      // Call save multiple times rapidly
      persistence.save(layout);
      persistence.save(layout);
      persistence.save(layout);

      // Should only write once after debounce delay
      await new Promise(resolve => setTimeout(resolve, 300));
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    test('should create directory if it does not exist', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue();

      const layout: PersistedLayout = {
        version: 1,
        editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: true },
          primarySideBar: { visible: true, width: 280 },
          secondarySideBar: { visible: false, width: 280 },
          panel: { visible: false, position: 'bottom', height: 300 },
          statusBar: { visible: true }
        },
        lastFocused: { region: 'editorGrid' }
      };

      await persistence.save(layout);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.dirname(mockConfigPath),
        { recursive: true }
      );
    });
  });

  describe('load', () => {
    test('should load layout from file', async () => {
      const savedLayout: PersistedLayout = {
        version: 1,
        editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: false },
          primarySideBar: { visible: true, width: 350 },
          secondarySideBar: { visible: true, width: 300 },
          panel: { visible: true, position: 'right', height: 250 },
          statusBar: { visible: false }
        },
        lastFocused: { region: 'panel' }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(savedLayout));

      const loaded = await persistence.load();
      expect(loaded).toEqual(savedLayout);
    });

    test('should return default layout if file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      const loaded = await persistence.load();
      
      expect(loaded).toBeDefined();
      expect(loaded.version).toBe(1);
      expect(loaded.regions.activityBar.visible).toBe(true);
      expect(loaded.regions.primarySideBar.visible).toBe(true);
      expect(loaded.regions.primarySideBar.width).toBe(280);
      expect(loaded.regions.panel.visible).toBe(false);
    });

    test('should migrate old version layouts', async () => {
      const oldLayout = {
        version: 0,
        // Old structure
        sideBarVisible: true,
        sideBarWidth: 300
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(oldLayout));

      const loaded = await persistence.load();
      
      // Should be migrated to version 1
      expect(loaded.version).toBe(1);
      expect(loaded.regions).toBeDefined();
      expect(loaded.regions.primarySideBar.visible).toBe(true);
      expect(loaded.regions.primarySideBar.width).toBe(300);
    });

    test('should handle corrupted layout file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('not valid json {]');

      const loaded = await persistence.load();
      
      // Should return default layout
      expect(loaded).toBeDefined();
      expect(loaded.version).toBe(1);
      expect(loaded.regions.activityBar.visible).toBe(true);
    });
  });

  describe('backup', () => {
    test('should create backup before saving', async () => {
      const existingLayout = {
        version: 1,
        editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: true },
          primarySideBar: { visible: true, width: 280 },
          secondarySideBar: { visible: false, width: 280 },
          panel: { visible: false, position: 'bottom', height: 300 },
          statusBar: { visible: true }
        },
        lastFocused: { region: 'editorGrid' }
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingLayout));
      vi.mocked(fs.copyFile).mockResolvedValue();
      vi.mocked(fs.writeFile).mockResolvedValue();

      await persistence.save(existingLayout);

      expect(fs.copyFile).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('.backup')
      );
    });

    test('should keep last N backups', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'layout.json.backup.1',
        'layout.json.backup.2',
        'layout.json.backup.3',
        'layout.json.backup.4',
        'layout.json.backup.5'
      ] as string[] as any);
      
      vi.mocked(fs.unlink).mockResolvedValue();
      vi.mocked(fs.copyFile).mockResolvedValue();
      vi.mocked(fs.writeFile).mockResolvedValue();

      const layout: PersistedLayout = {
        version: 1,
        editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
        regions: {
          activityBar: { visible: true },
          primarySideBar: { visible: true, width: 280 },
          secondarySideBar: { visible: false, width: 280 },
          panel: { visible: false, position: 'bottom', height: 300 },
          statusBar: { visible: true }
        },
        lastFocused: { region: 'editorGrid' }
      };

      await persistence.save(layout);

      // Should delete oldest backups
      expect(fs.unlink).toHaveBeenCalled();
    });
  });
});