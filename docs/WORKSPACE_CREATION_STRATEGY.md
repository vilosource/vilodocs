# Workspace Creation Strategy Analysis

## Current State
- **Open Folder**: Creates single-folder workspace in memory
- **Open Workspace**: Expects existing `.vilodocs-workspace` file
- **Save Workspace**: Can save current state to file
- **Problem**: No clear path to CREATE a workspace

## Critical Requirements
1. **Must support both single and multi-root workspaces**
2. **Must be intuitive for new users**
3. **Must not pollute project directories unnecessarily**
4. **Must allow workspace portability and sharing**
5. **Must align with existing StateService/WorkspaceService architecture**

## Strategy Options Analysis

### Option 1: VSCode-Style (Recommended) ✅
**Flow:**
```
Open Folder → Single workspace (in memory)
    ↓
Add Folder to Workspace → Multi-root (in memory)
    ↓
Save Workspace As... → Creates .vilodocs-workspace file
```

**Implementation:**
- Add "Add Folder to Workspace" button/command
- Add "Save Workspace As..." command
- Workspaces exist in memory until explicitly saved
- Saved workspaces go wherever user chooses

**Pros:**
- ✅ Familiar to VSCode users
- ✅ No forced file creation
- ✅ Clean project directories
- ✅ Natural progression from simple to complex
- ✅ Aligns with current architecture

**Cons:**
- ❌ Workspace state lost if not saved
- ❌ Users might forget to save

---

### Option 2: Auto-.vilodocs Directory ❌
**Flow:**
```
Open Folder → Check for .vilodocs/workspace.json
    ↓
If missing → Auto-create .vilodocs/workspace.json
```

**Critical Issues:**
- ❌ **Pollutes every project with .vilodocs folder**
- ❌ **Multi-root breaks this model** (which folder gets the .vilodocs?)
- ❌ **Forces opinion on project structure**
- ❌ **Not portable** (workspace tied to specific folder)
- ❌ **Git issues** (users need to .gitignore)

---

### Option 3: Explicit Workspace Creation
**Flow:**
```
Create Workspace → Select folders → Save location → Done
```

**Pros:**
- ✅ Very explicit and clear
- ✅ Good for project templates

**Cons:**
- ❌ **Extra friction for simple use cases**
- ❌ **Not intuitive for single folder projects**
- ❌ Requires users to understand workspaces upfront

---

### Option 4: Hybrid Smart Approach 🎯
**Flow:**
```
Open Folder → Single workspace (in memory)
    ↓
[Optional] Convert to Workspace → Saves .vilodocs-workspace
    ↓
[Optional] Add Folder → Becomes multi-root
    ↓
[Auto-prompt] Save Workspace? → When closing with unsaved changes
```

**Features:**
- Single folders work without any workspace file
- Prompt to save workspace when:
  - Adding second folder
  - Closing with multiple folders
  - User explicitly chooses "Save Workspace"
- Smart workspace location suggestions:
  - For single folder: alongside project
  - For multi-root: user home or documents

---

## Recommended Implementation Plan

### Phase 1: Core Workspace Operations
```typescript
// New IPC Channels needed
AddFolderToWorkspace: 'workspace:add-folder'
RemoveFolderFromWorkspace: 'workspace:remove-folder'  
SaveWorkspaceAs: 'workspace:save-as'
ConvertToWorkspace: 'workspace:convert'
```

### Phase 2: UI Components
1. **File Explorer Header Menu:**
   ```
   [📁] [➕] [💾] [⚙️]
    |    |    |    |
    |    |    |    Settings
    |    |    Save Workspace
    |    Add Folder
    Open Folder
   ```

2. **Multi-root Folder Item Menu:**
   ```
   📁 Source Code        [✖️]
   📁 Tests             [✖️]
   📁 Documentation     [✖️]
   ```

### Phase 3: State Management
```typescript
interface WorkspaceState {
  current: Workspace | null;
  isDirty: boolean;  // Track unsaved changes
  lastSavedPath?: string;  // Track where it was saved
}
```

### Phase 4: Smart Behaviors
1. **Auto-save prompt** when closing with multiple folders
2. **Workspace templates** for common project types
3. **Recent workspaces** includes both saved and unsaved
4. **Workspace settings** in .vilodocs-workspace file

---

## Architecture Alignment

### Current Architecture Strengths:
- ✅ WorkspaceService already handles single/multi
- ✅ StateManager persists workspace state
- ✅ IPC channels exist for basic operations

### What We Need to Add:
1. **WorkspaceManager** service (main process)
   - Handles workspace lifecycle
   - Manages dirty state
   - Prompts for saving

2. **Enhanced WorkspaceService** (renderer)
   - Track workspace modifications
   - Handle add/remove folder operations

3. **Workspace Settings Resolver**
   - Merge user, workspace, and folder settings
   - Handle variable substitution (${workspaceFolder})

---

## Decision Matrix

| Criteria | VSCode-Style | .vilodocs Dir | Explicit | Hybrid |
|----------|-------------|---------------|----------|--------|
| Simplicity | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Multi-root | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Clean Projects | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| User Control | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Discoverability | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommendation: Hybrid Smart Approach

**Why this is best:**
1. **Progressive disclosure** - Simple stays simple, complex is possible
2. **No forced files** - Users control when/where to save
3. **Multi-root friendly** - Natural progression to multi-root
4. **Aligns with architecture** - Minimal changes to existing services
5. **Best UX** - Smart prompts guide users without forcing decisions

**Implementation Priority:**
1. Add "Add Folder to Workspace" (enables multi-root)
2. Add "Save Workspace As..." (enables persistence)  
3. Add dirty state tracking (enables smart prompts)
4. Add workspace templates (enables quick starts)

---

## Next Steps
1. Implement `AddFolderToWorkspace` IPC handler
2. Add UI for adding folders
3. Implement workspace dirty state
4. Add save prompts on close
5. Create workspace templates system