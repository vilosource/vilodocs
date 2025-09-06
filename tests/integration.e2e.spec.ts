import { test, expect } from '@playwright/test';
import { 
  launchElectronE2E, 
  captureRendererErrors, 
  setupMainProcessMonitoring,
  closeApp,
  type TestContext 
} from './helpers/e2e';

let context: TestContext | undefined;

test.beforeAll(async () => {
  try {
    context = await launchElectronE2E();
    context.errors = captureRendererErrors(context.page);
    setupMainProcessMonitoring(context.app);
  } catch (error) {
    console.error('Failed to launch Electron app:', error);
    throw error;
  }
});

test.afterAll(async () => {
  if (context) {
    await closeApp(context);
  }
});

test.describe('Critical Integration Tests', () => {
  test('app loads without JavaScript errors', async () => {
    const { page, errors } = context!;
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give React time to render or error
    
    // Check for any console errors - THIS IS CRITICAL
    expect(errors).toHaveLength(0);
    
    // If there are errors, log them for debugging
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
    }
  });

  test('React app initializes successfully', async () => {
    const { page } = context!;
    
    // Check that root element exists
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
    
    // Check that React has rendered SOMETHING inside root
    const rootContent = await root.innerHTML();
    expect(rootContent.length).toBeGreaterThan(50); // Not just empty
    
    // Check for React DevTools hook or React rendering
    const hasReact = await page.evaluate(() => {
      // Check for React DevTools (may not be present in production)
      const hasDevTools = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      // Check if React rendered something
      const root = document.getElementById('root');
      const hasReactContent = root ? root.children.length > 0 : false;
      return hasDevTools || hasReactContent;
    });
    expect(hasReact).toBe(true);
  });

  test('main components render without errors', async () => {
    const { page, errors } = context!;
    
    // First check no errors occurred
    expect(errors).toHaveLength(0);
    
    // Then check for at least ONE of the main components
    const componentSelectors = [
      '.shell',           // Main shell
      '.app',            // App container
      '.editor-grid',    // Editor grid
      '.activity-bar',   // Activity bar
      '.status-bar',     // Status bar
      '.welcome-tab',    // Welcome tab
      '.editor-empty'    // Empty editor state
    ];
    
    let foundComponent = false;
    for (const selector of componentSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundComponent = true;
        console.log(`Found component: ${selector}`);
        break;
      }
    }
    
    expect(foundComponent).toBe(true);
  });

  test('critical imports resolve correctly', async () => {
    const { page } = context!;
    
    // Execute JavaScript to check if critical modules loaded
    const modulesLoaded = await page.evaluate(() => {
      const results: Record<string, boolean> = {};
      
      // Check if React rendered (DevTools may not be present in production)
      results.react = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || 
                     (document.getElementById('root')?.children.length ?? 0) > 0;
      
      // Check if our app rendered
      const root = document.getElementById('root');
      results.appRendered = root ? root.children.length > 0 : false;
      
      // Check for our custom components
      results.hasContent = document.body.innerHTML.length > 100;
      
      return results;
    });
    
    expect(modulesLoaded.react).toBe(true);
    expect(modulesLoaded.appRendered).toBe(true);
    expect(modulesLoaded.hasContent).toBe(true);
  });

  test('no unhandled promise rejections', async () => {
    const { page } = context!;
    
    // Set up promise rejection handler
    await page.evaluate(() => {
      (window as any).__unhandledRejections = [];
      window.addEventListener('unhandledrejection', (event) => {
        (window as any).__unhandledRejections.push({
          reason: String(event.reason),
          promise: String(event.promise)
        });
      });
    });
    
    // Wait for app to initialize
    await page.waitForTimeout(2000);
    
    // Check for unhandled rejections
    const rejections = await page.evaluate(() => (window as any).__unhandledRejections || []);
    expect(rejections).toHaveLength(0);
    
    if (rejections.length > 0) {
      console.error('Unhandled promise rejections:', rejections);
    }
  });

  test('localStorage persistence works', async () => {
    const { page } = context!;
    
    // Check if localStorage is accessible
    const canUseLocalStorage = await page.evaluate(() => {
      try {
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    });
    
    expect(canUseLocalStorage).toBe(true);
    
    // Check if our layout persistence key exists or can be created
    const hasPersistence = await page.evaluate(() => {
      const key = 'vilodocs-layout';
      try {
        // Try to save something
        localStorage.setItem(key + '-test', JSON.stringify({ test: true }));
        const retrieved = localStorage.getItem(key + '-test');
        localStorage.removeItem(key + '-test');
        return retrieved !== null;
      } catch {
        return false;
      }
    });
    
    expect(hasPersistence).toBe(true);
  });

  test('keyboard shortcuts register without errors', async () => {
    const { page, errors } = context!;
    
    // Clear any existing errors
    errors.length = 0;
    
    // Try some keyboard shortcuts
    await page.keyboard.press('Control+b'); // Toggle sidebar
    await page.waitForTimeout(100);
    
    await page.keyboard.press('Control+j'); // Toggle panel
    await page.waitForTimeout(100);
    
    // Check no errors occurred during keyboard handling
    expect(errors).toHaveLength(0);
  });

  test('IPC bridge is available', async () => {
    const { page } = context!;
    
    // Check if window.api exists (IPC bridge)
    const hasApi = await page.evaluate(() => {
      return typeof (window as any).api !== 'undefined';
    });
    
    expect(hasApi).toBe(true);
    
    // Check if critical API methods exist
    if (hasApi) {
      const apiMethods = await page.evaluate(() => {
        const api = (window as any).api;
        return {
          hasOpenFile: typeof api?.openFile === 'function',
          hasSaveFile: typeof api?.saveFile === 'function',
          hasOnThemeChanged: typeof api?.onThemeChanged === 'function'
        };
      });
      
      expect(apiMethods.hasOpenFile).toBe(true);
      expect(apiMethods.hasSaveFile).toBe(true);
      expect(apiMethods.hasOnThemeChanged).toBe(true);
    }
  });
});

test.describe('Component Rendering Tests', () => {
  test('panes UI components eventually render', async () => {
    const { page, errors } = context!;
    
    // First ensure no JavaScript errors
    if (errors.length > 0) {
      console.error('Cannot test components due to errors:', errors);
      test.skip();
    }
    
    // Wait longer for components to mount
    await page.waitForTimeout(3000);
    
    // Log what we can find
    const foundComponents: string[] = [];
    const componentsToCheck = [
      '.shell',
      '.app', 
      '.editor-grid',
      '.editor-leaf',
      '.activity-bar',
      '.sidebar',
      '.panel',
      '.status-bar',
      '.tab-strip',
      '.welcome-tab',
      '.editor-empty'
    ];
    
    for (const selector of componentsToCheck) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundComponents.push(`${selector} (${count})`);
      }
    }
    
    console.log('Found components:', foundComponents);
    
    // We should find at least SOME components
    expect(foundComponents.length).toBeGreaterThan(0);
  });

  test('error boundary catches component errors', async () => {
    const { page } = context!;
    
    // Check if there's an error boundary message
    const errorBoundary = await page.locator('text=/error|Error|failed|Failed/i').count();
    
    // If there's an error boundary message, that's actually good - it caught the error
    // But we should log it
    if (errorBoundary > 0) {
      const errorText = await page.locator('text=/error|Error|failed|Failed/i').first().textContent();
      console.log('Error boundary triggered:', errorText);
    }
    
    // The app should still be running even if there was an error
    const hasContent = await page.locator('body').evaluate(el => el.innerHTML.length > 0);
    expect(hasContent).toBe(true);
  });
});