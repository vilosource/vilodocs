# vilodocs

A modern document editor built with Electron, featuring VS Code-style panes, workspace support, and advanced markdown capabilities.

## Features

### 📝 **Text Editing**
- Advanced text editor with syntax highlighting
- Line numbers and editor statistics
- Multi-tab support with drag & drop reordering
- File path display and dirty state indicators

### 📖 **Markdown Support**
- GitHub Flavored Markdown rendering
- Syntax highlighting for code blocks
- Math expressions with KaTeX support
- Interactive table of contents (Ctrl+Shift+O)
- Task lists, tables, and emoji support
- Code copy buttons and link navigation
- Bidirectional editing (Ctrl+E ↔ Ctrl+Shift+V)

### 🎛️ **VS Code-Style Interface**
- Split panes (horizontal: Ctrl+\, vertical: Ctrl+Alt+\)
- Drag-resizable splits with 50%/50% defaults
- Activity bar and sidebar navigation
- Status bar with file information
- File explorer with workspace support

### 🎨 **Theming & UI**
- VS Code-compatible dark theme
- Consistent styling across all components
- Proper focus management and keyboard navigation
- Responsive layout with proper scrollbars

### 🏗️ **Architecture**
- Extensible Widget Registry for file type associations
- Service-oriented state management
- Layout persistence across sessions
- Type-safe IPC communication
- Comprehensive testing suite

## ⌨️ Keyboard Shortcuts

### **File & Navigation**
- `Ctrl+K Ctrl+O` - Open folder
- `Ctrl+B` - Toggle sidebar
- `Ctrl+J` - Toggle panel
- `F6` - Navigate between panes

### **Editor & Splits**
- `Ctrl+\` - Split editor horizontally (side by side)
- `Ctrl+Alt+\` - Split editor vertically (top/bottom)
- `Ctrl+Tab` - Next tab
- `Ctrl+Shift+Tab` - Previous tab

### **Markdown**
- `Ctrl+E` - Switch to markdown editor
- `Ctrl+Shift+V` - Switch to markdown viewer
- `Ctrl+Shift+O` - Toggle table of contents
- Double-click - Switch to edit mode

## Development

### Prerequisites

- Node.js ≥ 18 (recommended: v20 LTS)
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone git@github.com:vilosource/vilodocs.git
cd vilodocs

# Install dependencies
npm install

# Start the application
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the app in development mode |
| `npm run package` | Package the app for distribution |
| `npm run make` | Create platform installers |
| `npm run publish` | Publish to GitHub releases |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:headed` | Run E2E tests with visible window |
| `npm run test:e2e:ui` | Open Playwright test UI |

## Testing

### Quick E2E Test

```bash
# Package the app first
npm run package

# Run E2E tests
xvfb-run -a npm run test:e2e
```

For detailed testing documentation, see [docs/testing.md](docs/testing.md).

## Building

### Create Release Packages

```bash
# Build for current platform
npm run make

# Build specific packages
npx electron-forge make --targets @electron-forge/maker-deb
npx electron-forge make --targets @pengx17/electron-forge-maker-appimage
```

### Supported Platforms

- **Linux**
  - AppImage (universal)
  - DEB (Debian/Ubuntu)
  - RPM (Fedora/RHEL)
  - ZIP archive

## CI/CD

The project uses GitHub Actions for:

- **Build workflow** - On every push to main
- **E2E tests** - Automated testing with Playwright
- **Release workflow** - Creates draft releases on version tags

### Creating a Release

1. Update version in `package.json`
2. Commit: `git commit -am "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push --tags`

GitHub Actions will automatically create a draft release with Linux packages.

## Architecture

### **Core Components**
- **Main Process** (`src/main.ts`) - Electron main process and window management
- **Renderer Process** (`src/renderer.ts`) - React-based UI with VS Code-style layout
- **Preload Script** (`src/preload.ts`) - Secure bridge between main and renderer
- **IPC Contract** (`src/common/ipc.ts`) - Type-safe IPC communication

### **Key Services**
- **Widget Registry** (`src/services/WidgetRegistry.ts`) - File type to widget mapping
- **Theme Service** (`src/services/ThemeService.ts`) - VS Code-compatible theming
- **State Service** - Layout and tab persistence
- **Command Manager** - Keyboard shortcuts and command palette

### **Documentation**
Comprehensive architecture documentation is available in [`docs/architecture/`](docs/architecture/):
- [Architecture Overview](docs/architecture/ARCHITECTURE.md)
- [Widget Registry System](docs/architecture/WIDGET-REGISTRY.md)
- [Markdown Viewer Implementation](docs/architecture/MARKDOWN-VIEWER-IMPLEMENTATION.md)
- [Theme System](docs/architecture/THEME-SYSTEM.md)
- [Developer Guide](docs/architecture/DEVELOPER-GUIDE.md)

## Technologies

### **Core Framework**
- [Electron](https://www.electronjs.org/) - Desktop application framework
- [React](https://react.dev/) - UI component library
- [TypeScript](https://www.typescriptlang.org/) - Type safety and enhanced development experience

### **Build & Development**
- [Vite](https://vitejs.dev/) - Fast build tool and development server
- [Electron Forge](https://www.electronforge.io/) - Packaging and distribution
- [ESLint](https://eslint.org/) - Code linting and formatting

### **Markdown & Rendering**
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown parsing and rendering
- [remark-gfm](https://github.com/remarkjs/remark-gfm) - GitHub Flavored Markdown support
- [rehype-highlight](https://github.com/rehypejs/rehype-highlight) - Syntax highlighting
- [KaTeX](https://katex.org/) - Math expression rendering

### **Testing**
- [Playwright](https://playwright.dev/) - End-to-end testing
- [Vitest](https://vitest.dev/) - Unit testing framework

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (following conventional commits)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/vilosource/vilodocs/issues) page.