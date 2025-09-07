# Complete Electron Application Setup Guide

This comprehensive guide will help you create a VS Code-style Electron application with a robust architecture, similar to the vilodocs project. Follow these steps to build a production-ready desktop application with TypeScript, React, and modern tooling.

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Architecture Setup](#2-architecture-setup)
3. [Core Configuration Files](#3-core-configuration-files)
4. [Project Structure](#4-project-structure)
5. [Essential Patterns](#5-essential-patterns)
6. [Development Workflow](#6-development-workflow)
7. [VS Code Integration & Theming](#7-vs-code-integration--theming)
8. [Widget Development Guide](#8-widget-development-guide)

---

## 1. Project Initialization

### Step 1.1: Prerequisites

Ensure you have the following installed:
- Node.js 18+ (LTS recommended)
- npm 8+ or yarn
- Git
- VS Code (recommended IDE)

### Step 1.2: Create Project with Electron Forge

```bash
# Create a new directory for your project
mkdir my-electron-app
cd my-electron-app

# Initialize with Electron Forge (using Vite + TypeScript template)
npm init electron-app@latest . -- --template=vite-typescript

# This creates a basic structure, but we'll enhance it significantly
```

### Step 1.3: Install Essential Dependencies

```bash
# Core dependencies
npm install --save \
  react@^19.1.1 \
  react-dom@^19.1.1 \
  electron-store@^10.1.0 \
  uuid@^12.0.0 \
  chokidar@^4.0.3

# Markdown support (if needed)
npm install --save \
  react-markdown@^10.1.0 \
  remark-gfm@^4.0.1 \
  remark-emoji@^5.0.2 \
  remark-math@^6.0.0 \
  rehype-katex@^7.0.1 \
  rehype-highlight@^7.0.2 \
  katex@^0.16.22 \
  github-markdown-css@^5.8.1

# Development dependencies
npm install --save-dev \
  @types/react@^19.1.12 \
  @types/react-dom@^19.1.9 \
  @types/uuid@^10.0.0 \
  @testing-library/react@^16.3.0 \
  @testing-library/jest-dom@^6.8.0 \
  @playwright/test@^1.55.0 \
  vitest@^3.2.4 \
  @vitest/ui@^3.2.4 \
  happy-dom@^18.0.1 \
  @pengx17/electron-forge-maker-appimage@^1.2.1
```

### Step 1.4: Update package.json Scripts

Replace the scripts section in your `package.json`:

```json
{
  "scripts": {
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "publish": "electron-forge publish",
    "lint": "eslint --ext .ts,.tsx .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 2. Architecture Setup

### Step 2.1: Multi-Process Architecture

Electron applications use three main processes:

#### Main Process (`src/main.ts`)
The main process runs Node.js and controls the application lifecycle:

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { StateManager } from './main/stateManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let stateManager: StateManager;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Initialize state manager
  stateManager = new StateManager();
};

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

#### Preload Script (`src/preload.ts`)
Securely bridges main and renderer processes:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Define the API exposed to the renderer
const api = {
  // State management
  getState: () => ipcRenderer.invoke('state:get'),
  saveState: (state: any) => ipcRenderer.invoke('state:save', state),
  onStateChange: (callback: (state: any) => void) => {
    ipcRenderer.on('state:changed', (_event, state) => callback(state));
  },

  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (data: { content: string; path?: string }) => 
    ipcRenderer.invoke('file:save', data),
  
  // Workspace operations
  openFolder: () => ipcRenderer.invoke('workspace:open'),
  watchFolder: (path: string) => ipcRenderer.invoke('workspace:watch', path),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// TypeScript support
export type ElectronAPI = typeof api;
```

#### Renderer Process (`src/renderer/index.tsx`)
The UI layer using React:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 2.2: Service-Oriented State Management

Create a robust state management system:

#### StateManager (Main Process) - `src/main/stateManager.ts`

```typescript
import Store from 'electron-store';
import { BrowserWindow } from 'electron';

interface AppState {
  layout: any;
  workspace: {
    recentFolders: string[];
    currentFolder?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    fontSize: number;
  };
}

export class StateManager {
  private store: Store<AppState>;
  
  constructor() {
    this.store = new Store<AppState>({
      defaults: {
        layout: null,
        workspace: {
          recentFolders: []
        },
        preferences: {
          theme: 'dark',
          fontSize: 14
        }
      }
    });
  }

  getState(): AppState {
    return this.store.store;
  }

  saveState(state: Partial<AppState>): void {
    Object.entries(state).forEach(([key, value]) => {
      this.store.set(key as keyof AppState, value);
    });
    
    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('state:changed', this.getState());
    });
  }
}
```

#### StateService (Renderer Process) - `src/renderer/services/StateService.ts`

```typescript
// Browser-compatible EventEmitter
class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.events.get(event)?.delete(listener);
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(listener => listener(...args));
  }
}

// State Service
export class StateService extends EventEmitter {
  private static instance: StateService;
  private state: any = {};

  private constructor() {
    super();
    this.loadInitialState();
    this.setupListeners();
  }

  static getInstance(): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService();
    }
    return StateService.instance;
  }

  private async loadInitialState(): Promise<void> {
    try {
      this.state = await window.api.getState();
      this.emit('stateLoaded', this.state);
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  private setupListeners(): void {
    window.api.onStateChange((newState) => {
      this.state = newState;
      this.emit('stateChanged', newState);
    });
  }

  getState(): any {
    return this.state;
  }

  async updateState(updates: any): Promise<void> {
    this.state = { ...this.state, ...updates };
    await window.api.saveState(updates);
    this.emit('stateChanged', this.state);
  }
}

export const stateService = StateService.getInstance();
```

---

## 3. Core Configuration Files

### Step 3.1: TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", ".vite"]
}
```

### Step 3.2: Vite Configuration Files

#### Main Process (`vite.main.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Ensure Node.js modules work correctly
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
```

#### Preload Script (`vite.preload.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
});
```

#### Renderer Process (`vite.renderer.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
    },
  },
});
```

### Step 3.3: Electron Forge Configuration (`forge.config.ts`)

```typescript
import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon', // Add your icon files
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'MyElectronApp',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Your Name',
          homepage: 'https://your-website.com',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    {
      name: '@pengx17/electron-forge-maker-appimage',
      config: {
        options: {
          name: 'MyElectronApp',
          productName: 'My Electron App',
          genericName: 'Document Editor',
          categories: ['Office', 'TextEditor'],
        },
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
```

### Step 3.4: Testing Configuration

#### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup/test-setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        'src/main.ts',
        'src/preload.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
    },
  },
});
```

#### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.e2e.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },
});
```

### Step 3.5: Git Configuration (`.gitignore`)

```gitignore
# Dependencies
node_modules/
jspm_packages/

# Build outputs
out/
dist/
.vite/
.webpack/
*.tsbuildinfo

# Testing
coverage/
*.lcov
playwright-report/
test-results/
playwright/.cache/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo

# Environment
.env
.env.test
.env.local
.env.production

# Cache
.npm
.eslintcache
.cache/

# Temporary
*.tmp
*.temp
tmp/
temp/
```

---

## 4. Project Structure

Create the following directory structure:

```
my-electron-app/
├── src/
│   ├── main/                    # Main process code
│   │   ├── fileSystemHandlers.ts
│   │   ├── stateManager.ts
│   │   └── windowManager.ts
│   │
│   ├── renderer/                 # Renderer process (UI)
│   │   ├── components/          # React components
│   │   │   ├── layout/
│   │   │   │   ├── Shell.tsx
│   │   │   │   ├── ActivityBar.tsx
│   │   │   │   ├── SideBar.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   └── Panel.tsx
│   │   │   ├── editor/
│   │   │   │   ├── EditorGrid.tsx
│   │   │   │   ├── EditorLeaf.tsx
│   │   │   │   └── TabBar.tsx
│   │   │   ├── widgets/
│   │   │   │   ├── TextEditor.tsx
│   │   │   │   ├── MarkdownViewer.tsx
│   │   │   │   └── WidgetRenderer.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Icon.tsx
│   │   │       └── SplitContainer.tsx
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── StateService.ts
│   │   │   ├── ThemeService.ts
│   │   │   ├── WidgetRegistry.ts
│   │   │   └── WorkspaceService.ts
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useStateService.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useDragDrop.ts
│   │   │
│   │   ├── state/               # State management
│   │   │   ├── layoutReducer.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── utils/               # Utility functions
│   │   │   ├── id-generator.ts
│   │   │   └── storage-utils.ts
│   │   │
│   │   ├── themes/              # Theme definitions
│   │   │   ├── dark.css
│   │   │   └── light.css
│   │   │
│   │   ├── App.tsx              # Main React component
│   │   ├── App.css
│   │   ├── index.tsx            # React entry point
│   │   └── index.css            # Global styles
│   │
│   ├── common/                  # Shared between processes
│   │   ├── ipc.ts              # IPC channel definitions
│   │   └── types.ts            # Shared TypeScript types
│   │
│   ├── main.ts                  # Main process entry
│   ├── preload.ts              # Preload script
│   └── global.d.ts             # Global TypeScript definitions
│
├── tests/                       # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── setup/
│
├── assets/                      # Static assets
│   ├── icons/
│   └── fonts/
│
├── docs/                        # Documentation
│   └── architecture/
│
├── forge.config.ts
├── tsconfig.json
├── package.json
├── vite.main.config.ts
├── vite.preload.config.ts
├── vite.renderer.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── .gitignore
```

### Key Files to Create

#### `src/global.d.ts` - Type Definitions

```typescript
import { ElectronAPI } from './preload';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

// Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
```

#### `src/common/ipc.ts` - IPC Channel Definitions

```typescript
export const IPC_CHANNELS = {
  // State management
  STATE_GET: 'state:get',
  STATE_SAVE: 'state:save',
  STATE_CHANGED: 'state:changed',
  
  // File operations
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:save-as',
  
  // Workspace
  WORKSPACE_OPEN: 'workspace:open',
  WORKSPACE_WATCH: 'workspace:watch',
  WORKSPACE_CHANGED: 'workspace:changed',
  
  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;
```

---

## 5. Essential Patterns

### Step 5.1: Command System

Create a flexible command system for keyboard shortcuts and actions:

```typescript
// src/renderer/commands/CommandManager.ts
export interface Command {
  id: string;
  label: string;
  keybinding?: string;
  when?: (context: any) => boolean;
  execute: (context?: any) => void;
}

export class CommandManager {
  private commands: Map<string, Command> = new Map();
  private keybindings: Map<string, string> = new Map();

  constructor() {
    this.setupKeyboardListener();
  }

  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
    
    if (command.keybinding) {
      this.keybindings.set(
        this.normalizeKeybinding(command.keybinding),
        command.id
      );
    }
  }

  executeCommand(id: string, context?: any): boolean {
    const command = this.commands.get(id);
    if (!command) return false;

    if (command.when && !command.when(context)) {
      return false;
    }

    command.execute(context);
    return true;
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e) => {
      const keybinding = this.eventToKeybinding(e);
      const commandId = this.keybindings.get(keybinding);
      
      if (commandId) {
        e.preventDefault();
        this.executeCommand(commandId);
      }
    });
  }

  private normalizeKeybinding(keybinding: string): string {
    return keybinding
      .toLowerCase()
      .split('+')
      .sort()
      .join('+');
  }

  private eventToKeybinding(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }
}
```

### Step 5.2: Layout State Management with Reducer

```typescript
// src/renderer/state/layoutReducer.ts
import { Tab, LayoutNode, Leaf } from './types';

export interface EditorGridState {
  root: LayoutNode;
  activeLeafId: string;
  leafMap: Map<string, Leaf>;
  focusHistory: string[];
}

export type LayoutAction =
  | { type: 'ADD_TAB'; payload: { leafId: string; tab: Tab } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'ACTIVATE_TAB'; payload: { tabId: string } }
  | { type: 'SPLIT_LEAF'; payload: { 
      leafId: string; 
      direction: 'horizontal' | 'vertical' 
    }}
  | { type: 'FOCUS_LEAF'; payload: { leafId: string } };

export function layoutReducer(
  state: EditorGridState,
  action: LayoutAction
): EditorGridState {
  switch (action.type) {
    case 'ADD_TAB': {
      const { leafId, tab } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf) return state;
      
      const updatedLeaf = {
        ...leaf,
        tabs: [...leaf.tabs, tab],
        activeTabId: tab.id,
      };
      
      const newLeafMap = new Map(state.leafMap);
      newLeafMap.set(leafId, updatedLeaf);
      
      return {
        ...state,
        leafMap: newLeafMap,
        root: updateLeafInTree(state.root, updatedLeaf),
      };
    }
    
    case 'CLOSE_TAB': {
      // Implementation for closing tabs
      return state;
    }
    
    case 'ACTIVATE_TAB': {
      // Implementation for activating tabs
      return state;
    }
    
    case 'SPLIT_LEAF': {
      // Implementation for splitting panes
      return state;
    }
    
    case 'FOCUS_LEAF': {
      const { leafId } = action.payload;
      
      return {
        ...state,
        activeLeafId: leafId,
        focusHistory: [
          ...state.focusHistory.filter(id => id !== leafId),
          leafId
        ],
      };
    }
    
    default:
      return state;
  }
}

// Helper function to update a leaf in the tree
function updateLeafInTree(
  node: LayoutNode,
  updatedLeaf: Leaf
): LayoutNode {
  if (node.type === 'leaf' && node.id === updatedLeaf.id) {
    return updatedLeaf;
  }
  
  if (node.type === 'split') {
    return {
      ...node,
      children: node.children.map(child => 
        updateLeafInTree(child, updatedLeaf)
      ),
    };
  }
  
  return node;
}
```

### Step 5.3: Drag and Drop System

```typescript
// src/renderer/dnd/DragDropManager.ts
export interface DragData {
  type: 'tab' | 'file' | 'panel';
  payload: any;
}

export class DragDropManager {
  private dragData: DragData | null = null;
  private dropTargets: Set<HTMLElement> = new Set();
  
  startDrag(data: DragData): void {
    this.dragData = data;
    document.body.classList.add('dragging');
  }
  
  endDrag(): void {
    this.dragData = null;
    document.body.classList.remove('dragging');
    this.clearDropTargets();
  }
  
  getDragData(): DragData | null {
    return this.dragData;
  }
  
  registerDropTarget(element: HTMLElement): void {
    this.dropTargets.add(element);
    
    element.addEventListener('dragover', this.handleDragOver);
    element.addEventListener('drop', this.handleDrop);
    element.addEventListener('dragleave', this.handleDragLeave);
  }
  
  unregisterDropTarget(element: HTMLElement): void {
    this.dropTargets.delete(element);
    
    element.removeEventListener('dragover', this.handleDragOver);
    element.removeEventListener('drop', this.handleDrop);
    element.removeEventListener('dragleave', this.handleDragLeave);
  }
  
  private handleDragOver = (e: DragEvent): void => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  };
  
  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    // Emit custom event with drag data
    const event = new CustomEvent('custom-drop', {
      detail: this.dragData,
      bubbles: true,
    });
    target.dispatchEvent(event);
    
    this.endDrag();
  };
  
  private handleDragLeave = (e: DragEvent): void => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  };
  
  private clearDropTargets(): void {
    this.dropTargets.forEach(target => {
      target.classList.remove('drag-over');
    });
  }
}

export const dragDropManager = new DragDropManager();
```

---

## 6. Development Workflow

### Step 6.1: Development Commands

```bash
# Start development server with hot reload
npm start

# Run unit tests with Vitest
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Build for production
npm run package

# Create distributables
npm run make
```

### Step 6.2: Testing Strategy

#### Unit Test Example (`tests/unit/StateService.test.ts`)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateService } from '@/renderer/services/StateService';

describe('StateService', () => {
  let service: StateService;
  
  beforeEach(() => {
    // Mock window.api
    global.window = {
      api: {
        getState: vi.fn().mockResolvedValue({ test: 'data' }),
        saveState: vi.fn().mockResolvedValue(undefined),
        onStateChange: vi.fn(),
      },
    } as any;
    
    service = StateService.getInstance();
  });
  
  it('should load initial state', async () => {
    await service.loadState();
    expect(window.api.getState).toHaveBeenCalled();
    expect(service.getState()).toEqual({ test: 'data' });
  });
  
  it('should update state', async () => {
    const updates = { newField: 'value' };
    await service.updateState(updates);
    
    expect(window.api.saveState).toHaveBeenCalledWith(updates);
  });
});
```

#### E2E Test Example (`tests/e2e/app.e2e.spec.ts`)

```typescript
import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.'],
  });
  
  page = await app.firstWindow();
});

test.afterAll(async () => {
  await app.close();
});

test('should display main window', async () => {
  const title = await page.title();
  expect(title).toBeTruthy();
  
  // Check for no console errors
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  
  await page.waitForTimeout(1000);
  expect(errors).toHaveLength(0);
});

test('should open file', async () => {
  // Test file operations
  await page.keyboard.press('Control+O');
  // Add assertions
});
```

### Step 6.3: Debugging Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron-forge",
      "args": ["start", "--inspect-brk=5858"],
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron-forge.cmd"
      },
      "autoAttachChildProcesses": true
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "runtimeArgs": [
        "${workspaceFolder}/.",
        "--remote-debugging-port=9223"
      ],
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

---

## 7. VS Code Integration & Theming

### Step 7.1: Theme System Implementation

Create a comprehensive theming system that matches VS Code's appearance:

#### Theme Service (`src/renderer/services/ThemeService.ts`)

```typescript
export type Theme = 'dark' | 'light' | 'high-contrast';

interface ThemeColors {
  // Editor colors
  'editor.background': string;
  'editor.foreground': string;
  'editor.lineHighlightBackground': string;
  'editor.selectionBackground': string;
  
  // Activity Bar
  'activityBar.background': string;
  'activityBar.foreground': string;
  'activityBar.inactiveForeground': string;
  'activityBar.border': string;
  
  // Side Bar
  'sideBar.background': string;
  'sideBar.foreground': string;
  'sideBar.border': string;
  
  // Status Bar
  'statusBar.background': string;
  'statusBar.foreground': string;
  'statusBar.border': string;
  
  // Tabs
  'tab.activeBackground': string;
  'tab.activeForeground': string;
  'tab.inactiveBackground': string;
  'tab.inactiveForeground': string;
  'tab.border': string;
  
  // Panel
  'panel.background': string;
  'panel.border': string;
  
  // Input
  'input.background': string;
  'input.foreground': string;
  'input.border': string;
  
  // Button
  'button.background': string;
  'button.foreground': string;
  'button.hoverBackground': string;
  
  // List
  'list.activeSelectionBackground': string;
  'list.activeSelectionForeground': string;
  'list.hoverBackground': string;
  'list.inactiveSelectionBackground': string;
}

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme = 'dark';
  private themes: Record<Theme, ThemeColors>;
  
  private constructor() {
    this.themes = {
      dark: this.getDarkTheme(),
      light: this.getLightTheme(),
      'high-contrast': this.getHighContrastTheme(),
    };
    
    this.loadTheme();
  }
  
  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }
  
  private getDarkTheme(): ThemeColors {
    return {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2d2e',
      'editor.selectionBackground': '#264f78',
      
      'activityBar.background': '#333333',
      'activityBar.foreground': '#cccccc',
      'activityBar.inactiveForeground': '#868686',
      'activityBar.border': '#3c3c3c',
      
      'sideBar.background': '#252526',
      'sideBar.foreground': '#cccccc',
      'sideBar.border': '#3c3c3c',
      
      'statusBar.background': '#007acc',
      'statusBar.foreground': '#ffffff',
      'statusBar.border': '#0066aa',
      
      'tab.activeBackground': '#1e1e1e',
      'tab.activeForeground': '#ffffff',
      'tab.inactiveBackground': '#2d2d30',
      'tab.inactiveForeground': '#969696',
      'tab.border': '#252526',
      
      'panel.background': '#1e1e1e',
      'panel.border': '#3c3c3c',
      
      'input.background': '#3c3c3c',
      'input.foreground': '#cccccc',
      'input.border': '#3c3c3c',
      
      'button.background': '#0e639c',
      'button.foreground': '#ffffff',
      'button.hoverBackground': '#1177bb',
      
      'list.activeSelectionBackground': '#094771',
      'list.activeSelectionForeground': '#ffffff',
      'list.hoverBackground': '#2a2d2e',
      'list.inactiveSelectionBackground': '#37373d',
    };
  }
  
  private getLightTheme(): ThemeColors {
    return {
      'editor.background': '#ffffff',
      'editor.foreground': '#333333',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#add6ff',
      
      'activityBar.background': '#2c2c2c',
      'activityBar.foreground': '#ffffff',
      'activityBar.inactiveForeground': '#a0a0a0',
      'activityBar.border': '#2c2c2c',
      
      'sideBar.background': '#f3f3f3',
      'sideBar.foreground': '#333333',
      'sideBar.border': '#e7e7e7',
      
      'statusBar.background': '#007acc',
      'statusBar.foreground': '#ffffff',
      'statusBar.border': '#0066aa',
      
      'tab.activeBackground': '#ffffff',
      'tab.activeForeground': '#333333',
      'tab.inactiveBackground': '#ececec',
      'tab.inactiveForeground': '#6f6f6f',
      'tab.border': '#e7e7e7',
      
      'panel.background': '#ffffff',
      'panel.border': '#e7e7e7',
      
      'input.background': '#ffffff',
      'input.foreground': '#333333',
      'input.border': '#cecece',
      
      'button.background': '#007acc',
      'button.foreground': '#ffffff',
      'button.hoverBackground': '#0062a3',
      
      'list.activeSelectionBackground': '#0074e8',
      'list.activeSelectionForeground': '#ffffff',
      'list.hoverBackground': '#e8e8e8',
      'list.inactiveSelectionBackground': '#e4e6f1',
    };
  }
  
  private getHighContrastTheme(): ThemeColors {
    // Implementation for high contrast theme
    return this.getDarkTheme(); // Placeholder
  }
  
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme();
    
    // Save preference
    stateService.updateState({
      preferences: { theme }
    });
  }
  
  private loadTheme(): void {
    const savedTheme = stateService.getState()?.preferences?.theme;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme();
  }
  
  private applyTheme(): void {
    const colors = this.themes[this.currentTheme];
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--vscode-${key.replace(/\./g, '-')}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Apply theme class
    document.body.className = `theme-${this.currentTheme}`;
  }
}
```

#### Base CSS with Theme Variables (`src/renderer/index.css`)

```css
:root {
  /* Theme spacing variables */
  --theme-spacing-xs: 2px;
  --theme-spacing-sm: 4px;
  --theme-spacing-md: 8px;
  --theme-spacing-lg: 16px;
  --theme-spacing-xl: 24px;
  
  /* Border radius */
  --theme-radius-sm: 2px;
  --theme-radius-md: 4px;
  --theme-radius-lg: 6px;
  
  /* Font sizes */
  --theme-font-size-xs: 11px;
  --theme-font-size-sm: 12px;
  --theme-font-size-md: 13px;
  --theme-font-size-lg: 14px;
  --theme-font-size-xl: 16px;
  
  /* Font families */
  --theme-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                       Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', 
                       sans-serif;
  --theme-font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono',
                            Menlo, Consolas, 'Courier New', monospace;
  
  /* Transitions */
  --theme-transition-fast: 100ms ease;
  --theme-transition-medium: 200ms ease;
  --theme-transition-slow: 300ms ease;
  
  /* Shadows */
  --theme-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --theme-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);
  --theme-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.2);
  --theme-shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.25);
  
  /* Z-index layers */
  --theme-z-normal: 0;
  --theme-z-above: 1;
  --theme-z-dropdown: 100;
  --theme-z-sticky: 200;
  --theme-z-fixed: 300;
  --theme-z-modal-backdrop: 1000;
  --theme-z-modal: 1050;
  --theme-z-popover: 1100;
  --theme-z-tooltip: 1200;
  --theme-z-notification: 1300;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size-md);
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(121, 121, 121, 0.4);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.7);
}

/* Focus styles */
:focus {
  outline: 1px solid var(--vscode-focusBorder, #007acc);
  outline-offset: -1px;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* Selection */
::selection {
  background-color: var(--vscode-editor-selectionBackground);
}
```

### Step 7.2: Layout Components

#### Shell Component (`src/renderer/components/layout/Shell.tsx`)

```tsx
import React, { ReactNode } from 'react';
import { ActivityBar } from './ActivityBar';
import { SideBar } from './SideBar';
import { StatusBar } from './StatusBar';
import { Panel } from './Panel';
import './Shell.css';

interface ShellProps {
  children: ReactNode;
  onCommand?: (commandId: string, context?: any) => void;
  onOpenFile?: (path: string, content: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  onCommand,
  onOpenFile 
}) => {
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [panelVisible, setPanelVisible] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState('explorer');
  
  return (
    <div className="shell">
      <div className="shell-header">
        {/* Optional title bar for custom frame */}
      </div>
      
      <div className="shell-body">
        <ActivityBar 
          selectedActivity={selectedActivity}
          onActivitySelect={setSelectedActivity}
        />
        
        {sidebarVisible && (
          <SideBar 
            activity={selectedActivity}
            onOpenFile={onOpenFile}
          />
        )}
        
        <div className="shell-main">
          <div className="shell-editors">
            {children}
          </div>
          
          {panelVisible && (
            <Panel />
          )}
        </div>
      </div>
      
      <StatusBar />
    </div>
  );
};
```

#### Shell Styles (`src/renderer/components/layout/Shell.css`)

```css
.shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.shell-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.shell-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.shell-editors {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Activity Bar */
.activity-bar {
  width: 48px;
  background-color: var(--vscode-activityBar-background);
  border-right: 1px solid var(--vscode-activityBar-border);
  display: flex;
  flex-direction: column;
}

.activity-bar-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--vscode-activityBar-inactiveForeground);
  transition: color var(--theme-transition-fast);
}

.activity-bar-item:hover {
  color: var(--vscode-activityBar-foreground);
}

.activity-bar-item.active {
  color: var(--vscode-activityBar-foreground);
  position: relative;
}

.activity-bar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--vscode-activityBar-foreground);
}

/* Sidebar */
.sidebar {
  width: 240px;
  min-width: 170px;
  max-width: 50%;
  background-color: var(--vscode-sideBar-background);
  border-right: 1px solid var(--vscode-sideBar-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 35px;
  padding: 0 var(--theme-spacing-md);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--vscode-sideBar-border);
  font-size: var(--theme-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-content {
  flex: 1;
  overflow: auto;
}

/* Status Bar */
.status-bar {
  height: 22px;
  background-color: var(--vscode-statusBar-background);
  color: var(--vscode-statusBar-foreground);
  border-top: 1px solid var(--vscode-statusBar-border);
  display: flex;
  align-items: center;
  padding: 0 var(--theme-spacing-md);
  font-size: var(--theme-font-size-sm);
}

.status-bar-item {
  padding: 0 var(--theme-spacing-sm);
  display: flex;
  align-items: center;
}

.status-bar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Panel */
.panel {
  height: 200px;
  min-height: 100px;
  max-height: 50%;
  background-color: var(--vscode-panel-background);
  border-top: 1px solid var(--vscode-panel-border);
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 35px;
  display: flex;
  align-items: center;
  padding: 0 var(--theme-spacing-md);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.panel-tabs {
  display: flex;
  gap: var(--theme-spacing-xs);
}

.panel-tab {
  padding: var(--theme-spacing-xs) var(--theme-spacing-md);
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--vscode-tab-inactiveForeground);
  font-size: var(--theme-font-size-sm);
}

.panel-tab.active {
  color: var(--vscode-tab-activeForeground);
  border-bottom: 1px solid var(--vscode-tab-activeForeground);
}

.panel-content {
  flex: 1;
  overflow: auto;
  padding: var(--theme-spacing-md);
}
```

---

## 8. Widget Development Guide

### Step 8.1: Widget System Architecture

The widget system allows you to create pluggable components that can be rendered in tabs. Each widget is a self-contained unit with its own state and lifecycle.

#### Widget Registry (`src/renderer/services/WidgetRegistry.ts`)

```typescript
import React from 'react';

export interface WidgetDefinition {
  id: string;
  name: string;
  icon: string;
  extensions?: string[];
  mimeTypes?: string[];
  component: React.ComponentType<WidgetProps>;
  canHandle?: (context: WidgetContext) => boolean;
  priority?: number;
}

export interface WidgetProps {
  tab: Tab;
  isActive: boolean;
  onContentChange?: (tabId: string, content: string) => void;
  onDirtyChange?: (tabId: string, isDirty: boolean) => void;
  onSwitchWidget?: (tabId: string, newWidgetType: string) => void;
}

export interface WidgetContext {
  filePath?: string;
  content?: string;
  mimeType?: string;
}

export interface Tab {
  id: string;
  title: string;
  icon: string;
  closeable: boolean;
  dirty: boolean;
  filePath?: string;
  widget: {
    type: string;
    props: any;
  };
}

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetDefinition> = new Map();
  private extensionMap: Map<string, string[]> = new Map();
  
  private constructor() {
    this.registerDefaultWidgets();
  }
  
  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }
  
  registerWidget(definition: WidgetDefinition): void {
    this.widgets.set(definition.id, definition);
    
    // Map file extensions to widget IDs
    if (definition.extensions) {
      definition.extensions.forEach(ext => {
        const normalizedExt = ext.toLowerCase().replace(/^\./, '');
        
        if (!this.extensionMap.has(normalizedExt)) {
          this.extensionMap.set(normalizedExt, []);
        }
        
        this.extensionMap.get(normalizedExt)!.push(definition.id);
      });
    }
  }
  
  getWidget(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }
  
  getWidgetForFile(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    if (ext) {
      const widgetIds = this.extensionMap.get(ext);
      
      if (widgetIds && widgetIds.length > 0) {
        // Sort by priority and return highest
        const widgets = widgetIds
          .map(id => this.widgets.get(id)!)
          .filter(Boolean)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        return widgets[0].id;
      }
    }
    
    // Default to text editor
    return 'text-editor';
  }
  
  getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
  
  private registerDefaultWidgets(): void {
    // These will be registered by individual widget files
    // when they're imported
  }
}

// Export singleton instance
export default WidgetRegistry.getInstance();
```

### Step 8.2: Creating a Text Editor Widget

```typescript
// src/renderer/components/widgets/TextEditor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WidgetProps } from '../../services/WidgetRegistry';
import './TextEditor.css';

export const TextEditor: React.FC<WidgetProps> = ({
  tab,
  isActive,
  onContentChange,
  onDirtyChange
}) => {
  const [content, setContent] = useState(tab.widget.props?.content || '');
  const [originalContent] = useState(tab.widget.props?.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus when becoming active
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);
  
  // Handle content changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Notify parent of content change
    if (onContentChange) {
      onContentChange(tab.id, newContent);
    }
    
    // Update dirty state
    if (onDirtyChange) {
      const isDirty = newContent !== originalContent;
      onDirtyChange(tab.id, isDirty);
    }
  }, [tab.id, originalContent, onContentChange, onDirtyChange]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Trigger save through parent
      window.api.saveFile({
        content,
        path: tab.filePath
      });
    }
    
    // Tab key handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = 
        content.substring(0, start) +
        '  ' + // 2 spaces for tab
        content.substring(end);
      
      setContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }, [content, tab.filePath]);
  
  return (
    <div className="text-editor">
      <textarea
        ref={textareaRef}
        className="text-editor-textarea"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Start typing..."
      />
    </div>
  );
};

// Register the widget
import WidgetRegistry from '../../services/WidgetRegistry';

WidgetRegistry.registerWidget({
  id: 'text-editor',
  name: 'Text Editor',
  icon: '📝',
  extensions: ['.txt', '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.json'],
  component: TextEditor,
  priority: 10
});
```

#### Text Editor Styles (`TextEditor.css`)

```css
.text-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.text-editor-textarea {
  flex: 1;
  width: 100%;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  border: none;
  outline: none;
  font-family: var(--theme-font-family-mono);
  font-size: var(--theme-font-size-md);
  line-height: 1.5;
  padding: var(--theme-spacing-md);
  resize: none;
}

.text-editor-textarea::selection {
  background-color: var(--vscode-editor-selectionBackground);
}
```

### Step 8.3: Creating a Markdown Viewer Widget

```typescript
// src/renderer/components/widgets/MarkdownViewer.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { WidgetProps } from '../../services/WidgetRegistry';
import 'github-markdown-css/github-markdown.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';

export const MarkdownViewer: React.FC<WidgetProps> = ({
  tab,
  isActive,
  onSwitchWidget
}) => {
  const [content] = useState(tab.widget.props?.content || '');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Handle double-click to edit
  const handleDoubleClick = () => {
    if (onSwitchWidget) {
      onSwitchWidget(tab.id, 'text-editor');
    }
  };
  
  return (
    <div 
      className="markdown-viewer"
      onDoubleClick={handleDoubleClick}
    >
      <div className="markdown-viewer-toolbar">
        <button 
          className="markdown-viewer-button"
          onClick={() => onSwitchWidget?.(tab.id, 'text-editor')}
          title="Edit Markdown"
        >
          Edit
        </button>
      </div>
      
      <div className="markdown-viewer-content markdown-body">
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            remarkEmoji,
            remarkMath
          ]}
          rehypePlugins={[
            rehypeKatex,
            [rehypeHighlight, { detect: true }]
          ]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// Register the widget
import WidgetRegistry from '../../services/WidgetRegistry';

WidgetRegistry.registerWidget({
  id: 'markdown-viewer',
  name: 'Markdown Viewer',
  icon: '📄',
  extensions: ['.md', '.markdown'],
  component: MarkdownViewer,
  priority: 20
});
```

### Step 8.4: Widget Renderer Component

```typescript
// src/renderer/components/widgets/WidgetRenderer.tsx
import React from 'react';
import WidgetRegistry, { WidgetProps } from '../../services/WidgetRegistry';

interface WidgetRendererProps extends Omit<WidgetProps, 'tab'> {
  tab: WidgetProps['tab'];
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  tab,
  ...props
}) => {
  const widgetDef = WidgetRegistry.getWidget(tab.widget.type);
  
  if (!widgetDef) {
    return (
      <div className="widget-error">
        <p>Unknown widget type: {tab.widget.type}</p>
      </div>
    );
  }
  
  const WidgetComponent = widgetDef.component;
  
  return (
    <div className="widget-container">
      <WidgetComponent tab={tab} {...props} />
    </div>
  );
};
```

### Step 8.5: Creating Custom Widgets

Here's a template for creating your own custom widget:

```typescript
// src/renderer/components/widgets/MyCustomWidget.tsx
import React, { useState, useEffect } from 'react';
import { WidgetProps } from '../../services/WidgetRegistry';
import './MyCustomWidget.css';

interface MyCustomWidgetState {
  // Define your widget's state
  data: any;
  loading: boolean;
  error: string | null;
}

export const MyCustomWidget: React.FC<WidgetProps> = ({
  tab,
  isActive,
  onContentChange,
  onDirtyChange,
  onSwitchWidget
}) => {
  const [state, setState] = useState<MyCustomWidgetState>({
    data: null,
    loading: false,
    error: null
  });
  
  // Initialize widget
  useEffect(() => {
    loadData();
  }, [tab.filePath]);
  
  // Handle activation
  useEffect(() => {
    if (isActive) {
      // Perform actions when widget becomes active
      console.log('Widget activated:', tab.id);
    }
  }, [isActive, tab.id]);
  
  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Load your widget's data
      const content = tab.widget.props?.content;
      
      // Process the content
      const processedData = await processContent(content);
      
      setState(prev => ({
        ...prev,
        data: processedData,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };
  
  const processContent = async (content: string): Promise<any> => {
    // Implement your content processing logic
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ processed: content });
      }, 100);
    });
  };
  
  const handleAction = () => {
    // Handle user actions
    const newContent = JSON.stringify(state.data);
    
    if (onContentChange) {
      onContentChange(tab.id, newContent);
    }
    
    if (onDirtyChange) {
      onDirtyChange(tab.id, true);
    }
  };
  
  if (state.loading) {
    return (
      <div className="my-custom-widget loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }
  
  if (state.error) {
    return (
      <div className="my-custom-widget error">
        <p>Error: {state.error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="my-custom-widget">
      <div className="widget-toolbar">
        <button onClick={handleAction}>Perform Action</button>
        <button onClick={() => onSwitchWidget?.(tab.id, 'text-editor')}>
          Switch to Editor
        </button>
      </div>
      
      <div className="widget-content">
        {/* Render your widget's content */}
        <pre>{JSON.stringify(state.data, null, 2)}</pre>
      </div>
    </div>
  );
};

// Register the widget
import WidgetRegistry from '../../services/WidgetRegistry';

WidgetRegistry.registerWidget({
  id: 'my-custom-widget',
  name: 'My Custom Widget',
  icon: '🎨',
  extensions: ['.custom', '.special'],
  mimeTypes: ['application/x-custom'],
  component: MyCustomWidget,
  priority: 15,
  canHandle: (context) => {
    // Optional: Add custom logic to determine if this widget
    // can handle the given context
    return context.filePath?.includes('special') || false;
  }
});
```

### Step 8.6: Widget Best Practices

1. **State Management**
   - Keep widget state local when possible
   - Use the provided callbacks for parent communication
   - Avoid direct DOM manipulation

2. **Performance**
   - Implement proper cleanup in useEffect
   - Use React.memo for expensive renders
   - Debounce frequent updates

3. **Accessibility**
   - Add proper ARIA labels
   - Support keyboard navigation
   - Maintain focus management

4. **Error Handling**
   - Always handle loading and error states
   - Provide user feedback for actions
   - Implement retry mechanisms

5. **Testing Your Widget**

```typescript
// tests/unit/MyCustomWidget.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyCustomWidget } from '@/renderer/components/widgets/MyCustomWidget';
import { vi } from 'vitest';

describe('MyCustomWidget', () => {
  const mockTab = {
    id: 'test-tab',
    title: 'Test File',
    icon: '📄',
    closeable: true,
    dirty: false,
    widget: {
      type: 'my-custom-widget',
      props: { content: 'test content' }
    }
  };
  
  it('should render without errors', () => {
    render(
      <MyCustomWidget 
        tab={mockTab}
        isActive={true}
      />
    );
    
    expect(screen.getByText(/Perform Action/)).toBeInTheDocument();
  });
  
  it('should handle content changes', () => {
    const onContentChange = vi.fn();
    
    render(
      <MyCustomWidget 
        tab={mockTab}
        isActive={true}
        onContentChange={onContentChange}
      />
    );
    
    fireEvent.click(screen.getByText('Perform Action'));
    
    expect(onContentChange).toHaveBeenCalledWith(
      'test-tab',
      expect.any(String)
    );
  });
});
```

---

## Conclusion

This guide provides a comprehensive foundation for building a VS Code-style Electron application. The architecture is designed to be:

- **Scalable**: Service-oriented architecture allows easy addition of features
- **Maintainable**: Clear separation of concerns and TypeScript support
- **Performant**: Vite for fast development, efficient state management
- **Extensible**: Widget system allows for plugin-like functionality
- **Professional**: Matches VS Code's UI/UX patterns

### Next Steps

1. **Customize the theme** to match your brand
2. **Add more widgets** for different file types
3. **Implement language servers** for code intelligence
4. **Add version control integration** (Git)
5. **Create custom panels** for specialized tools
6. **Implement settings/preferences UI**
7. **Add telemetry and error reporting**
8. **Set up CI/CD pipeline** for automated builds

### Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Forge](https://www.electronforge.io/)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [VS Code Extension API](https://code.visualstudio.com/api) (for inspiration)

### Support

For questions and issues:
- Check the Electron community forums
- Review VS Code's source code for implementation ideas
- Use Chrome DevTools for debugging the renderer process
- Use VS Code's debugger for the main process

Remember: Building a desktop application is an iterative process. Start with the basics, test thoroughly, and gradually add complexity as needed.