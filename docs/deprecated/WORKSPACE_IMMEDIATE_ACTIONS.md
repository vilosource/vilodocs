# Immediate Workspace Implementation Actions

## Priority 1: Core Workspace File Format (Today)

### 1. Create Workspace Type Definitions

```typescript
// src/common/workspace-types.ts

export interface VilodocsWorkspaceFile {
  version: '1.0.0';
  name?: string;
  folders: WorkspaceFolder[];
  settings?: WorkspaceSettings;
  state?: WorkspaceUIState;
}

export interface WorkspaceFolder {
  path: string;      // Relative to workspace file or absolute
  name?: string;     // Custom display name
}

export interface WorkspaceSettings {
  editor?: {
    fontSize?: number;
    tabSize?: number;
    wordWrap?: boolean;
  };
  files?: {
    exclude?: string[];
    watcherExclude?: string[];
  };
  search?: {
    exclude?: string[];
    useIgnoreFiles?: boolean;
  };
}

export interface WorkspaceUIState {
  expandedFolders?: string[];
  openEditors?: Array<{
    path: string;
    active?: boolean;
    pinned?: boolean;
  }>;
}
```

### 2. Implement Workspace File Operations

```typescript
// src/main/workspaceFileHandler.ts

import * as fs from 'fs-extra';
import * as path from 'path';

export class WorkspaceFileHandler {
  private static readonly WORKSPACE_EXTENSION = '.vilodocs-workspace';
  
  static async save(workspace: VilodocsWorkspaceFile, filePath: string): Promise<void> {
    // Ensure .vilodocs-workspace extension
    if (!filePath.endsWith(this.WORKSPACE_EXTENSION)) {
      filePath += this.WORKSPACE_EXTENSION;
    }
    
    // Convert relative paths to absolute before saving
    const dir = path.dirname(filePath);
    const normalized = {
      ...workspace,
      folders: workspace.folders.map(f => ({
        ...f,
        path: path.isAbsolute(f.path) ? f.path : path.resolve(dir, f.path)
      }))
    };
    
    await fs.writeJson(filePath, normalized, { spaces: 2 });
  }
  
  static async load(filePath: string): Promise<VilodocsWorkspaceFile> {
    const workspace = await fs.readJson(filePath);
    
    // Validate version
    if (workspace.version !== '1.0.0') {
      throw new Error(`Unsupported workspace version: ${workspace.version}`);
    }
    
    return workspace;
  }
  
  static async create(folders: string[], name?: string): Promise<VilodocsWorkspaceFile> {
    return {
      version: '1.0.0',
      name: name || path.basename(folders[0]),
      folders: folders.map(f => ({
        path: f,
        name: path.basename(f)
      })),
      settings: {},
      state: {}
    };
  }
}
```

## Priority 2: WorkspaceManager Service (Today/Tomorrow)

### 1. Core WorkspaceManager Implementation

```typescript
// src/services/WorkspaceManager.ts

export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private currentWorkspace: Workspace | null = null;
  private recentWorkspaces: RecentWorkspace[] = [];
  private workspaceService: WorkspaceService;
  
  static getInstance(): WorkspaceManager {
    if (!this.instance) {
      this.instance = new WorkspaceManager();
    }
    return this.instance;
  }
  
  async openWorkspaceFile(filePath: string): Promise<void> {
    const workspaceFile = await WorkspaceFileHandler.load(filePath);
    
    // Convert to internal Workspace format
    const workspace: Workspace = {
      type: workspaceFile.folders.length > 1 ? 'multi' : 'single',
      folders: workspaceFile.folders.map(f => ({
        id: generateId(),
        path: f.path,
        name: f.name
      })),
      name: workspaceFile.name,
      path: filePath
    };
    
    await this.switchToWorkspace(workspace);
    await this.addToRecent(workspace);
  }
  
  async saveWorkspace(path?: string): Promise<void> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace open');
    }
    
    const savePath = path || this.currentWorkspace.path;
    if (!savePath) {
      throw new Error('No save path specified');
    }
    
    const workspaceFile = await this.convertToWorkspaceFile(this.currentWorkspace);
    await WorkspaceFileHandler.save(workspaceFile, savePath);
    
    // Update current workspace path
    this.currentWorkspace.path = savePath;
  }
  
  async createWorkspaceFromFolders(folders: string[]): Promise<Workspace> {
    const workspace: Workspace = {
      type: folders.length > 1 ? 'multi' : 'single',
      folders: folders.map(f => ({
        id: generateId(),
        path: f,
        name: path.basename(f)
      })),
      name: folders.length === 1 ? path.basename(folders[0]) : 'Untitled Workspace'
    };
    
    return workspace;
  }
}
```

### 2. IPC Handlers for Workspace Operations

```typescript
// src/main/workspaceHandlers.ts

export function registerWorkspaceHandlers() {
  // Save workspace
  ipcMain.handle('workspace:save', async (_, path?: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: path || 'workspace.vilodocs-workspace',
      filters: [
        { name: 'Vilodocs Workspace', extensions: ['vilodocs-workspace'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      await WorkspaceManager.getInstance().saveWorkspace(result.filePath);
      return result.filePath;
    }
    return null;
  });
  
  // Open workspace file
  ipcMain.handle('workspace:open-file', async () => {
    const result = await dialog.showOpenDialog({
      filters: [
        { name: 'Vilodocs Workspace', extensions: ['vilodocs-workspace'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths[0]) {
      await WorkspaceManager.getInstance().openWorkspaceFile(result.filePaths[0]);
      return true;
    }
    return false;
  });
  
  // Add folder to workspace
  ipcMain.handle('workspace:add-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths[0]) {
      await WorkspaceManager.getInstance().addFolder(result.filePaths[0]);
      return result.filePaths[0];
    }
    return null;
  });
}
```

## Priority 3: UI Integration (Tomorrow)

### 1. Update Application Menu

```typescript
// src/main/menu.ts additions

{
  label: 'File',
  submenu: [
    {
      label: 'Open Folder...',
      accelerator: 'CmdOrCtrl+K CmdOrCtrl+O',
      click: () => {
        mainWindow.webContents.send('menu:open-folder');
      }
    },
    {
      label: 'Open Workspace...',
      accelerator: 'CmdOrCtrl+K CmdOrCtrl+W',
      click: () => {
        mainWindow.webContents.send('menu:open-workspace');
      }
    },
    {
      label: 'Save Workspace As...',
      click: () => {
        mainWindow.webContents.send('menu:save-workspace');
      }
    },
    { type: 'separator' },
    {
      label: 'Add Folder to Workspace...',
      click: () => {
        mainWindow.webContents.send('menu:add-folder');
      }
    },
    { type: 'separator' },
    {
      label: 'Recent Workspaces',
      submenu: [] // Populated dynamically
    }
  ]
}
```

### 2. Multi-root FileExplorer Display

```typescript
// src/components/explorer/FileExplorer.tsx updates

const FileExplorer: React.FC = () => {
  const { workspace } = useWorkspace();
  
  if (!workspace) {
    return <EmptyWorkspaceView onOpenFolder={handleOpenFolder} />;
  }
  
  const isMultiRoot = workspace.folders.length > 1;
  
  return (
    <div className="file-explorer">
      <FileExplorerToolbar 
        onAddFolder={handleAddFolder}
        onSaveWorkspace={handleSaveWorkspace}
      />
      
      <div className="file-tree-container">
        {isMultiRoot ? (
          // Multi-root: Show each folder with header
          workspace.folders.map(folder => (
            <div key={folder.id} className="workspace-folder">
              <div className="folder-header">
                <Icon name="folder" />
                <span className="folder-name">{folder.name || path.basename(folder.path)}</span>
                <button 
                  className="remove-folder"
                  onClick={() => handleRemoveFolder(folder.id)}
                  title="Remove from workspace"
                >
                  ×
                </button>
              </div>
              <FileTree 
                rootPath={folder.path}
                folderId={folder.id}
              />
            </div>
          ))
        ) : (
          // Single root: Show tree directly
          <FileTree 
            rootPath={workspace.folders[0].path}
            folderId={workspace.folders[0].id}
          />
        )}
      </div>
    </div>
  );
};
```

## Priority 4: Recent Workspaces (Tomorrow/Day 3)

### 1. Recent Workspaces Storage

```typescript
// src/main/recentWorkspaces.ts

interface RecentWorkspaceEntry {
  path?: string;        // Path to .vilodocs-workspace file
  folders?: string[];   // For untitled workspaces
  name: string;
  lastOpened: number;
  pinned?: boolean;
}

export class RecentWorkspacesManager {
  private static readonly MAX_RECENT = 10;
  private static readonly STORAGE_KEY = 'recentWorkspaces';
  
  static async add(workspace: Workspace): Promise<void> {
    const recent = this.load();
    
    const entry: RecentWorkspaceEntry = {
      path: workspace.path,
      folders: workspace.path ? undefined : workspace.folders.map(f => f.path),
      name: workspace.name || 'Untitled',
      lastOpened: Date.now()
    };
    
    // Remove existing entry if present
    const index = recent.findIndex(r => 
      r.path === entry.path || 
      JSON.stringify(r.folders) === JSON.stringify(entry.folders)
    );
    
    if (index >= 0) {
      recent.splice(index, 1);
    }
    
    // Add to beginning
    recent.unshift(entry);
    
    // Limit to max
    if (recent.length > this.MAX_RECENT) {
      recent.length = this.MAX_RECENT;
    }
    
    this.save(recent);
  }
  
  static load(): RecentWorkspaceEntry[] {
    const stored = store.get(this.STORAGE_KEY, []);
    return stored;
  }
  
  static save(recent: RecentWorkspaceEntry[]): void {
    store.set(this.STORAGE_KEY, recent);
  }
}
```

### 2. Recent Workspaces Menu

```typescript
// src/main/menu.ts

function updateRecentWorkspacesMenu() {
  const recent = RecentWorkspacesManager.load();
  const menu = Menu.getApplicationMenu();
  const fileMenu = menu?.items.find(i => i.label === 'File');
  const recentSubmenu = fileMenu?.submenu?.items.find(i => i.label === 'Recent Workspaces');
  
  if (recentSubmenu) {
    recentSubmenu.submenu = Menu.buildFromTemplate(
      recent.map((entry, index) => ({
        label: `${index + 1}. ${entry.name}`,
        click: async () => {
          if (entry.path) {
            await WorkspaceManager.getInstance().openWorkspaceFile(entry.path);
          } else if (entry.folders) {
            const workspace = await WorkspaceManager.getInstance().createWorkspaceFromFolders(entry.folders);
            await WorkspaceManager.getInstance().switchToWorkspace(workspace);
          }
        }
      }))
    );
  }
}
```

## Implementation Timeline

### Day 1 (Today)
- [ ] Morning: Create workspace type definitions
- [ ] Morning: Implement WorkspaceFileHandler
- [ ] Afternoon: Start WorkspaceManager service
- [ ] Afternoon: Add IPC handlers

### Day 2 (Tomorrow)
- [ ] Morning: Complete WorkspaceManager
- [ ] Morning: Update application menu
- [ ] Afternoon: Multi-root FileExplorer UI
- [ ] Afternoon: Test workspace save/load

### Day 3
- [ ] Morning: Recent workspaces implementation
- [ ] Morning: Recent workspaces menu
- [ ] Afternoon: Workspace switching UI
- [ ] Afternoon: Integration testing

### Day 4
- [ ] Morning: Settings resolution
- [ ] Afternoon: Variable resolution
- [ ] Full day: Bug fixes and polish

### Day 5
- [ ] Morning: Documentation
- [ ] Afternoon: E2E tests
- [ ] Review and merge

## Testing Checklist

### Unit Tests
- [ ] WorkspaceFileHandler save/load
- [ ] WorkspaceManager operations
- [ ] Recent workspaces management
- [ ] Settings resolution

### Integration Tests
- [ ] Open folder → Save as workspace
- [ ] Open workspace file
- [ ] Add/remove folders from workspace
- [ ] Switch between workspaces
- [ ] Recent workspaces menu

### E2E Tests
- [ ] Complete workspace workflow
- [ ] Multi-root navigation
- [ ] Settings persistence
- [ ] File operations across roots

## Success Criteria

1. **Functional**: Can save and load .vilodocs-workspace files
2. **Multi-root**: Display and navigate multiple folders
3. **Recent**: Track and open recent workspaces
4. **Stable**: No crashes or data loss
5. **Performant**: < 500ms workspace switching

## Notes

- Start with the simplest implementation that works
- Focus on file format compatibility early
- Test with various workspace configurations
- Ensure backward compatibility with single folder mode
- Document the file format for users