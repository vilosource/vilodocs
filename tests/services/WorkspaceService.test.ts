import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkspaceService } from '../../src/services/WorkspaceService';
import { Workspace } from '../../src/common/ipc';

// Mock the window.api
const mockApi = {
  readDirectory: vi.fn(),
  watchPath: vi.fn(),
  unwatchPath: vi.fn(),
  createFile: vi.fn(),
  createDirectory: vi.fn(),
  deletePath: vi.fn(),
  renamePath: vi.fn(),
  readFileContent: vi.fn()
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).window = { api: mockApi };

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  let mockWorkspace: Workspace;

  beforeEach(() => {
    vi.clearAllMocks();
    workspaceService = new WorkspaceService();
    
    mockWorkspace = {
      type: 'single',
      folders: [
        {
          id: 'folder-1',
          path: '/test/folder',
          name: 'Test Folder'
        }
      ],
      name: 'Test Workspace'
    };

    mockApi.readDirectory.mockResolvedValue([
      {
        id: 'file-1',
        name: 'test.txt',
        path: '/test/folder/test.txt',
        type: 'file',
        size: 100,
        modified: new Date()
      },
      {
        id: 'dir-1',
        name: 'subfolder',
        path: '/test/folder/subfolder',
        type: 'directory',
        modified: new Date()
      }
    ]);

    mockApi.watchPath.mockResolvedValue('watch-id-1');
    mockApi.readFileContent.mockResolvedValue('file content');
  });

  afterEach(async () => {
    await workspaceService.cleanup();
  });

  describe('workspace management', () => {
    it('should open a workspace successfully', async () => {
      await workspaceService.openWorkspace(mockWorkspace);
      
      const state = workspaceService.getState();
      expect(state.workspace).toBe(mockWorkspace);
      expect(state.rootNodes.has('folder-1')).toBe(true);
      expect(mockApi.readDirectory).toHaveBeenCalledWith('/test/folder');
      expect(mockApi.watchPath).toHaveBeenCalledWith('/test/folder');
    });

    it('should handle workspace opening errors gracefully', async () => {
      mockApi.readDirectory.mockRejectedValue(new Error('Access denied'));
      
      await workspaceService.openWorkspace(mockWorkspace);
      
      const state = workspaceService.getState();
      expect(state.workspace).toBe(mockWorkspace);
      expect(state.rootNodes.get('folder-1')).toEqual([]);
    });
  });

  describe('folder operations', () => {
    beforeEach(async () => {
      await workspaceService.openWorkspace(mockWorkspace);
    });

    it('should toggle folder expansion', async () => {
      const folderPath = '/test/folder/subfolder';
      
      expect(workspaceService.isExpanded(folderPath)).toBe(false);
      
      await workspaceService.toggleFolder(folderPath);
      expect(workspaceService.isExpanded(folderPath)).toBe(true);
      
      await workspaceService.toggleFolder(folderPath);
      expect(workspaceService.isExpanded(folderPath)).toBe(false);
    });

    it('should load folder contents when expanding', async () => {
      const folderPath = '/test/folder/subfolder';
      
      await workspaceService.toggleFolder(folderPath);
      
      expect(mockApi.readDirectory).toHaveBeenCalledWith(folderPath);
    });

    it('should select and focus paths', () => {
      const testPath = '/test/folder/test.txt';
      
      workspaceService.selectPath(testPath);
      
      const state = workspaceService.getState();
      expect(state.selectedPath).toBe(testPath);
      expect(state.focusedPath).toBe(testPath);
    });
  });

  describe('file operations', () => {
    beforeEach(async () => {
      await workspaceService.openWorkspace(mockWorkspace);
    });

    it('should create a new file', async () => {
      const parentPath = '/test/folder';
      const fileName = 'newfile.txt';
      
      await workspaceService.createFile(parentPath, fileName);
      
      expect(mockApi.createFile).toHaveBeenCalledWith(`${parentPath}/${fileName}`, '');
    });

    it('should create a new folder', async () => {
      const parentPath = '/test/folder';
      const folderName = 'newfolder';
      
      await workspaceService.createFolder(parentPath, folderName);
      
      expect(mockApi.createDirectory).toHaveBeenCalledWith(`${parentPath}/${folderName}`);
    });

    it('should rename files and folders', async () => {
      const oldPath = '/test/folder/test.txt';
      const newName = 'renamed.txt';
      
      await workspaceService.rename(oldPath, newName);
      
      expect(mockApi.renamePath).toHaveBeenCalledWith(oldPath, '/test/folder/renamed.txt');
    });

    it('should delete files and folders', async () => {
      const filePath = '/test/folder/test.txt';
      
      await workspaceService.delete(filePath);
      
      expect(mockApi.deletePath).toHaveBeenCalledWith(filePath);
    });

    it('should open files', async () => {
      const filePath = '/test/folder/test.txt';
      
      const result = await workspaceService.openFile(filePath);
      
      expect(mockApi.readFileContent).toHaveBeenCalledWith(filePath);
      expect(result).toEqual({
        path: filePath,
        content: 'file content'
      });
    });
  });

  describe('state management', () => {
    it('should notify listeners of state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = workspaceService.subscribe(listener);
      
      await workspaceService.openWorkspace(mockWorkspace);
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
      
      await workspaceService.toggleFolder('/test/folder');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
    });

    it('should clean up watchers properly', async () => {
      await workspaceService.openWorkspace(mockWorkspace);
      
      await workspaceService.cleanup();
      
      expect(mockApi.unwatchPath).toHaveBeenCalledWith('watch-id-1');
    });
  });
});