# Workspace Implementation Quick Start

## 🚨 READ THIS FIRST
The definitive workspace architecture is documented in [WORKSPACE_ARCHITECTURE_DEFINITIVE.md](WORKSPACE_ARCHITECTURE_DEFINITIVE.md). This quick start guide provides immediate action items based on that analysis.

## Current Reality Check

### ✅ What's Working
- Basic workspace model and types
- Single folder workspaces
- File operations (CRUD)
- State persistence
- Basic .vilodocs-workspace save/load

### ❌ What's Broken
- Multi-root UI (code exists but doesn't display properly)
- Recent workspaces (uses undefined `global.localStorage`)
- No WorkspaceManager service
- State management is fragmented (3 separate systems)

## Priority 1: Fix What's Broken (Do This First!)

### 1. Fix Multi-Root UI Display
**File**: `src/components/explorer/FileExplorer.tsx` (line 177-200)

**Problem**: The multi-root code exists but doesn't render properly

**Quick Fix**:
```typescript
// The code is already there but needs debugging
{state.workspace.type === 'multi' ? (
  <div className="workspace-folders">
    {state.workspace.folders.map(folder => (
      // This should work but check CSS and state
    ))}
  </div>
) : (
  // Single root view
)}
```

### 2. Fix Recent Workspaces Storage
**File**: `src/main/fileSystemHandlers.ts` (line 92-114)

**Problem**: Uses `global.localStorage` which doesn't exist

**Quick Fix**:
```typescript
import Store from 'electron-store';
const store = new Store();

function getRecentWorkspaces(): string[] {
  return store.get('recentWorkspaces', []);
}

function addRecentWorkspace(path: string): void {
  const recent = getRecentWorkspaces();
  const updated = [path, ...recent.filter(p => p !== path)].slice(0, 10);
  store.set('recentWorkspaces', updated);
}
```

### 3. Unify State Management
**Problem**: Three separate state systems:
- `StateManager` (main process)
- `StateService` (renderer)
- `WorkspaceService` (component-level)

**Solution**: Merge WorkspaceService functionality into StateService

## Priority 2: Core Missing Features

### 1. Create WorkspaceManager Service
```typescript
// src/services/WorkspaceManager.ts
export class WorkspaceManager {
  private static instance: WorkspaceManager;
  
  static getInstance(): WorkspaceManager {
    if (!this.instance) {
      this.instance = new WorkspaceManager();
    }
    return this.instance;
  }
  
  async openWorkspace(path: string): Promise<void> {
    // Load workspace file
    // Update state
    // Notify listeners
  }
  
  async saveWorkspace(path?: string): Promise<void> {
    // Get current workspace
    // Save to file
    // Update recent
  }
  
  async addFolder(path: string): Promise<void> {
    // Add to current workspace
    // Update state
  }
  
  async removeFolder(id: string): Promise<void> {
    // Remove from workspace
    // Update state
  }
}
```

### 2. Add Folder Management UI
```typescript
// In FileExplorer.tsx toolbar
<button onClick={handleAddFolder} title="Add Folder to Workspace">
  ➕ Add Folder
</button>

// In each folder header for multi-root
<button onClick={() => handleRemoveFolder(folder.id)} title="Remove from Workspace">
  ✕
</button>
```

### 3. Enhance Workspace File Format
```typescript
// Current (v1)
{
  "version": 1,
  "name": "My Workspace",
  "folders": [...]
}

// Target (v2)
{
  "version": "2.0.0",
  "name": "My Workspace",
  "folders": [...],
  "settings": {
    "editor.fontSize": 14,
    "files.exclude": ["node_modules"]
  },
  "state": {
    "expandedFolders": [...],
    "openEditors": [...]
  }
}
```

## Implementation Order

### Day 1-2: Fix Broken Features
1. [ ] Fix multi-root UI display
2. [ ] Fix recent workspaces storage
3. [ ] Debug why multi-root doesn't show

### Day 3-4: Core Infrastructure
1. [ ] Create WorkspaceManager service
2. [ ] Unify state management
3. [ ] Add IPC handlers for workspace operations

### Day 5: UI Enhancements
1. [ ] Add folder management buttons
2. [ ] Add recent workspaces menu
3. [ ] Test workspace switching

### Week 2: Advanced Features
1. [ ] Implement v2 workspace format
2. [ ] Add settings resolution
3. [ ] Add workspace templates

## Testing Checklist

```typescript
// Quick test scenarios
1. Open single folder → Should create workspace
2. Save workspace → Should create .vilodocs-workspace file
3. Open saved workspace → Should restore state
4. Add second folder → Should show multi-root UI
5. Remove folder → Should update workspace
6. Recent workspaces → Should track and open
```

## Common Pitfalls to Avoid

1. **Don't over-engineer** - Start with fixing what's broken
2. **Don't break existing functionality** - Single folder must keep working
3. **Don't ignore state sync** - Main and renderer must stay in sync
4. **Don't forget cleanup** - File watchers must be disposed

## VSCode Patterns to Follow

1. **Workspace = Container** - Everything belongs to a workspace
2. **Settings Hierarchy** - Folder → Workspace → User → Default
3. **Multi-root First** - Design for multiple folders
4. **File System Abstraction** - Don't use fs directly in components

## Performance Targets

| What | Target | Why |
|------|--------|-----|
| Open workspace | < 500ms | User expectation |
| Switch workspace | < 300ms | Feels instant |
| Add/remove folder | < 100ms | UI responsiveness |
| Save workspace | < 100ms | No blocking |

## Debug Commands

```bash
# Check if workspace is properly loaded
console.log(stateService.getWorkspace())

# Check if multi-root is detected
console.log(workspace.type === 'multi')

# Check file watcher status
console.log(fileWatchers.size)

# Check recent workspaces
console.log(store.get('recentWorkspaces'))
```

## Need Help?

1. Check [WORKSPACE_ARCHITECTURE_DEFINITIVE.md](WORKSPACE_ARCHITECTURE_DEFINITIVE.md) for full details
2. Look at VSCode's implementation for patterns
3. Test incrementally - don't change everything at once
4. Keep backward compatibility with existing workspaces

---

**Remember**: The code is 70% there. Focus on fixing what's broken before adding new features.