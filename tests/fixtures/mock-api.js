// Mock API for E2E tests when preload script fails to load
// This provides the minimum API needed for tests to run

window.api = {
  // File operations
  ping: async (msg) => `pong:${msg}`,
  openFile: async () => null,
  saveFile: async (data) => null,
  readDirectory: async (path) => [],
  createFile: async (path, content) => {},
  createDirectory: async (path) => {},
  deletePath: async (path) => {},
  renamePath: async (oldPath, newPath) => {},
  getFileStats: async (path) => ({
    size: 0,
    created: new Date(),
    modified: new Date(),
    isFile: true,
    isDirectory: false
  }),
  readFileContent: async (path) => '',
  writeFileContent: async (path, content) => {},
  
  // File watching
  watchPath: async (path) => 'mock-watch-id',
  unwatchPath: async (watchId) => {},
  onFileChange: (cb) => () => {},
  
  // Workspace operations
  openFolder: async () => null,
  openWorkspace: async () => null,
  saveWorkspace: async (workspace) => null,
  getRecentWorkspaces: async () => [],
  loadWorkspaceFile: async (path) => ({
    type: 'multi',
    folders: [
      { id: 'test-1', path: './src', name: 'Source' },
      { id: 'test-2', path: './tests', name: 'Tests' }
    ],
    name: 'Test Workspace'
  }),
  addFolderToWorkspace: async (workspace) => workspace,
  removeFolderFromWorkspace: async (workspace, folderId) => workspace,
  saveWorkspaceAs: async (workspace) => null,
  checkWorkspaceBeforeClose: async () => true,
  showSavePrompt: async (name) => 'discard',
  
  // Command palette
  searchFiles: async (path, query) => [],
  getWorkspaceFiles: async (path, limit) => [],
  getRecentFiles: async () => [],
  openFileFromPalette: async (path) => null,
  
  // State management
  loadState: async () => ({
    version: 1,
    workspace: { current: null, recent: [] },
    layout: {
      activityBar: { visible: true, width: 48 },
      sidebar: { visible: true, width: 240, activeView: 'explorer' },
      panel: { visible: false, height: 200, activeView: 'terminal' },
      statusBar: { visible: true },
      editorGrid: null,
      lastFocused: { region: 'editor', leafId: null }
    },
    widgets: {},
    preferences: { theme: 'light' }
  }),
  saveState: async (state) => {},
  updateState: async (action) => {},
  onStateChanged: (cb) => () => {},
  
  // Widget management
  registerWidget: async (widget) => {},
  updateWidgetState: async (widgetId, state) => {},
  getWidgetState: async (widgetId) => null,
  
  // Theme
  onThemeChanged: (cb) => () => {}
};

console.log('Mock API injected for E2E testing');