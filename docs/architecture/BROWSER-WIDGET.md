# Browser Widget Specification

## Overview

This document specifies the implementation of a web browser widget for Vilodocs, allowing users to browse web content within application tabs. Based on Electron's 2024 best practices, we'll use WebContentsView (replacing the deprecated BrowserView) with comprehensive security sandboxing.

## Architecture

### Core Components

```typescript
interface BrowserWidgetSystem {
  // Main Process
  webContentsManager: WebContentsManager;
  securityPolicy: SecurityPolicy;
  navigationController: NavigationController;
  
  // Renderer Process
  browserWidget: BrowserWidget;
  navigationBar: NavigationBar;
  
  // IPC Bridge
  browserBridge: BrowserBridge;
}
```

## WebContentsView Implementation (2024 Standard)

### Main Process Architecture

```typescript
// Main process manager for WebContentsView
class WebContentsManager {
  private views: Map<string, WebContentsView>;
  private windows: Map<string, BaseWindow>;
  
  createBrowserView(id: string, options: BrowserOptions): WebContentsView {
    // Create WebContentsView (not deprecated webview tag)
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,                    // Required
        contextIsolation: true,           // Required
        nodeIntegration: false,           // Required
        webSecurity: true,                // Required
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        enableWebSQL: false,
        plugins: false,
        // Permissions
        webviewTag: false,                // Don't allow nested webviews
        navigateOnDragDrop: false
      }
    });
    
    // Apply security policies
    this.applySecurityPolicies(view);
    
    // Store reference
    this.views.set(id, view);
    
    return view;
  }
  
  attachToWindow(viewId: string, window: BaseWindow): void {
    const view = this.views.get(viewId);
    if (!view) return;
    
    // Add to window's content view
    window.contentView.addChildView(view);
    
    // Set bounds
    const bounds = window.getBounds();
    view.setBounds({
      x: 0,
      y: 60, // Leave space for navigation bar
      width: bounds.width,
      height: bounds.height - 60
    });
  }
}
```

### Security Implementation

```typescript
class SecurityPolicy {
  // Content Security Policy
  private readonly CSP = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "https:", "data:"],
    'font-src': ["'self'", "data:"],
    'connect-src': ["'self'", "https:"],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'worker-src': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': []
  };
  
  applyToWebContents(webContents: WebContents): void {
    // Set CSP header
    webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [this.buildCSP()]
        }
      });
    });
    
    // Permission handling
    webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      // Deny dangerous permissions
      const denied = [
        'media',
        'geolocation',
        'notifications',
        'midiSysex',
        'pointerLock',
        'fullscreen',
        'openExternal'
      ];
      
      if (denied.includes(permission)) {
        callback(false);
      } else {
        // Ask user for other permissions
        this.promptUser(permission, callback);
      }
    });
    
    // Prevent new window creation
    webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
    
    // Navigation restrictions
    webContents.on('will-navigate', (event, url) => {
      if (!this.isAllowedNavigation(url)) {
        event.preventDefault();
      }
    });
  }
  
  private buildCSP(): string {
    return Object.entries(this.CSP)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }
  
  private isAllowedNavigation(url: string): boolean {
    // Implement URL filtering
    const parsed = new URL(url);
    
    // Block file:// URLs
    if (parsed.protocol === 'file:') return false;
    
    // Block javascript: URLs
    if (parsed.protocol === 'javascript:') return false;
    
    // Allow https and http
    return ['https:', 'http:'].includes(parsed.protocol);
  }
}
```

## Renderer Process Widget

### BrowserWidget Component

```tsx
interface BrowserWidgetProps {
  id: string;
  initialUrl?: string;
  onNavigate?: (url: string) => void;
  onTitleChange?: (title: string) => void;
}

const BrowserWidget: React.FC<BrowserWidgetProps> = ({
  id,
  initialUrl = 'https://www.google.com',
  onNavigate,
  onTitleChange
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('New Tab');
  
  useEffect(() => {
    // Initialize browser view in main process
    window.api.createBrowserView(id, { url: initialUrl });
    
    // Set up event listeners
    const unsubscribe = window.api.onBrowserEvent(id, (event) => {
      switch (event.type) {
        case 'did-navigate':
          setUrl(event.url);
          onNavigate?.(event.url);
          break;
        case 'page-title-updated':
          setTitle(event.title);
          onTitleChange?.(event.title);
          break;
        case 'did-start-loading':
          setIsLoading(true);
          break;
        case 'did-stop-loading':
          setIsLoading(false);
          break;
        case 'navigation-state':
          setCanGoBack(event.canGoBack);
          setCanGoForward(event.canGoForward);
          break;
      }
    });
    
    return () => {
      unsubscribe();
      window.api.destroyBrowserView(id);
    };
  }, [id]);
  
  return (
    <div className="browser-widget">
      <NavigationBar
        url={url}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        onNavigate={(url) => window.api.navigateBrowserView(id, url)}
        onBack={() => window.api.browserGoBack(id)}
        onForward={() => window.api.browserGoForward(id)}
        onReload={() => window.api.browserReload(id)}
        onStop={() => window.api.browserStop(id)}
      />
      
      <div className="browser-content" id={`browser-view-${id}`}>
        {/* WebContentsView will be attached here by main process */}
      </div>
    </div>
  );
};
```

### Navigation Bar

```tsx
interface NavigationBarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  url,
  canGoBack,
  canGoForward,
  isLoading,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop
}) => {
  const [inputUrl, setInputUrl] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (!isFocused) {
      setInputUrl(url);
    }
  }, [url, isFocused]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    
    onNavigate(finalUrl);
    setIsFocused(false);
  };
  
  return (
    <div className="navigation-bar">
      <button 
        className="nav-button"
        onClick={onBack}
        disabled={!canGoBack}
        title="Back (Alt+Left)"
      >
        ←
      </button>
      
      <button
        className="nav-button"
        onClick={onForward}
        disabled={!canGoForward}
        title="Forward (Alt+Right)"
      >
        →
      </button>
      
      <button
        className="nav-button"
        onClick={isLoading ? onStop : onReload}
        title={isLoading ? "Stop (Esc)" : "Reload (F5)"}
      >
        {isLoading ? '✕' : '↻'}
      </button>
      
      <form onSubmit={handleSubmit} className="url-bar-form">
        <input
          type="text"
          className="url-bar"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter URL or search..."
        />
      </form>
      
      <button
        className="nav-button menu-button"
        title="Browser menu"
      >
        ⋮
      </button>
    </div>
  );
};
```

## IPC Communication

### IPC Channels

```typescript
// Additional channels for browser functionality
export const BrowserChannels = {
  // Commands
  CreateBrowserView: 'browser:create',
  DestroyBrowserView: 'browser:destroy',
  NavigateTo: 'browser:navigate',
  GoBack: 'browser:back',
  GoForward: 'browser:forward',
  Reload: 'browser:reload',
  Stop: 'browser:stop',
  
  // Events
  DidNavigate: 'browser:did-navigate',
  PageTitleUpdated: 'browser:title-updated',
  DidStartLoading: 'browser:start-loading',
  DidStopLoading: 'browser:stop-loading',
  NavigationState: 'browser:navigation-state',
  
  // Security
  PermissionRequest: 'browser:permission-request',
  CertificateError: 'browser:certificate-error',
  
  // Dev tools
  OpenDevTools: 'browser:open-devtools',
  CloseDevTools: 'browser:close-devtools'
} as const;
```

### Main Process Handlers

```typescript
// Main process IPC handlers
ipcMain.handle(BrowserChannels.CreateBrowserView, async (event, id, options) => {
  const view = webContentsManager.createBrowserView(id, options);
  
  // Set up event forwarding
  view.webContents.on('did-navigate', (event, url) => {
    mainWindow.webContents.send(BrowserChannels.DidNavigate, { id, url });
  });
  
  view.webContents.on('page-title-updated', (event, title) => {
    mainWindow.webContents.send(BrowserChannels.PageTitleUpdated, { id, title });
  });
  
  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send(BrowserChannels.DidStartLoading, { id });
  });
  
  view.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.send(BrowserChannels.DidStopLoading, { id });
    
    // Send navigation state
    const canGoBack = view.webContents.canGoBack();
    const canGoForward = view.webContents.canGoForward();
    mainWindow.webContents.send(BrowserChannels.NavigationState, {
      id,
      canGoBack,
      canGoForward
    });
  });
  
  return { success: true };
});

ipcMain.handle(BrowserChannels.NavigateTo, async (event, id, url) => {
  const view = webContentsManager.getView(id);
  if (view) {
    view.webContents.loadURL(url);
  }
});

ipcMain.handle(BrowserChannels.GoBack, async (event, id) => {
  const view = webContentsManager.getView(id);
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack();
  }
});

ipcMain.handle(BrowserChannels.GoForward, async (event, id) => {
  const view = webContentsManager.getView(id);
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward();
  }
});
```

## Tab Integration

### Tab Configuration

```typescript
interface BrowserTab extends Tab {
  widget: {
    type: 'browser';
    props: {
      url: string;
      title?: string;
      favicon?: string;
    };
  };
}

// Opening a browser tab
function openBrowserTab(url: string): void {
  const tab: BrowserTab = {
    id: generateId(),
    title: 'Loading...',
    icon: 'browser',
    closeable: true,
    widget: {
      type: 'browser',
      props: { url }
    }
  };
  
  dispatch({
    type: 'ADD_TAB',
    payload: { tab }
  });
}
```

### Widget Registration

```typescript
// Register browser widget in WidgetRenderer
case 'browser':
  return (
    <BrowserWidget
      id={tab.id}
      initialUrl={tab.widget.props?.url}
      onTitleChange={(title) => updateTabTitle(tab.id, title)}
    />
  );
```

## Security Considerations

### URL Filtering

```typescript
class URLFilter {
  private blacklist: RegExp[] = [
    /^file:\/\//,              // Block local files
    /^javascript:/,            // Block JavaScript URLs
    /^data:text\/html/,        // Block data URLs with HTML
    /^chrome:/,                // Block Chrome URLs
    /^about:/,                 // Block about URLs (except about:blank)
  ];
  
  private whitelist: string[] = [
    'about:blank'
  ];
  
  isAllowed(url: string): boolean {
    // Check whitelist first
    if (this.whitelist.includes(url)) return true;
    
    // Check blacklist
    for (const pattern of this.blacklist) {
      if (pattern.test(url)) return false;
    }
    
    // Only allow http(s)
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}
```

### Certificate Handling

```typescript
// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Prevent default behavior
  event.preventDefault();
  
  // Log the error
  console.error('Certificate error:', { url, error });
  
  // Show user prompt
  const result = dialog.showMessageBoxSync({
    type: 'warning',
    title: 'Certificate Error',
    message: `The certificate for ${url} is not trusted.`,
    detail: error,
    buttons: ['Cancel', 'Continue Anyway'],
    defaultId: 0
  });
  
  // Callback with user's choice
  callback(result === 1);
});
```

### Download Handling

```typescript
class DownloadManager {
  setupDownloadHandling(webContents: WebContents): void {
    webContents.session.on('will-download', (event, item, webContents) => {
      // Set download path
      const downloadsPath = app.getPath('downloads');
      const fileName = item.getFilename();
      const filePath = path.join(downloadsPath, fileName);
      
      // Prompt user for location
      const savePath = dialog.showSaveDialogSync({
        defaultPath: filePath,
        filters: this.getFilters(fileName)
      });
      
      if (savePath) {
        item.setSavePath(savePath);
        
        // Track progress
        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
            console.error('Download interrupted');
          } else if (state === 'progressing') {
            if (item.isPaused()) {
              console.log('Download paused');
            } else {
              const progress = item.getReceivedBytes() / item.getTotalBytes();
              this.updateProgress(item, progress);
            }
          }
        });
        
        item.once('done', (event, state) => {
          if (state === 'completed') {
            this.notifyCompletion(item);
          } else {
            console.error(`Download failed: ${state}`);
          }
        });
      } else {
        item.cancel();
      }
    });
  }
}
```

## Keyboard Shortcuts

### Browser-Specific Shortcuts

```typescript
const browserShortcuts = {
  // Navigation
  'Alt+Left': 'browser.goBack',
  'Alt+Right': 'browser.goForward',
  'F5': 'browser.reload',
  'Ctrl+F5': 'browser.hardReload',
  'Escape': 'browser.stop',
  
  // URL bar
  'Ctrl+L': 'browser.focusUrlBar',
  'Alt+D': 'browser.focusUrlBar',
  'F6': 'browser.focusUrlBar',
  
  // Zoom
  'Ctrl+Plus': 'browser.zoomIn',
  'Ctrl+Minus': 'browser.zoomOut',
  'Ctrl+0': 'browser.resetZoom',
  
  // Dev tools
  'F12': 'browser.toggleDevTools',
  'Ctrl+Shift+I': 'browser.toggleDevTools',
  
  // Find
  'Ctrl+F': 'browser.find',
  'F3': 'browser.findNext',
  'Shift+F3': 'browser.findPrevious',
  
  // Bookmarks
  'Ctrl+D': 'browser.bookmark',
  'Ctrl+Shift+D': 'browser.bookmarkAll'
};
```

## Performance Optimization

### Resource Management

```typescript
class BrowserResourceManager {
  private readonly MAX_MEMORY_MB = 512;
  private readonly MAX_TABS = 10;
  
  monitorResources(webContents: WebContents): void {
    setInterval(() => {
      const metrics = webContents.getProcessMemoryInfo();
      
      metrics.then(info => {
        const memoryMB = info.private / 1024;
        
        if (memoryMB > this.MAX_MEMORY_MB) {
          this.handleHighMemory(webContents);
        }
      });
    }, 30000); // Check every 30 seconds
  }
  
  private handleHighMemory(webContents: WebContents): void {
    // Clear cache
    webContents.session.clearCache();
    
    // Notify user
    this.notifyHighMemoryUsage();
    
    // Force garbage collection if critical
    if (global.gc) {
      global.gc();
    }
  }
}
```

### Tab Suspension

```typescript
class TabSuspension {
  private suspended = new Set<string>();
  
  suspendInactiveTab(tabId: string): void {
    const view = webContentsManager.getView(tabId);
    if (!view) return;
    
    // Save state
    const state = {
      url: view.webContents.getURL(),
      title: view.webContents.getTitle(),
      scrollPosition: view.webContents.executeJavaScript('window.scrollY')
    };
    
    // Load placeholder
    view.webContents.loadURL('about:blank');
    
    // Store state
    this.suspended.add(tabId);
    this.saveState(tabId, state);
  }
  
  resumeTab(tabId: string): void {
    if (!this.suspended.has(tabId)) return;
    
    const view = webContentsManager.getView(tabId);
    const state = this.loadState(tabId);
    
    if (view && state) {
      view.webContents.loadURL(state.url);
      
      view.webContents.once('did-finish-load', () => {
        // Restore scroll position
        view.webContents.executeJavaScript(
          `window.scrollTo(0, ${state.scrollPosition})`
        );
      });
      
      this.suspended.delete(tabId);
    }
  }
}
```

## Testing

### Security Tests

```typescript
describe('Browser Security', () => {
  it('should block file:// URLs', async () => {
    const view = createBrowserView();
    const blocked = await view.loadURL('file:///etc/passwd');
    expect(blocked).toBe(false);
  });
  
  it('should enforce CSP', async () => {
    const view = createBrowserView();
    await view.loadURL('https://example.com');
    
    const csp = await view.executeJavaScript(
      `document.querySelector('meta[http-equiv="Content-Security-Policy"]').content`
    );
    
    expect(csp).toContain("script-src 'self'");
  });
  
  it('should handle certificate errors', async () => {
    const view = createBrowserView();
    const spy = jest.spyOn(dialog, 'showMessageBoxSync');
    
    await view.loadURL('https://self-signed.badssl.com/');
    
    expect(spy).toHaveBeenCalled();
  });
});
```

### E2E Tests

```typescript
test('Browser tab workflow', async ({ app }) => {
  // Open browser tab
  await app.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents.send('open-browser-tab', 'https://example.com');
  });
  
  // Wait for page load
  await app.waitForSelector('.browser-widget');
  
  // Navigate
  const urlBar = await app.$('.url-bar');
  await urlBar.fill('https://github.com');
  await urlBar.press('Enter');
  
  // Verify navigation
  await app.waitForURL(/github\.com/);
  
  // Test back button
  await app.click('.nav-button[title*="Back"]');
  await app.waitForURL(/example\.com/);
});
```

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] WebContentsView setup in main process
- [ ] Basic security implementation
- [ ] IPC communication channels
- [ ] Navigation controller

### Phase 2: UI Components (Week 3)
- [ ] BrowserWidget component
- [ ] NavigationBar with controls
- [ ] Tab integration
- [ ] URL handling

### Phase 3: Security & Features (Week 4)
- [ ] Complete CSP implementation
- [ ] Permission handling
- [ ] Download manager
- [ ] Certificate handling

### Phase 4: Polish & Testing (Week 5)
- [ ] Performance optimization
- [ ] Tab suspension
- [ ] Keyboard shortcuts
- [ ] Comprehensive testing

## Configuration

### User Settings

```typescript
interface BrowserSettings {
  // Security
  enableJavaScript: boolean;        // Default: true
  enableImages: boolean;            // Default: true
  enableWebSecurity: boolean;        // Default: true (never disable)
  
  // Privacy
  doNotTrack: boolean;              // Default: true
  clearCacheOnExit: boolean;        // Default: false
  
  // Performance
  maxTabMemoryMB: number;           // Default: 512
  suspendInactiveTabs: boolean;     // Default: true
  suspendAfterMinutes: number;      // Default: 30
  
  // UI
  showNavigationBar: boolean;       // Default: true
  defaultSearchEngine: string;      // Default: 'google'
  homePage: string;                 // Default: 'about:blank'
}
```

## References

- [Electron WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)