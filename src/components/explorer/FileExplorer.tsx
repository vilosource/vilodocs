import React, { useState, useEffect, useCallback } from 'react';
import { FileTree } from './FileTree';
import { WorkspaceService, WorkspaceState } from '../../services/WorkspaceService';
import { Workspace } from '../../common/ipc';
import './FileExplorer.css';

interface FileExplorerProps {
  workspace?: Workspace | null;
  onOpenFile?: (path: string, content: string) => void;
  onWorkspaceChange?: (workspace: Workspace | null) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  workspace: initialWorkspace,
  onOpenFile,
  onWorkspaceChange,
}) => {
  const [workspaceService] = useState(() => new WorkspaceService());
  const [state, setState] = useState<WorkspaceState>(() => workspaceService.getState());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
  } | null>(null);

  // Subscribe to workspace service changes
  useEffect(() => {
    const unsubscribe = workspaceService.subscribe(setState);
    return () => {
      unsubscribe();
      workspaceService.cleanup();
    };
  }, [workspaceService]);

  // Load initial workspace
  useEffect(() => {
    if (initialWorkspace) {
      console.log('FileExplorer: Loading workspace:', initialWorkspace.name || initialWorkspace.folders[0].path);
      workspaceService.openWorkspace(initialWorkspace).catch(err => {
        console.error('Failed to open workspace:', err);
      });
    }
  }, [initialWorkspace, workspaceService]);

  // Listen for file changes
  useEffect(() => {
    const cleanup = window.api.onFileChange((event) => {
      console.log('File change event:', event);
      // Refresh the affected path
      workspaceService.refreshPath(event.path);
    });
    
    return cleanup;
  }, [workspaceService]);

  const handleOpenFolder = useCallback(async () => {
    const workspace = await window.api.openFolder();
    if (workspace) {
      await workspaceService.openWorkspace(workspace);
      onWorkspaceChange?.(workspace);
    }
  }, [workspaceService, onWorkspaceChange]);

  const handleOpenWorkspace = useCallback(async () => {
    const workspace = await window.api.openWorkspace();
    if (workspace) {
      await workspaceService.openWorkspace(workspace);
      onWorkspaceChange?.(workspace);
    }
  }, [workspaceService, onWorkspaceChange]);

  const handleToggleExpand = useCallback(async (path: string) => {
    await workspaceService.toggleFolder(path);
  }, [workspaceService]);

  const handleSelectPath = useCallback((path: string) => {
    workspaceService.selectPath(path);
  }, [workspaceService]);

  const handleOpenFile = useCallback(async (path: string) => {
    try {
      const { content } = await workspaceService.openFile(path);
      onOpenFile?.(path, content);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [workspaceService, onOpenFile]);

  const handleCreateFile = useCallback(async (parentPath: string) => {
    const name = prompt('Enter file name:');
    if (name) {
      await workspaceService.createFile(parentPath, name);
    }
  }, [workspaceService]);

  const handleCreateFolder = useCallback(async (parentPath: string) => {
    const name = prompt('Enter folder name:');
    if (name) {
      await workspaceService.createFolder(parentPath, name);
    }
  }, [workspaceService]);

  const handleRename = useCallback(async (path: string, newName: string) => {
    await workspaceService.rename(path, newName);
  }, [workspaceService]);

  const handleDelete = useCallback(async (path: string) => {
    await workspaceService.delete(path);
  }, [workspaceService]);

  const handleContextMenu = useCallback((event: React.MouseEvent, path: string) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      path,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Get all nodes from all workspace folders
  const allNodes = Array.from(state.rootNodes.values()).flat();

  if (!state.workspace) {
    return (
      <div className="file-explorer-empty">
        <div className="empty-message">
          <h3>No Folder Opened</h3>
          <p>Open a folder to start working on a project</p>
          <div className="empty-actions">
            <button onClick={handleOpenFolder} className="primary-button">
              Open Folder
            </button>
            <button onClick={handleOpenWorkspace} className="secondary-button">
              Open Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-explorer" onClick={handleCloseContextMenu}>
      <div className="file-explorer-header">
        <span className="workspace-name">
          {state.workspace.name || 'EXPLORER'}
        </span>
        <div className="file-explorer-actions">
          <button 
            className="icon-button"
            onClick={handleOpenFolder}
            title="Open Folder"
          >
            📁
          </button>
          <button 
            className="icon-button"
            onClick={() => handleCreateFile(state.workspace!.folders[0].path)}
            title="New File"
          >
            📄
          </button>
          <button 
            className="icon-button"
            onClick={() => handleCreateFolder(state.workspace!.folders[0].path)}
            title="New Folder"
          >
            📁+
          </button>
        </div>
      </div>
      
      {state.workspace.type === 'multi' ? (
        // Multi-root workspace: show each folder separately
        <div className="workspace-folders">
          {state.workspace.folders.map(folder => (
            <div key={folder.id} className="workspace-folder">
              <div className="folder-header">
                {folder.name || folder.path}
              </div>
              <FileTree
                nodes={state.rootNodes.get(folder.id) || []}
                expandedPaths={state.expandedFolders}
                selectedPath={state.selectedPath}
                onToggleExpand={handleToggleExpand}
                onSelectPath={handleSelectPath}
                onOpenFile={handleOpenFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRename={handleRename}
                onDelete={handleDelete}
                onContextMenu={handleContextMenu}
              />
            </div>
          ))}
        </div>
      ) : (
        // Single folder workspace
        <FileTree
          nodes={allNodes}
          expandedPaths={state.expandedFolders}
          selectedPath={state.selectedPath}
          onToggleExpand={handleToggleExpand}
          onSelectPath={handleSelectPath}
          onOpenFile={handleOpenFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onContextMenu={handleContextMenu}
        />
      )}
      
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div 
            className="context-menu-item"
            onClick={() => {
              handleCreateFile(contextMenu.path);
              handleCloseContextMenu();
            }}
          >
            New File
          </div>
          <div 
            className="context-menu-item"
            onClick={() => {
              handleCreateFolder(contextMenu.path);
              handleCloseContextMenu();
            }}
          >
            New Folder
          </div>
          <div className="context-menu-separator" />
          <div 
            className="context-menu-item"
            onClick={() => {
              // Start rename
              workspaceService.selectPath(contextMenu.path);
              handleCloseContextMenu();
            }}
          >
            Rename
          </div>
          <div 
            className="context-menu-item"
            onClick={() => {
              if (window.confirm(`Delete ${contextMenu.path}?`)) {
                handleDelete(contextMenu.path);
              }
              handleCloseContextMenu();
            }}
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
};