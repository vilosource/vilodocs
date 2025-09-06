# State Management Architecture

## UPDATE: Service-Oriented Architecture (Latest)

Following research into VSCode and modern Electron app architectures, we've implemented a **service-oriented state management** pattern that avoids circular dependencies and aligns with professional Electron applications.

### Key Components:

1. **StateService (Renderer Process)**
   - Singleton service that manages state outside of React
   - Communicates with main process via IPC
   - Uses EventEmitter for reactivity
   - Located in `src/renderer/services/StateService.ts`

2. **React Hooks Bridge**
   - Custom hooks that bridge StateService with React components
   - Trigger re-renders when state changes
   - Located in `src/renderer/hooks/useStateService.ts`

3. **Main Process StateManager**
   - Uses electron-store for persistence
   - Handles IPC requests from renderer
   - Single source of truth for application state

### Benefits:
- No circular dependencies
- Components can import and use state directly
- Aligns with VSCode's architecture pattern
- More scalable and maintainable

---

## Original Design (Deprecated)

## Overview

This document describes the centralized state management system for vilodocs, following Electron and VSCode best practices. The architecture ensures proper separation between main and renderer processes, provides a single source of truth for application state, and supports extensible widget development.

## Core Principles

1. **Main Process Authority**: All persistent state is managed by the main process
2. **Single Source of Truth**: One centralized state store for the entire application
3. **Type Safety**: Full TypeScript support with typed IPC channels
4. **Performance**: Debounced saves and efficient state synchronization
5. **Security**: Renderer process has limited access through contextBridge
6. **Extensibility**: Easy to add new widgets with automatic state persistence

## Architecture Components

### 1. Main Process State Manager

Located at `src/main/stateManager.ts`, this service:
- Manages all application state persistence
- Uses electron-store for file-based storage
- Handles state migrations between versions
- Provides IPC handlers for state operations

### 2. State Schema

```typescript
interface ApplicationState {
  version: number;
  workspace: WorkspaceState;
  layout: LayoutState;
  widgets: WidgetStates;
  preferences: UserPreferences;
}

interface WorkspaceState {
  current: Workspace | null;
  recent: RecentWorkspace[];
  expandedFolders: Record<string, string[]>; // workspace id -> expanded paths
}

interface LayoutState {
  editorGrid: LayoutNode;
  regions: {
    activityBar: { visible: boolean };
    primarySideBar: { visible: boolean; width: number; activeView: string };
    secondarySideBar: { visible: boolean; width: number };
    panel: { visible: boolean; position: 'bottom' | 'right'; height: number };
    statusBar: { visible: boolean };
  };
  lastFocused: {
    region: string;
    leafId?: string;
    tabId?: string;
  };
}

interface WidgetStates {
  [widgetId: string]: {
    type: string;
    state: any; // Widget-specific state
  };
}
```

### 3. IPC Communication Layer

#### Channels (defined in `src/common/ipc.ts`)

```typescript
enum StateChannels {
  // State operations
  LoadState = 'state:load',
  SaveState = 'state:save',
  UpdateState = 'state:update',
  
  // State events
  StateChanged = 'state:changed',
  StateSaved = 'state:saved',
  StateError = 'state:error',
  
  // Widget operations
  RegisterWidget = 'widget:register',
  UpdateWidgetState = 'widget:update',
  GetWidgetState = 'widget:get',
}
```

#### Preload API

```typescript
// Exposed through contextBridge
interface StateAPI {
  // Load complete state
  loadState(): Promise<ApplicationState>;
  
  // Save complete state
  saveState(state: ApplicationState): Promise<void>;
  
  // Partial updates
  updateWorkspace(workspace: WorkspaceState): Promise<void>;
  updateLayout(layout: LayoutState): Promise<void>;
  updateWidget(widgetId: string, state: any): Promise<void>;
  
  // Listeners
  onStateChanged(callback: (state: ApplicationState) => void): () => void;
}
```

### 4. Renderer Process Architecture

#### State Provider (`src/renderer/state/StateProvider.tsx`)

React Context that:
- Connects to main process via IPC
- Provides global state to all components
- Handles state synchronization
- Manages local state updates with debouncing

```typescript
interface StateContextValue {
  state: ApplicationState;
  updateWorkspace: (workspace: Partial<WorkspaceState>) => void;
  updateLayout: (layout: Partial<LayoutState>) => void;
  updateWidget: (widgetId: string, state: any) => void;
  registerWidget: (widget: WidgetRegistration) => void;
}
```

#### Widget Registration

Widgets register themselves with the state system:

```typescript
interface WidgetRegistration {
  id: string;
  type: string;
  defaultState: any;
  stateReducer?: (state: any, action: any) => any;
  persistKeys?: string[]; // Specific keys to persist
}
```

### 5. State Flow

```
1. Application Start
   ├─> Main process loads state from disk
   ├─> Renderer requests initial state via IPC
   └─> State Provider distributes to components

2. User Interaction
   ├─> Component updates local state
   ├─> State Provider debounces update
   ├─> IPC message to main process
   ├─> Main process updates and persists
   └─> Broadcasts change to all windows

3. Application Close
   ├─> Final state sync
   ├─> Main process saves to disk
   └─> Cleanup
```

## Implementation Details

### Storage Location

Using electron-store, state is stored at:
- **Windows**: `%APPDATA%/vilodocs/state.json`
- **macOS**: `~/Library/Application Support/vilodocs/state.json`
- **Linux**: `~/.config/vilodocs/state.json`

### Performance Optimizations

1. **Debouncing**: State saves are debounced by 500ms
2. **Selective Updates**: Only changed portions are sent via IPC
3. **Compression**: Large state objects are compressed before storage
4. **Caching**: Frequently accessed state is cached in renderer

### Error Handling

1. **Validation**: State is validated against schema before save
2. **Migrations**: Automatic migration from older state versions
3. **Fallbacks**: Corrupted state falls back to defaults
4. **Recovery**: Backup state file maintained

### Security Considerations

1. **Context Isolation**: Renderer has no direct file system access
2. **Input Validation**: All IPC messages are validated
3. **Limited API**: Only necessary operations exposed
4. **Sanitization**: User input sanitized before storage

## Migration Path

### From Current Implementation

1. **Phase 1**: Implement main process state manager
2. **Phase 2**: Add IPC communication layer
3. **Phase 3**: Create State Provider in renderer
4. **Phase 4**: Migrate components incrementally
5. **Phase 5**: Remove old persistence code

### Data Migration

On first run with new system:
1. Check for existing localStorage data
2. Migrate to new state format
3. Save to electron-store
4. Clear old localStorage
5. Mark migration complete

## Benefits

### For Users
- Faster application startup
- Reliable state persistence
- No lost settings or layouts
- Consistent experience across sessions

### For Developers
- Easy to add new widgets
- Type-safe state management
- Clear separation of concerns
- Testable architecture
- Extensible design

## Future Enhancements

1. **Cloud Sync**: Sync state across devices
2. **Profiles**: Multiple state profiles
3. **Import/Export**: Share configurations
4. **State History**: Undo/redo support
5. **Performance Metrics**: State operation monitoring

## Testing Strategy

1. **Unit Tests**: State manager logic
2. **Integration Tests**: IPC communication
3. **E2E Tests**: Full state lifecycle
4. **Migration Tests**: Data migration paths
5. **Performance Tests**: Large state handling

## Conclusion

This architecture provides a robust, scalable foundation for state management in vilodocs, aligning with Electron best practices and supporting future growth of the application.