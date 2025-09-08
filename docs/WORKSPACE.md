# Workspace System Documentation

> **This is the single, consolidated documentation for the workspace system. All other workspace documentation files are deprecated.**

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Quick Fixes Needed](#quick-fixes-needed)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Technical Specifications](#technical-specifications)
6. [Testing Strategy](#testing-strategy)

---

## Current State Analysis

### What Actually Works ✅
| Feature | Status | Location |
|---------|--------|----------|
| Workspace types defined | ✅ Working | `src/common/ipc.ts` |
| Single-folder workspaces | ✅ Working | `src/services/WorkspaceService.ts` |
| File operations (CRUD) | ✅ Working | `src/main/fileSystemHandlers.ts` |
| State persistence | ✅ Working | `src/main/stateManager.ts` |
| File watching | ✅ Working | Uses chokidar |
| Basic .vilodocs-workspace save/load | ✅ Working | `src/main/fileSystemHandlers.ts` |

### What's Partially Working ⚠️
| Feature | Issue | Location |
|---------|-------|----------|
| Multi-root UI | Code exists but doesn't render | `FileExplorer.tsx:177-200` |
| Recent workspaces | Uses undefined `global.localStorage` | `fileSystemHandlers.ts:92-114` |
| Workspace switching | Opens new but doesn't close old | Multiple files |

### What's Completely Missing ❌
- WorkspaceManager service (doesn't exist)
- Workspace-scoped settings
- Add/remove folder operations
- Workspace file associations with OS
- Variable resolution (${workspaceFolder})
- Workspace templates

### State Management Problem
We have **3 separate state systems** that need unification:
1. `StateManager` (main process) - electron-store
2. `StateService` (renderer) - singleton service
3. `WorkspaceService` (component) - local to FileExplorer

---

## Quick Fixes Needed

### 🔴 Priority 1: Fix Recent Workspaces (Broken)
**File**: `src/main/fileSystemHandlers.ts`

```typescript
// BROKEN CODE (line 92-114)
function getRecentWorkspaces(): string[] {
  const stored = global.localStorage?.getItem(RECENT_WORKSPACES_KEY); // ❌ Doesn't exist
  return stored ? JSON.parse(stored) : [];
}

// FIX: Use electron-store instead
import Store from 'electron-store';
const store = new Store();

function getRecentWorkspaces(): string[] {
  return store.get('recentWorkspaces', []);
}

function addRecentWorkspace(workspacePath: string): void {
  const recent = getRecentWorkspaces();
  const updated = [workspacePath, ...recent.filter(p => p !== workspacePath)].slice(0, 10);
  store.set('recentWorkspaces', updated);
}
```

### 🔴 Priority 2: Fix Multi-Root UI Display
**File**: `src/components/explorer/FileExplorer.tsx`

```typescript
// CODE EXISTS BUT DOESN'T WORK (line 177-200)
// The multi-root rendering code is there but not displaying
// Debug why state.workspace.type === 'multi' isn't triggering
```

### 🟡 Priority 3: Unify State Management
Merge `WorkspaceService` into `StateService` to have single source of truth.

---

## Architecture Overview

### Current Workspace Data Flow
```
User Action → FileExplorer → WorkspaceService → IPC → Main Process
                   ↓              ↓                         ↓
              Local State    localStorage           fileSystemHandlers
                                                            ↓
                                                     File System
```

### Target Workspace Data Flow
```
User Action → FileExplorer → StateService → IPC → WorkspaceManager
                   ↓              ↓                      ↓
              React State    Unified State        electron-store
                                                         ↓
                                                   File System
```

### Current Workspace File Format (v1)
```json
{
  "version": 1,
  "name": "My Workspace",
  "folders": [
    {
      "id": "uuid",
      "path": "relative/path",
      "name": "Folder Name"
    }
  ]
}
```

### Target Workspace File Format (v2)
```json
{
  "version": "2.0.0",
  "name": "My Workspace",
  "folders": [
    {
      "path": "relative/path",
      "name": "Folder Name",
      "settings": {}
    }
  ],
  "settings": {
    "editor.fontSize": 14,
    "files.exclude": ["node_modules", ".git"]
  },
  "extensions": {
    "recommendations": []
  },
  "state": {
    "expandedFolders": [],
    "openEditors": []
  }
}
```

---

## Implementation Roadmap

### Week 1: Fix Broken Features ⚡
| Day | Task | Files to Modify |
|-----|------|-----------------|
| 1 | Fix recent workspaces storage | `fileSystemHandlers.ts` |
| 1 | Debug multi-root UI | `FileExplorer.tsx` |
| 2 | Unify state management | `StateService.ts`, `WorkspaceService.ts` |
| 3 | Create WorkspaceManager | New file: `src/main/WorkspaceManager.ts` |
| 4 | Add folder management IPC | `fileSystemHandlers.ts`, `preload.ts` |
| 5 | Test and debug | All workspace files |

### Week 2: Core Features 🎯
| Day | Task | Details |
|-----|------|---------|
| 1-2 | Enhanced workspace format | Implement v2 format with settings |
| 3 | Add/remove folder UI | Buttons in FileExplorer |
| 4 | Recent workspaces menu | Application menu integration |
| 5 | Workspace switching | Close old, open new |

### Week 3: Advanced Features 🚀
| Day | Task | Details |
|-----|------|---------|
| 1-2 | Settings resolution | Folder → Workspace → User → Default |
| 3 | Variable resolution | ${workspaceFolder} support |
| 4 | Workspace templates | Predefined configurations |
| 5 | Performance optimization | Virtual scrolling, lazy loading |

---

## Technical Specifications

### WorkspaceManager Service (To Be Created)
```typescript
// src/main/WorkspaceManager.ts
import Store from 'electron-store';
import { BrowserWindow } from 'electron';

export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private store: Store;
  private currentWorkspace: Workspace | null = null;
  
  private constructor() {
    this.store = new Store();
  }
  
  static getInstance(): WorkspaceManager {
    if (!this.instance) {
      this.instance = new WorkspaceManager();
    }
    return this.instance;
  }
  
  // Core Operations
  async openWorkspace(path: string): Promise<Workspace> {
    // 1. Load workspace file
    // 2. Validate format
    // 3. Migrate if needed
    // 4. Update state
    // 5. Notify renderer
  }
  
  async saveWorkspace(path?: string): Promise<void> {
    // 1. Get current workspace
    // 2. Convert to file format
    // 3. Save to disk
    // 4. Update recent
  }
  
  async addFolder(folderPath: string): Promise<void> {
    // 1. Add to current workspace
    // 2. Update state
    // 3. Save workspace
  }
  
  async removeFolder(folderId: string): Promise<void> {
    // 1. Remove from workspace
    // 2. Update state
    // 3. Save workspace
  }
  
  // Recent Workspaces
  getRecentWorkspaces(): RecentWorkspace[] {
    return this.store.get('recentWorkspaces', []);
  }
  
  private addToRecent(workspace: Workspace): void {
    const recent = this.getRecentWorkspaces();
    // Update recent list
    this.store.set('recentWorkspaces', recent);
  }
}
```

### Settings Resolution System
```typescript
// src/main/SettingsResolver.ts
export class SettingsResolver {
  private layers = new Map<string, any>();
  
  constructor() {
    this.layers.set('default', DEFAULT_SETTINGS);
    this.layers.set('user', this.loadUserSettings());
  }
  
  resolve(key: string, folder?: string): any {
    // Priority: Folder → Workspace → User → Default
    const folderSettings = folder ? this.layers.get(`folder:${folder}`) : null;
    const workspaceSettings = this.layers.get('workspace');
    const userSettings = this.layers.get('user');
    const defaultSettings = this.layers.get('default');
    
    return (
      folderSettings?.[key] ??
      workspaceSettings?.[key] ??
      userSettings?.[key] ??
      defaultSettings?.[key]
    );
  }
}
```

### Performance Optimizations
```typescript
// File Watcher Optimization
class OptimizedFileWatcher {
  private excludes = ['node_modules', '.git', 'dist', '*.log'];
  private debounceMap = new Map<string, NodeJS.Timeout>();
  
  watch(path: string): FSWatcher {
    return chokidar.watch(path, {
      ignored: this.excludes,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('WorkspaceManager', () => {
  test('opens single folder workspace');
  test('opens multi-root workspace');
  test('saves workspace with correct format');
  test('migrates v1 to v2 format');
  test('handles missing folders gracefully');
  test('maintains recent workspaces list');
});

describe('SettingsResolver', () => {
  test('resolves settings in correct order');
  test('handles missing settings gracefully');
  test('merges settings correctly');
});
```

### Integration Tests
```typescript
describe('Workspace Integration', () => {
  test('full workspace lifecycle');
  test('state persists across app restart');
  test('file watching updates UI');
  test('multi-root workspace displays correctly');
});
```

### E2E Test Scenarios
1. Open folder → Save as workspace → Close → Reopen
2. Open workspace → Add folder → Remove folder → Save
3. Switch between recent workspaces
4. Open multi-root workspace → Verify UI display
5. Change settings → Verify resolution

### Manual Testing Checklist
- [ ] Single folder opens correctly
- [ ] Multi-root workspace displays all folders
- [ ] Recent workspaces menu works
- [ ] Add folder to workspace works
- [ ] Remove folder from workspace works
- [ ] Workspace saves and loads correctly
- [ ] Settings resolve in correct order
- [ ] File watching updates UI
- [ ] State persists across restart

---

## Common Issues & Solutions

### Issue: Multi-root not displaying
```typescript
// Debug in FileExplorer.tsx
console.log('Workspace type:', state.workspace?.type);
console.log('Folder count:', state.workspace?.folders.length);
console.log('Is multi?:', state.workspace?.type === 'multi');
```

### Issue: State not syncing
```typescript
// Check IPC communication
window.api.onStateChanged((state) => {
  console.log('State received from main:', state);
});
```

### Issue: File watcher memory leak
```typescript
// Always cleanup watchers
componentWillUnmount() {
  this.workspaceService.cleanup();
}
```

---

## Performance Targets

| Operation | Target | Current | Priority |
|-----------|--------|---------|----------|
| Open workspace | < 500ms | ~1s | High |
| Switch workspace | < 300ms | N/A | High |
| Add/remove folder | < 100ms | N/A | Medium |
| File tree render (10k) | < 100ms | ~500ms | Medium |
| Save workspace | < 100ms | ~150ms | Low |

---

## VSCode Patterns to Apply

1. **Workspace as Container**: Everything belongs to a workspace
2. **Settings Hierarchy**: Clear precedence order
3. **Multi-root First**: Design for multiple folders
4. **File System Provider**: Abstract file operations
5. **Extension Points**: Make system extensible
6. **Variable Resolution**: Support workspace variables
7. **Lazy Loading**: Load only what's needed
8. **Virtual Scrolling**: Handle large file trees

---

## Migration Path

### From v1 to v2 Format
```typescript
function migrateWorkspace(data: any): WorkspaceV2 {
  if (data.version === 1) {
    return {
      version: "2.0.0",
      name: data.name,
      folders: data.folders.map(f => ({
        path: f.path,
        name: f.name
      })),
      settings: {},
      state: {}
    };
  }
  return data;
}
```

---

## Next Steps

### Immediate Actions (Do Today!)
1. **Fix recent workspaces** - 30 minutes
2. **Debug multi-root UI** - 1 hour
3. **Start WorkspaceManager** - 2 hours

### This Week
1. Complete WorkspaceManager service
2. Unify state management
3. Add folder management UI
4. Test workspace switching

### Next Sprint
1. Implement settings resolution
2. Add variable support
3. Create workspace templates
4. Optimize performance

---

## Questions & Decisions Needed

1. **Should we support .code-workspace files?** (For VSCode compatibility)
2. **Should workspace state be in the file or separate?**
3. **How to handle workspace-specific extensions?**
4. **Should we auto-save workspace changes?**
5. **Maximum number of recent workspaces?**

---

## References

- VSCode Workspace API: https://code.visualstudio.com/api/references/vscode-api#workspace
- Electron Store: https://github.com/sindresorhus/electron-store
- Chokidar: https://github.com/paulmillr/chokidar

---

*This document consolidates all workspace-related documentation. Last updated after deep codebase analysis.*