import { FullConfig, _electron as electron } from '@playwright/test';
import path from 'node:path';

async function globalSetup(config: FullConfig) {
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
      NODE_ENV: 'test',
      // Disable GPU in CI environments
      DISPLAY: process.env.CI ? ':99' : process.env.DISPLAY
    },
  });

  // Get the first window
  const page = await app.firstWindow();
  
  // Wait for the app to be ready
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Give React time to initialize
  
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