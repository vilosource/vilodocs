# Vilodocs Architecture Guide

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Process Model](#process-model)
4. [State Management](#state-management)
5. [Layout System](#layout-system)
6. [Widget System](#widget-system)
7. [Security Model](#security-model)
8. [Build System](#build-system)
9. [Data Flow](#data-flow)
10. [Architecture Decisions](#architecture-decisions)

## Overview

Vilodocs is a document editor built on Electron, featuring a VS Code-inspired interface with flexible pane management, multi-tab support, and a robust state persistence system. The architecture prioritizes security, performance, and extensibility while maintaining a clean separation of concerns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Main Process                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   App Core  │  │StateManager  │  │ File System      │  │
│  │             │  │              │  │ Handlers         │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ IPC
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                       Preload Script                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Context Bridge API (Type-safe IPC interface)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                      Renderer Process                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ StateService │  │ React App    │  │ Widget System  │   │
│  │ (Singleton)  │  │              │  │                │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Process Model

### Main Process (`src/main.ts`)

The main process is the entry point of the application and runs in a Node.js environment with full system access:

**Responsibilities:**
- Application lifecycle management
- Window creation and management
- Native menu and dialog handling
- File system operations
- State persistence to disk
- IPC message routing

**Key Components:**
- `StateManager`: Manages persistent application state
- `FileSystemHandlers`: Handles all file I/O operations
- `WindowManager`: Controls browser windows

### Renderer Process (`src/renderer/`)

The renderer process runs in a Chromium browser context with restricted access:

**Responsibilities:**
- User interface rendering
- User interaction handling
- Local state management
- Widget rendering
- Layout management

**Security Constraints:**
- No direct Node.js access
- No file system access
- Communication only via IPC
- Sandboxed execution environment

### Preload Script (`src/preload.ts`)

The preload script bridges the gap between main and renderer:

**Features:**
- Runs before renderer page loads
- Has access to limited Node.js APIs
- Uses `contextBridge` for secure API exposure
- Provides typed interfaces for IPC

## State Management

### Architecture Overview

```
┌──────────────────────────────────────────┐
│             Main Process                  │
│  ┌──────────────────────────────────────┐ │
│  │         StateManager                 │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │    electron-store (disk)     │   │ │
│  │  └──────────────────────────────┘   │ │
│  └────────────┬─────────────────────────┘ │
└───────────────┼───────────────────────────┘
                │ IPC: state:changed
                ↓
┌──────────────────────────────────────────┐
│           Renderer Process                │
│  ┌──────────────────────────────────────┐ │
│  │         StateService                 │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │   In-memory state cache      │   │ │
│  │  └──────────────────────────────┘   │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │      EventEmitter            │   │ │
│  │  └──────────────────────────────┘   │ │
│  └────────────┬─────────────────────────┘ │
│               ↓                           │
│  ┌──────────────────────────────────────┐ │
│  │      React Components                │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │   useStateService hooks      │   │ │
│  │  └──────────────────────────────┘   │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### State Shape

```typescript
ApplicationState {
  version: number
  workspace: {
    current: Workspace | null
    recent: RecentWorkspace[]
    expandedFolders: Record<string, string[]>
    selectedPath: string | null
  }
  layout: {
    editorGrid: LayoutNode
    regions: {
      activityBar: {...}
      primarySideBar: {...}
      secondarySideBar: {...}
      panel: {...}
      statusBar: {...}
    }
    lastFocused: {...}
  }
  widgets: {
    [widgetId]: {
      type: string
      state: any
    }
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: number
    ...
  }
}
```

### State Flow

1. **User Action** → Component dispatches action
2. **StateService** → Updates local state optimistically
3. **IPC Call** → Sends update to main process
4. **StateManager** → Persists to disk (debounced)
5. **Broadcast** → Notifies all windows of change
6. **StateService** → Receives confirmation
7. **React Re-render** → UI updates

## Layout System

### Tree Structure

The layout system uses a recursive tree structure:

```
Split (root)
├── Split (horizontal)
│   ├── Leaf (editor-1)
│   │   └── Tabs: [file1.ts, file2.ts]
│   └── Leaf (editor-2)
│       └── Tabs: [file3.ts]
└── Leaf (editor-3)
    └── Tabs: [welcome]
```

### Layout Operations

**Split Operations:**
- `SPLIT_LEAF`: Divides a leaf into two
- `MERGE_LEAF`: Combines adjacent leaves
- `RESIZE_SPLIT`: Adjusts split ratios

**Tab Operations:**
- `ADD_TAB`: Adds tab to leaf
- `CLOSE_TAB`: Removes tab
- `MOVE_TAB`: Transfers between leaves
- `REORDER_TABS`: Changes tab order

### Rendering Pipeline

1. Layout state changes trigger reducer
2. Reducer returns new immutable state
3. React re-renders affected components
4. CSS Flexbox handles sizing
5. ResizeObserver updates constraints

## Widget System

### Widget Lifecycle

```
1. Registration
   ↓
2. Instantiation
   ↓
3. State Initialization
   ↓
4. Rendering
   ↓
5. User Interaction
   ↓
6. State Updates
   ↓
7. Persistence
   ↓
8. Cleanup
```

### Widget Interface

```typescript
interface Widget {
  id: string
  type: string
  defaultState: any
  stateReducer?: (state: any, action: any) => any
  persistKeys?: string[]
  component: React.ComponentType<WidgetProps>
}
```

### Creating a Widget

1. Define widget component
2. Implement state reducer (optional)
3. Register with WidgetRegistry
4. Add to WidgetRenderer switch
5. Handle persistence needs

## Security Model

### Process Isolation

- **Main Process**: Full system access
- **Renderer Process**: Sandboxed, no Node.js
- **Preload Script**: Limited Node.js, secure bridge

### Context Isolation

```javascript
// Preload script
contextBridge.exposeInMainWorld('api', {
  // Only expose safe, validated APIs
  openFile: () => ipcRenderer.invoke('fs:open'),
  // Never expose raw ipcRenderer
})
```

### Security Fuses

Electron Fuses are configured for maximum security:

- `RunAsNode`: Disabled
- `EnableCookieEncryption`: Enabled
- `EnableNodeOptionsEnvironmentVariable`: Disabled
- `EnableNodeCliInspectArguments`: Disabled
- `EnableEmbeddedAsarIntegrityValidation`: Enabled
- `OnlyLoadAppFromAsar`: Enabled

## Build System

### Vite Configuration

Three separate Vite configs optimize each process:

**Main Process (`vite.main.config.ts`)**
- Target: Node.js
- Output: CommonJS
- External: Electron modules

**Preload Script (`vite.preload.config.ts`)**
- Target: Browser
- Output: CommonJS
- Limited Node.js polyfills

**Renderer Process (`vite.renderer.config.ts`)**
- Target: Browser
- Output: ES Modules
- React Fast Refresh
- CSS Modules

### Production Build

```bash
npm run make
```

1. TypeScript compilation
2. Vite bundling
3. Electron Forge packaging
4. Platform-specific makers
5. Code signing (if configured)
6. Output to `out/` directory

## Data Flow

### File Opening Flow

```
User clicks "Open File"
    ↓
React Component
    ↓
window.api.openFile()
    ↓
Preload Script (IPC)
    ↓
Main Process Handler
    ↓
File System Read
    ↓
Return via IPC
    ↓
Update State
    ↓
Re-render UI
```

### State Update Flow

```
User Action
    ↓
Component Dispatch
    ↓
StateService.updateState()
    ↓
Optimistic Update
    ↓
IPC to Main
    ↓
StateManager.save()
    ↓
Persist to Disk
    ↓
Broadcast Change
    ↓
All Windows Update
```

## Architecture Decisions

### Why Service-Oriented State?

**Problem**: React Context caused circular dependencies when used for global state management.

**Solution**: Singleton StateService living outside React, with hooks for integration.

**Benefits**:
- No circular dependencies
- Better testability
- Clear separation of concerns
- Framework-agnostic core

### Why Custom EventEmitter?

**Problem**: Node.js EventEmitter not available in browser/renderer.

**Solution**: Lightweight browser-compatible implementation.

**Benefits**:
- No heavy polyfills
- Smaller bundle size
- Browser-native performance
- Type safety

### Why Tree-Based Layout?

**Problem**: Need infinitely flexible editor layouts like VS Code.

**Solution**: Recursive tree structure with Split/Leaf nodes.

**Benefits**:
- Unlimited nesting
- Simple algorithms
- Predictable behavior
- Easy serialization

### Why Electron Forge?

**Problem**: Complex multi-platform packaging requirements.

**Solution**: Electron Forge with configured makers.

**Benefits**:
- Automated packaging
- Platform-specific outputs
- Code signing support
- GitHub release integration

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: Large file lists
2. **Lazy Loading**: Widgets loaded on-demand
3. **Debounced Saves**: Prevent excessive disk writes
4. **Memoization**: Expensive computations cached
5. **Selective Re-renders**: React.memo and useMemo
6. **Worker Threads**: Heavy processing off main thread

### Memory Management

- Cleanup file watchers on unmount
- Remove event listeners properly
- Clear caches periodically
- Limit history sizes
- Unload inactive widgets

## Future Considerations

### Planned Enhancements

1. **Plugin System**: Dynamic widget loading
2. **Multi-Window**: Synchronized state across windows
3. **Collaborative Editing**: Real-time collaboration
4. **Cloud Sync**: Settings and state synchronization
5. **Extension API**: Third-party extensions
6. **Performance Monitoring**: Built-in profiling

### Scalability Concerns

- State size limits with large workspaces
- IPC message size constraints
- Maximum number of open tabs
- File watcher limits on Linux
- Memory usage with many widgets

## Conclusion

The Vilodocs architecture provides a solid foundation for a modern, extensible document editor. The separation of concerns, type safety, and security-first approach ensure the application remains maintainable and scalable as it grows.