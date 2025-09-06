# File Explorer Implementation Plan

## Overview
Implement a VS Code-style file explorer with workspace support for vilodocs.

## Implementation Phases

### Phase 1: Core File System Integration (Week 1)

#### 1.1 File System Provider
```typescript
// src/services/FileSystemProvider.ts
interface FileSystemProvider {
  readDirectory(path: string): Promise<FileNode[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  stat(path: string): Promise<FileStats>;
  watch(path: string, callback: (event: FileChangeEvent) => void): Disposable;
}
```

#### 1.2 IPC Bridge Extensions
- Add file system methods to preload script
- Implement main process file handlers
- Add security validations for file paths

#### 1.3 Workspace Model
```typescript
// src/models/Workspace.ts
class Workspace {
  type: 'single' | 'multi' | 'untitled';
  folders: WorkspaceFolder[];
  settings: WorkspaceSettings;
  
  static load(path: string): Promise<Workspace>;
  save(path: string): Promise<void>;
  addFolder(folder: WorkspaceFolder): void;
  removeFolder(folderId: string): void;
}
```

### Phase 2: File Explorer UI Component (Week 1-2)

#### 2.1 Tree View Component
```typescript
// src/components/explorer/FileTree.tsx
<FileTree
  workspace={workspace}
  onFileOpen={(file) => openFile(file)}
  onFileCreate={(parent) => createFile(parent)}
  onFileDelete={(file) => deleteFile(file)}
  onFileRename={(file, newName) => renameFile(file, newName)}
/>
```

#### 2.2 Tree Node Component
- Folder expand/collapse
- File/folder icons
- Selection state
- Context menu trigger
- Keyboard navigation

#### 2.3 Explorer Sidebar Integration
```typescript
// Update Shell.tsx sidebar content
{activeView === 'explorer' && (
  <FileExplorer 
    workspace={currentWorkspace}
    onWorkspaceChange={handleWorkspaceChange}
  />
)}
```

### Phase 3: File Operations (Week 2)

#### 3.1 Basic Operations
- **Create File/Folder**: Right-click → New File/Folder or toolbar buttons
- **Rename**: F2 key or right-click → Rename (inline editing)
- **Delete**: Delete key or right-click → Delete (with confirmation)
- **Copy/Paste**: Ctrl+C/Ctrl+V with clipboard integration

#### 3.2 File Opening
- Single-click: Preview mode (italic tab)
- Double-click: Permanent tab
- Ctrl+click: Open to side
- Middle-click: Close folder

#### 3.3 Context Menu
```typescript
interface FileContextMenu {
  items: [
    { label: 'New File', action: 'explorer.newFile', keybinding: 'Ctrl+N' },
    { label: 'New Folder', action: 'explorer.newFolder' },
    { separator: true },
    { label: 'Open to Side', action: 'explorer.openToSide' },
    { label: 'Reveal in Explorer', action: 'explorer.reveal' },
    { separator: true },
    { label: 'Cut', action: 'explorer.cut', keybinding: 'Ctrl+X' },
    { label: 'Copy', action: 'explorer.copy', keybinding: 'Ctrl+C' },
    { label: 'Paste', action: 'explorer.paste', keybinding: 'Ctrl+V' },
    { separator: true },
    { label: 'Rename', action: 'explorer.rename', keybinding: 'F2' },
    { label: 'Delete', action: 'explorer.delete', keybinding: 'Delete' }
  ]
}
```

### Phase 4: Workspace Management (Week 2-3)

#### 4.1 Workspace Operations
- Open Folder (single workspace)
- Open Workspace (.code-workspace file)
- Add Folder to Workspace
- Save Workspace As...
- Recent Workspaces list

#### 4.2 Workspace Persistence
```typescript
// .vilodocs-workspace format
{
  "version": 1,
  "folders": [
    { "path": "./frontend", "name": "Frontend" },
    { "path": "./backend", "name": "Backend" }
  ],
  "settings": {
    "editor.fontSize": 14,
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true
    }
  },
  "openFiles": [
    "/frontend/src/App.tsx",
    "/backend/server.js"
  ],
  "layout": { /* existing panes layout */ }
}
```

#### 4.3 Multi-Root Support
- Display multiple root folders
- Folder name badges
- Independent folder operations
- Cross-folder file operations

### Phase 5: Advanced Features (Week 3)

#### 5.1 File Watching
- Monitor external changes
- Auto-refresh on changes
- Conflict resolution dialogs
- Deleted file handling

#### 5.2 Search & Filter
- Quick filter in explorer (Ctrl+F)
- Include/exclude patterns
- File name search
- Content search (future)

#### 5.3 Drag & Drop
- Reorder files/folders
- Move between folders
- Multi-select operations
- External file drop support

#### 5.4 Git Integration (Optional)
- Show git status colors
- Modified indicators
- .gitignore respect
- Basic git operations

### Phase 6: Integration & Polish (Week 3-4)

#### 6.1 Command Integration
```typescript
// Register explorer commands
commandManager.registerCommand({
  id: 'explorer.openFolder',
  label: 'Open Folder',
  keybinding: 'Ctrl+K Ctrl+O',
  execute: () => openFolderDialog()
});

commandManager.registerCommand({
  id: 'explorer.newFile',
  label: 'New File',
  keybinding: 'Ctrl+N',
  execute: (context) => createNewFile(context.folder)
});
```

#### 6.2 State Management
```typescript
// src/state/explorerReducer.ts
interface ExplorerState {
  workspace: Workspace | null;
  expandedFolders: Set<string>;
  selectedFiles: Set<string>;
  focusedFile: string | null;
  recentWorkspaces: string[];
}
```

#### 6.3 Performance Optimization
- Virtual scrolling for large directories
- Lazy loading of folder contents
- Debounced file watching
- Incremental tree updates

## Technical Decisions

### File System Access
- **Main Process**: All file operations in main process for security
- **IPC Communication**: Async commands with progress reporting
- **Path Validation**: Sanitize and validate all file paths
- **Error Handling**: Graceful failures with user notifications

### State Management
- **Explorer State**: Separate reducer for file explorer
- **Workspace State**: Persistent workspace configuration
- **UI State**: Expanded folders, selection, etc.

### UI/UX Decisions
- **Icons**: Use system icons or icon font (codicons)
- **Tree Indentation**: 20px per level
- **Hover Effects**: Highlight on hover
- **Selection**: Multi-select with Ctrl/Shift
- **Inline Editing**: For rename operations

## Testing Strategy

### Unit Tests
- FileSystemProvider methods
- Workspace model operations
- Tree view logic
- State reducer

### Integration Tests
- File operations through IPC
- Workspace loading/saving
- Tree view interactions

### E2E Tests
- Open folder workflow
- Create/rename/delete operations
- Multi-root workspace
- Drag & drop operations

## Dependencies

### Required Packages
```json
{
  "chokidar": "^3.5.3",  // File watching
  "minimatch": "^9.0.3", // Pattern matching for filters
  "@vscode/codicons": "^0.0.33" // VS Code icons
}
```

### Electron APIs
- `dialog.showOpenDialog()` - Folder selection
- `fs` module - File operations
- `path` module - Path manipulation
- `watch` - File system watching

## Migration Path

1. **Week 1**: Core file system and basic tree view
2. **Week 2**: File operations and workspace basics
3. **Week 3**: Advanced features and multi-root
4. **Week 4**: Polish, testing, and optimization

## Success Criteria

- [ ] Can open and browse folders
- [ ] Can create, rename, delete files/folders
- [ ] Can open files in editor tabs
- [ ] Supports multi-root workspaces
- [ ] Persists workspace state
- [ ] Handles external file changes
- [ ] Keyboard navigation works
- [ ] Drag & drop operations work
- [ ] Performance with 10,000+ files
- [ ] All tests passing

## Open Questions

1. Should we support virtual file systems (e.g., ZIP archives)?
2. How deep should Git integration go in Phase 1?
3. Should we implement our own file icons or use a library?
4. Do we need workspace trust/security features initially?
5. Should search be in explorer or separate panel?

## Next Steps

1. Set up file system IPC bridge
2. Create basic FileSystemProvider
3. Implement FileTree component
4. Add workspace model
5. Integrate with existing tab system