# File Explorer & Workspace Design

## VS Code Workspace Concepts

### 1. Workspace Types

#### Single Folder Workspace
- Opens a single root folder
- Most common use case
- Folder path becomes the workspace root
- Settings stored in `.vscode/settings.json`

#### Multi-Root Workspace
- Multiple folders in one workspace
- Each folder is a "workspace folder"
- Saved as `.code-workspace` file
- Independent settings per folder + shared workspace settings

#### Untitled Workspace
- No folder open initially
- Can add folders dynamically
- Temporary until saved as `.code-workspace`

### 2. Workspace File Structure (.code-workspace)

```json
{
  "folders": [
    {
      "path": "../project1",
      "name": "Frontend Project"  // Optional display name
    },
    {
      "path": "../project2",
      "name": "Backend API"
    }
  ],
  "settings": {
    // Workspace-specific settings override user settings
    "editor.fontSize": 14,
    "files.exclude": {
      "**/node_modules": true
    }
  },
  "launch": {
    // Debug configurations
  },
  "tasks": {
    // Build task definitions
  },
  "extensions": {
    "recommendations": ["ms-vscode.vscode-typescript-tslint-plugin"]
  }
}
```

### 3. File Explorer Features

#### Tree View Structure
```
WORKSPACE NAME
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📄 Header.tsx
│   │   └── 📄 Footer.tsx
│   ├── 📄 main.ts
│   └── 📄 renderer.ts
├── 📁 tests/
├── 📄 package.json
└── 📄 README.md
```

#### Core Features
1. **File Operations**
   - Create file/folder (right-click → New File/Folder)
   - Rename (F2 or right-click → Rename)
   - Delete (Delete key or right-click → Delete)
   - Move/Copy (drag & drop or cut/copy/paste)
   - Duplicate (Ctrl+C, Ctrl+V in same location)

2. **Navigation**
   - Single-click: Preview (italic tab)
   - Double-click: Open (permanent tab)
   - Ctrl+Click: Open to side (split)
   - Middle-click on folder: Open in new window
   - Arrow keys: Navigate tree

3. **Visual Indicators**
   - Modified files (dot indicator)
   - Git status (colors: modified, added, deleted, ignored)
   - Problems/errors (badge with count)
   - Collapsed/expanded state persistence

4. **Context Menu Actions**
   - Open to the Side
   - Open With... (choose editor)
   - Reveal in Explorer/Finder
   - Copy Path (absolute)
   - Copy Relative Path

5. **Search & Filter**
   - Filter box (Ctrl+F in explorer)
   - Include/exclude patterns
   - Search within folder

6. **Drag & Drop**
   - Reorder files/folders
   - Move between folders
   - Open from system file explorer
   - Multi-select drag (Ctrl/Shift+Click)

### 4. Workspace-Specific Features

#### Recent Workspaces
- File → Open Recent
- Quick access to recent folders/workspaces
- Pin frequently used workspaces

#### Workspace Settings Hierarchy
1. Default Settings (VS Code defaults)
2. User Settings (~/.config/Code/User/settings.json)
3. Workspace Settings (.code-workspace or .vscode/settings.json)
4. Folder Settings (in multi-root: each folder's .vscode/settings.json)

#### Workspace Trust
- Trusted: Full functionality
- Restricted Mode: Limited extension execution
- Trust on first open prompt

### 5. Implementation Architecture for vilodocs

#### Data Structures

```typescript
interface Workspace {
  type: 'single' | 'multi' | 'untitled';
  folders: WorkspaceFolder[];
  settings: WorkspaceSettings;
  activeFolder?: string; // Current focused folder
}

interface WorkspaceFolder {
  id: string;
  path: string;
  name?: string; // Display name (optional)
  isRoot: boolean;
}

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  parent?: string;
  isExpanded?: boolean;
  isModified?: boolean;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'ignored';
}

interface WorkspaceSettings {
  editor?: EditorSettings;
  files?: FileSettings;
  exclude?: Record<string, boolean>;
  search?: SearchSettings;
}
```

#### Core Components

1. **WorkspaceManager**
   - Load/save workspace files
   - Manage workspace folders
   - Handle workspace settings
   - Recent workspaces tracking

2. **FileExplorer Component**
   - Tree view rendering
   - Folder expand/collapse
   - File selection
   - Drag & drop handling
   - Context menu integration

3. **FileSystemProvider**
   - Abstract file system operations
   - Watch for file changes
   - Handle file events
   - Support virtual file systems

4. **FileWatcher**
   - Monitor file system changes
   - Update tree on external changes
   - Notify about deletions/renames

### 6. User Interactions

#### Opening a Workspace
1. **File → Open Folder**: Single folder workspace
2. **File → Open Workspace**: Open .code-workspace file
3. **File → Add Folder to Workspace**: Convert to multi-root
4. **Drag folder to window**: Open or add to workspace

#### Switching Workspaces
- File → Open Recent
- Command Palette: "Workspaces: Open Workspace"
- Window title shows workspace name

#### Saving Workspace
- File → Save Workspace As...
- Creates .code-workspace file
- Preserves folder configuration and settings

### 7. Integration Points

#### With Existing Panes System
- File Explorer in primary sidebar
- Open files create tabs in editor panes
- Drag files to panes to open
- Support split operations from explorer

#### With Command System
- Commands for all file operations
- Keyboard shortcuts (F2 rename, Delete, etc.)
- Command palette integration

#### With Settings System (Future)
- Workspace settings UI
- Per-folder settings in multi-root
- Settings sync across workspaces

### 8. Implementation Phases

#### Phase 1: Basic File Explorer
- Single folder workspace
- Tree view with expand/collapse
- Basic file operations (create, rename, delete)
- Open files in tabs

#### Phase 2: Multi-Root Workspaces
- Support multiple folders
- .code-workspace file format
- Per-folder settings

#### Phase 3: Advanced Features
- Drag & drop
- Git status integration
- File watching
- Search and filter

#### Phase 4: Workspace Management
- Recent workspaces
- Workspace settings UI
- Workspace trust
- Virtual file systems

## Next Steps

1. Implement FileSystemProvider for Node.js fs operations
2. Create FileExplorer React component with tree view
3. Integrate with existing IPC bridge for file operations
4. Add workspace persistence using .code-workspace format
5. Connect to existing tab and pane system