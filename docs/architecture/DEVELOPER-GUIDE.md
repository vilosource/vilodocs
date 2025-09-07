# Vilodocs Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Project Structure](#project-structure)
4. [Adding New Features](#adding-new-features)
5. [State Management](#state-management)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Best Practices](#best-practices)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0 (v20 LTS recommended)
- **npm** ≥ 8.0.0
- **Git**
- **VS Code** (recommended editor)
- **Linux/macOS/Windows** development environment

### Initial Setup

```bash
# Clone the repository
git clone git@github.com:vilosource/vilodocs.git
cd vilodocs

# Install dependencies
npm install

# Start development server
npm start
```

### VS Code Setup

Recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tsc",
    "bradlc.vscode-tailwindcss",
    "csstools.postcss"
  ]
}
```

## Development Workflow

### Daily Development

```bash
# Start the application in dev mode
npm start

# The app will launch with:
# - Hot Module Replacement (HMR)
# - DevTools enabled
# - Source maps
# - Auto-restart on main process changes
```

### Code Organization

```
src/
├── main/                 # Main process code
│   ├── stateManager.ts   # State persistence
│   └── fileSystemHandlers.ts
├── renderer/             # Renderer process code
│   ├── services/         # Singleton services
│   ├── hooks/           # React hooks
│   └── utils/           # Utilities
├── components/          # React components
│   ├── layout/          # Layout components
│   ├── editor/          # Editor components
│   ├── widgets/         # Widget components
│   └── shared/          # Shared components
├── common/              # Shared types/constants
├── preload.ts           # Preload script
└── main.ts             # Main entry point
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to origin
git push origin feature/your-feature

# Create pull request on GitHub
```

### Commit Convention

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

## Project Structure

### Main Process (`src/main/`)

The main process handles:
- Window management
- File system operations
- State persistence
- Native OS integration

**Key Files:**
- `stateManager.ts` - Persistent state management
- `fileSystemHandlers.ts` - File I/O operations

### Renderer Process (`src/renderer/`)

The renderer process contains:
- React application
- UI components
- State services
- User interactions

**Key Directories:**
- `services/` - Singleton services (StateService)
- `hooks/` - Custom React hooks
- `utils/` - Helper utilities

### Components (`src/components/`)

Organized by feature:
- `layout/` - Shell, ActivityBar, SideBar
- `editor/` - EditorGrid, EditorLeaf, EditorSplit
- `widgets/` - TextEditor, WelcomeWidget
- `shared/` - TabStrip, ResizeGutter

### Common (`src/common/`)

Shared between processes:
- `ipc.ts` - IPC channel definitions
- `state-types.ts` - State type definitions

## Adding New Features

### Adding a New Widget

1. **Create Widget Component**

```typescript
// src/components/widgets/MyWidget.tsx
import React from 'react';

interface MyWidgetProps {
  content?: string;
  onContentChange?: (content: string) => void;
}

export const MyWidget: React.FC<MyWidgetProps> = ({
  content = '',
  onContentChange
}) => {
  return (
    <div className="my-widget">
      {/* Widget implementation */}
    </div>
  );
};
```

2. **Register in WidgetRenderer**

```typescript
// src/components/widgets/WidgetRenderer.tsx
import { MyWidget } from './MyWidget';

switch (tab.widget.type) {
  case 'my-widget':
    return <MyWidget {...props} />;
  // ...
}
```

3. **Add Widget State (Optional)**

```typescript
// src/common/state-types.ts
export interface MyWidgetState {
  // Widget-specific state
}
```

### Adding a New Command

1. **Define Command**

```typescript
// src/commands/myCommands.ts
export const myCommand: Command = {
  id: 'myapp.myCommand',
  label: 'My Command',
  keybinding: 'Ctrl+Shift+M',
  execute: (context) => {
    // Command implementation
  }
};
```

2. **Register Command**

```typescript
// src/commands/CommandManager.ts
commandManager.registerCommand(myCommand);
```

### Adding IPC Channels

1. **Define Channel**

```typescript
// src/common/ipc.ts
export const Channels = {
  // ...
  MyChannel: 'app:my-channel',
} as const;
```

2. **Add Handler (Main Process)**

```typescript
// src/main.ts
ipcMain.handle(Channels.MyChannel, async (event, data) => {
  // Handle request
  return result;
});
```

3. **Expose API (Preload)**

```typescript
// src/preload.ts
const api: RendererApis = {
  myMethod: (data) => ipcRenderer.invoke(Channels.MyChannel, data),
};
```

4. **Use in Renderer**

```typescript
// Component
const result = await window.api.myMethod(data);
```

## State Management

### State Flow

```
User Action → Component → StateService → IPC → Main Process → Disk
                ↓                ↓
            Local Update    Broadcast to All Windows
```

### Using State in Components

```typescript
import { useWorkspaceState } from '../renderer/hooks/useStateService';

function MyComponent() {
  const { workspace, updateWorkspace } = useWorkspaceState();
  
  const handleChange = () => {
    updateWorkspace({
      // New workspace state
    });
  };
  
  return <div>{workspace.current?.name}</div>;
}
```

### Adding State Sections

1. **Define State Shape**

```typescript
// src/common/state-types.ts
export interface MyFeatureState {
  enabled: boolean;
  settings: Record<string, any>;
}
```

2. **Add to ApplicationState**

```typescript
export interface ApplicationState {
  // ...
  myFeature: MyFeatureState;
}
```

3. **Create Hook**

```typescript
// src/renderer/hooks/useStateService.ts
export function useMyFeatureState() {
  const stateService = StateService.getInstance();
  const [state, setState] = useState(stateService.getMyFeature());
  
  useEffect(() => {
    const handler = () => setState(stateService.getMyFeature());
    stateService.on('myFeatureChanged', handler);
    return () => stateService.off('myFeatureChanged', handler);
  }, []);
  
  return {
    myFeature: state,
    updateMyFeature: (data) => stateService.updateMyFeature(data),
  };
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Open Playwright UI
npm run test:e2e:ui
```

### Writing Tests

**Component Test:**

```typescript
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**E2E Test:**

```typescript
// myfeature.e2e.spec.ts
import { test, expect, ElectronApplication } from '@playwright/test';

test('my feature works', async ({ app }) => {
  const window = await app.firstWindow();
  await window.click('button#my-button');
  await expect(window.locator('.result')).toBeVisible();
});
```

## Debugging

### Main Process

1. **VS Code Launch Config:**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Main Process",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": ["."],
  "env": {
    "NODE_ENV": "development"
  }
}
```

2. **Console Logging:**

```typescript
// Main process logs appear in terminal
console.log('Main:', data);
```

### Renderer Process

1. **Chrome DevTools:**
   - Press `F12` or `Ctrl+Shift+I`
   - Use React DevTools extension
   - Check Console, Network, Performance tabs

2. **Debug Statements:**

```typescript
// Renderer logs appear in DevTools Console
console.log('Renderer:', data);
```

### IPC Debugging

```typescript
// Log IPC messages
ipcMain.on('*', (event, channel, ...args) => {
  console.log('IPC:', channel, args);
});
```

## Best Practices

### TypeScript

- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use generics for reusable code

### React

- Use functional components
- Implement error boundaries
- Memoize expensive computations
- Clean up effects properly

### State Management

- Keep state minimal
- Use optimistic updates
- Debounce saves
- Handle errors gracefully

### Security

- Never expose Node.js to renderer
- Validate all IPC inputs
- Use context isolation
- Enable all security fuses

### Performance

- Lazy load widgets
- Use virtual scrolling for lists
- Debounce expensive operations
- Profile with Chrome DevTools

## Common Tasks

### Building for Production

```bash
# Package application
npm run package

# Create installers
npm run make

# Output in out/make/
```

### Updating Dependencies

```bash
# Check outdated
npm outdated

# Update dependencies
npm update

# Update Electron
npm install electron@latest --save-dev
```

### Adding Icons

1. Place icons in `assets/icons/`
2. Import in component:

```typescript
import myIcon from '../../assets/icons/my-icon.svg';
```

### Configuring Build

Edit `forge.config.ts`:

```typescript
makers: [
  {
    name: '@electron-forge/maker-deb',
    config: {
      // Debian package config
    }
  }
]
```

## Troubleshooting

### Common Issues

**Issue: App won't start**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Hot reload not working**
```bash
# Restart dev server
# Check Vite config
# Verify file watching
```

**Issue: IPC not responding**
- Check channel names match
- Verify handler registered
- Check for errors in main process console

**Issue: State not persisting**
- Check StateManager initialization
- Verify electron-store permissions
- Check for serialization errors

### Debug Techniques

1. **Enable verbose logging:**

```typescript
// Set in main process
process.env.DEBUG = 'app:*';
```

2. **Check process communication:**

```typescript
// In preload
console.log('IPC Available:', !!window.api);
```

3. **Verify state flow:**

```typescript
// Add logging to StateService
console.log('State update:', action, payload);
```

### Getting Help

1. Check existing issues on GitHub
2. Review documentation
3. Ask in discussions
4. Create detailed bug report

## Performance Optimization

### Profiling

1. **Chrome DevTools Performance Tab**
   - Record user interactions
   - Analyze flame graphs
   - Identify bottlenecks

2. **React DevTools Profiler**
   - Measure component render times
   - Find unnecessary re-renders
   - Optimize with memo/useMemo

### Memory Management

```typescript
// Clean up listeners
useEffect(() => {
  const handler = () => {};
  emitter.on('event', handler);
  return () => emitter.off('event', handler);
}, []);

// Clear large objects
largeObject = null;

// Limit cache sizes
if (cache.size > MAX_SIZE) {
  cache.clear();
}
```

### Bundle Size

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Tree shake imports
import { specific } from 'library';
// Not: import * as library from 'library';
```

## Contributing

### Code Style

- ESLint rules enforced
- Prettier for formatting
- EditorConfig for consistency

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR with description
6. Address review feedback

### Documentation

- Update README for user-facing changes
- Update this guide for developer changes
- Add JSDoc comments for public APIs
- Include examples in documentation

## Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### Tools
- [Electron Forge](https://www.electronforge.io/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

### Community
- GitHub Issues
- GitHub Discussions
- Stack Overflow