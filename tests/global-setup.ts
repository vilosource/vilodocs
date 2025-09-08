import { FullConfig, _electron as electron } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  console.log(`⏳ Waiting for dev server at ${url}...`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ Dev server is ready');
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function waitForMainBuild(maxAttempts = 30): Promise<boolean> {
  console.log('⏳ Waiting for main.js to be built...');
  const mainPath = path.join(__dirname, '../.vite/build/main.js');
  
  for (let i = 0; i < maxAttempts; i++) {
    if (fs.existsSync(mainPath)) {
      console.log('✅ main.js is ready');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function globalSetup(config: FullConfig) {
  // Wait for Vite dev server to be ready (started by Playwright's webServer config)
  const serverReady = await waitForServer('http://localhost:5173');
  if (!serverReady) {
    throw new Error('Dev server failed to start within 30 seconds');
  }

  // Wait for main.js to be built
  const mainReady = await waitForMainBuild();
  if (!mainReady) {
    throw new Error('main.js was not built within 30 seconds');
  }

  // Store the app instance globally so it can be accessed by tests
  const electronPath = process.platform === 'win32'
    ? path.join(__dirname, '../node_modules/.bin/electron.cmd')
    : path.join(__dirname, '../node_modules/.bin/electron');

  // In CI, we need to disable the sandbox due to permission issues
  const args = ['.'];
  if (process.env.CI) {
    args.push('--no-sandbox');
  }

  console.log('🚀 Launching Electron app for E2E tests...');
  
  // Launch Electron app in E2E mode
  const app = await electron.launch({
    executablePath: electronPath,
    args,
    env: { 
      ...process.env, 
      E2E: '1', 
      NODE_ENV: 'development', // Use development to load from dev server
      MAIN_WINDOW_VITE_DEV_SERVER_URL: 'http://localhost:5173', // Ensure it loads from dev server
      MAIN_WINDOW_VITE_NAME: 'main_window',
      // Disable GPU in CI environments
      DISPLAY: process.env.CI ? ':99' : process.env.DISPLAY
    },
  });

  // Get the first window
  const page = await app.firstWindow();
  
  // Add console logging to debug
  page.on('console', (msg) => {
    console.log(`Browser console: ${msg.type()} - ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    console.log(`Browser error: ${error.message}`);
  });
  
  // Wait for React to mount and render something
  try {
    // First ensure the root element exists
    await page.waitForSelector('#root', { timeout: 15000 });
    
    // Then wait for React to actually render content inside it
    await page.waitForFunction(
      () => {
        const root = document.querySelector('#root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );
    
    // Give it a bit more time to fully render
    await page.waitForTimeout(1000);
    
    // Try to wait for specific app elements
    await Promise.race([
      page.waitForSelector('.shell', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.shell-loading', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.file-explorer-empty', { timeout: 5000 }).catch(() => null),
    ]);
  } catch (error) {
    console.log('Warning: App may not be fully loaded:', error.message);
  }
  
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Electron app launched successfully');
  
  // Store the app and page references for tests to use
  process.env.ELECTRON_APP_PROCESS_ID = process.pid.toString();
  
  // Save the app instance to be used in tests and teardown
  (global as any).__ELECTRON_APP__ = app;
  (global as any).__ELECTRON_PAGE__ = page;
  
  return async () => {
    // This will be called as teardown
    console.log('🛑 Closing Electron app...');
    if ((global as any).__ELECTRON_APP__) {
      await (global as any).__ELECTRON_APP__.close();
      console.log('✅ Electron app closed');
    }
  };
}

export default globalSetup;