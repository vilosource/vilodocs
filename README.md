# vilodocs

A document editor built with Electron, featuring a clean interface for editing text files.

## Features

- 📝 Simple text editor interface
- 📂 Open and save files
- 🎨 Automatic theme detection (light/dark)
- 🔒 Secure IPC communication
- 🧪 Comprehensive E2E testing

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

- **Main Process** (`src/main.ts`) - Electron main process
- **Renderer Process** (`src/renderer.ts`) - UI code
- **Preload Script** (`src/preload.ts`) - Secure bridge between main and renderer
- **IPC Contract** (`src/common/ipc.ts`) - Type-safe IPC communication

## Technologies

- [Electron](https://www.electronjs.org/) - Desktop framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Electron Forge](https://www.electronforge.io/) - Packaging and distribution
- [Playwright](https://playwright.dev/) - E2E testing

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