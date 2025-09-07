# Key Architecture Points - Vilodocs

This document outlines the 12 key architectural patterns and components that form the foundation of the Vilodocs application. Each point represents a critical design decision that shapes how the application functions.

## 1. Multi-Process Architecture (Electron)

The application follows Electron's multi-process architecture for security and stability:

- **Main Process** (`src/main.ts`)
  - Manages application lifecycle
  - Creates and controls BrowserWindow instances
  - Handles native OS interactions
  - Manages file system operations
  - Controls application menus and dialogs

- **Renderer Process** (`src/renderer/`)
  - Runs the React-based UI in a sandboxed browser environment
  - Isolated from Node.js APIs for security
  - Communicates with main process via IPC only
  - Manages UI state and user interactions

- **Preload Script** (`src/preload.ts`)
  - Secure bridge between main and renderer processes
  - Uses contextBridge API to expose safe APIs
  - Prevents direct Node.js access from renderer
  - Defines typed API surface for renderer

## 2. Service-Oriented State Management

A sophisticated state management system inspired by VS Code's architecture:

- **StateManager** (Main Process)
  - Centralized persistent state using electron-store
  - Handles all disk I/O for state persistence
  - Manages state migrations and versioning
  - Broadcasts state changes to all windows

- **StateService** (Renderer Process)
  - Singleton service pattern avoiding React circular dependencies
  - Lives outside React component tree
  - Manages renderer-side state cache
  - Provides hooks for React integration

- **Browser-Compatible EventEmitter**
  - Custom implementation for renderer process
  - Replaces Node.js EventEmitter which isn't available
  - Enables pub/sub pattern for state changes

- **IPC-Based State Sync**
  - Bidirectional state synchronization
  - Debounced saves to prevent excessive disk writes
  - Optimistic updates with eventual consistency

## 3. VS Code-Inspired Layout System

A flexible, tree-based layout system that mimics VS Code's editor grid:

- **Tree-Based Layout**
  - Recursive Split/Leaf node structure
  - Splits contain child nodes (horizontal/vertical)
  - Leaves contain tabs (actual content)
  - Infinitely nestable for complex layouts

- **Dynamic Pane System**
  - Supports horizontal and vertical splits
  - Resizable panels with min/max constraints
  - Drag-to-split functionality
  - Automatic cleanup of empty panes

- **Multi-Tab Architecture**
  - Each leaf can contain multiple tabs
  - Active tab tracking per leaf
  - Tab reordering within leaves
  - Tab movement between leaves

- **Region-Based UI**
  - Activity Bar: Primary navigation
  - Primary/Secondary Sidebars: Tool panels
  - Editor Grid: Main content area
  - Panel: Bottom/right auxiliary space
  - Status Bar: Application status

## 4. Widget-Based Content System

An extensible widget system for rendering different content types:

- **Widget Registry**
  - Centralized widget type registration
  - Each widget defines its own state shape
  - Supports custom persistence strategies
  - Enables plugin-like extensibility

- **WidgetRenderer**
  - Dynamic component rendering based on widget type
  - Type-safe widget props
  - Lazy loading support for code splitting
  - Error boundaries for widget isolation

- **Widget State Persistence**
  - Per-widget state management
  - Selective persistence (some state ephemeral)
  - Widget-specific reducers for state updates
  - State migration support per widget

## 5. Command & Keyboard Architecture

A comprehensive command system for all application actions:

- **CommandManager**
  - Centralized command registration
  - Command ID namespacing
  - Context-aware command availability
  - Command history and undo/redo support

- **Keybinding System**
  - JSON-configurable keybindings
  - Support for chord sequences (e.g., Ctrl+K Ctrl+S)
  - Platform-specific bindings
  - Conflict detection and resolution

- **Command Pattern**
  - Decouples action execution from triggers
  - Enables multiple triggers per command
  - Supports programmatic execution
  - Facilitates testing and automation

## 6. Focus Management System

Sophisticated focus tracking and navigation:

- **FocusManager**
  - Tracks all focusable elements
  - Maintains focus history stack
  - Supports focus restoration
  - Handles element removal gracefully

- **Group-Based Focus**
  - Elements organized in logical groups
  - Tab navigation within groups
  - F6 navigation between groups
  - Focus trapping for modals

- **Focus History**
  - Last-active focus restoration
  - Navigation breadcrumbs
  - Quick-switch between recent items
  - Persistent focus across operations

## 7. Drag & Drop System

Complete drag-and-drop implementation for tabs and files:

- **DragDropManager**
  - Centralized drag state management
  - Handles both tab and file dragging
  - Supports cross-window dragging
  - Ghost image generation

- **Drop Zone Detection**
  - Edge-based drop zones for splitting
  - Center drop for tab addition
  - Visual feedback during drag
  - Hover delay for auto-expand

- **Visual Feedback**
  - DockOverlay component shows drop zones
  - Highlighted drop targets
  - Preview of resulting layout
  - Smooth animations

## 8. File System Integration

Comprehensive file system capabilities:

- **File System Handlers**
  - Async file operations with proper error handling
  - File watching with debounced updates
  - Bulk operations support
  - Cross-platform path handling

- **Workspace Management**
  - Single-folder workspace support
  - Multi-root workspace capability
  - Workspace settings persistence
  - Recent workspaces tracking

- **File Tree Explorer**
  - Hierarchical file browser
  - Lazy loading for performance
  - Expansion state persistence
  - File decoration system

## 9. Build & Deployment Pipeline

Modern build and packaging infrastructure:

- **Vite Build System**
  - Separate configs for main/preload/renderer
  - Hot Module Replacement in development
  - Tree shaking and code splitting
  - TypeScript support with fast transpilation

- **Electron Forge**
  - Automated packaging for all platforms
  - Makers for AppImage, DEB, RPM, ZIP
  - Code signing configuration
  - Auto-update support

- **Security Fuses**
  - ASAR integrity validation
  - Node.js disabled in renderer
  - Context isolation enforced
  - Cookie encryption enabled

- **GitHub Publisher**
  - Automated release creation
  - Asset upload to GitHub releases
  - Draft/pre-release support
  - Release notes generation

## 10. Reducer-Based UI State

Predictable state updates using Redux patterns:

- **layoutReducer**
  - Immutable state updates
  - Time-travel debugging capability
  - Optimized re-renders
  - Action logging for debugging

- **Action-Based Updates**
  - Type-safe action definitions
  - Centralized action creators
  - Middleware support
  - Action batching for performance

- **Leaf Map Optimization**
  - Cached leaf references
  - O(1) leaf lookups
  - Automatic cache invalidation
  - Memory-efficient storage

## 11. IPC Communication Layer

Type-safe inter-process communication:

- **Typed Channels**
  - Strongly-typed channel definitions
  - Compile-time safety
  - Auto-completion support
  - Documentation generation

- **RendererApis Interface**
  - Complete API surface definition
  - Promise-based async operations
  - Error propagation
  - Request/response patterns

- **Async/Await Pattern**
  - Modern promise-based APIs
  - Proper error handling
  - Request cancellation support
  - Timeout handling

## 12. Component Architecture

Well-organized, reusable component system:

- **Shared Components**
  - TabStrip: Tab management UI
  - SplitContainer: Resizable split panels
  - ResizeGutter: Draggable resize handles
  - Common UI primitives

- **Layout Components**
  - Shell: Application container
  - ActivityBar: Primary navigation
  - SideBar: Collapsible tool panels
  - Panel: Auxiliary content area

- **Editor Components**
  - EditorGrid: Main editor container
  - EditorSplit: Split management
  - EditorLeaf: Tab container
  - TabBar: Tab UI and interactions

- **Widget Components**
  - TextEditor: Code/text editing
  - WelcomeWidget: Getting started
  - FileExplorer: File browsing
  - Extensible widget system

---

## Architecture Principles

These architectural decisions follow several key principles:

1. **Separation of Concerns**: Each system handles a specific responsibility
2. **Type Safety**: TypeScript throughout with strict typing
3. **Performance**: Optimized rendering and state updates
4. **Extensibility**: Plugin-like architecture for widgets and commands
5. **Security**: Sandboxed renderer with controlled IPC
6. **Developer Experience**: Clear APIs and good debugging tools
7. **User Experience**: Responsive UI with visual feedback
8. **Maintainability**: Clean code organization and documentation