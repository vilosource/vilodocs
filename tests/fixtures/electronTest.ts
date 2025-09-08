import { test as base, expect, Page, ElectronApplication, _electron as electron } from '@playwright/test';
import path from 'node:path';

export interface ElectronTestFixtures {
  electronApp: ElectronApplication;
  page: Page;
  errors: string[];
  resetApp: () => Promise<void>;
}

// Custom test fixture that provides the shared Electron app instance
export const test = base.extend<ElectronTestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  electronApp: async ({}, use) => {
    // Check if we're using global setup
    if ((global as any).__ELECTRON_APP__) {
      await use((global as any).__ELECTRON_APP__);
      return;
    }
    
    // Fallback: launch app if not using global setup (for debugging individual tests)
    const electronPath = process.platform === 'win32'
      ? path.join(__dirname, '../../node_modules/.bin/electron.cmd')
      : path.join(__dirname, '../../node_modules/.bin/electron');

    const args = ['.'];
    if (process.env.CI) {
      args.push('--no-sandbox');
    }

    const app = await electron.launch({
      executablePath: electronPath,
      args,
      env: { 
        ...process.env, 
        E2E: '1', 
        NODE_ENV: 'development', // Use development to load from dev server
        DISPLAY: process.env.CI ? ':99' : process.env.DISPLAY
      },
    });

    await use(app);
    
    // Only close if we launched it ourselves
    if (!(global as any).__ELECTRON_APP__) {
      await app.close();
    }
  },
  
  page: async ({ electronApp }, use) => {
    // Use the global page if available
    if ((global as any).__ELECTRON_PAGE__) {
      const page = (global as any).__ELECTRON_PAGE__;
      await use(page);
      return;
    }
    
    // Otherwise get the first window
    const page = await electronApp.firstWindow();
    // Wait for React app to be ready
    await page.waitForSelector('#root', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await use(page);
  },
  
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });
    
    await use(errors);
  },
  
  resetApp: async ({ page }, use) => {
    // Function to reset app state without reloading
    const reset = async () => {
      // Clear any modals or dialogs
      try {
        await page.keyboard.press('Escape');
      } catch {
        // Ignore error - Escape key might not have any effect
      }
      
      // Reset to a clean state by navigating to root
      // This is better than reload for Electron apps
      try {
        await page.evaluate(() => {
          // Clear local storage
          localStorage.clear();
          // Reset any React state if needed
          const rootElement = document.getElementById('root');
          if (rootElement && (window as any).React) {
            // Trigger a re-render or state reset
            rootElement.dispatchEvent(new Event('reset', { bubbles: true }));
          }
        });
      } catch (e) {
        // If localStorage access fails, just continue
        // This can happen with certain security settings
        console.log('Note: Could not clear localStorage:', e.message);
      }
      
      // Wait for any transitions
      await page.waitForTimeout(500);
    };
    
    await use(reset);
  }
});

export { expect };