import { ElectronApplication, Page, _electron as electron } from '@playwright/test';
import path from 'node:path';

export interface TestContext {
  app: ElectronApplication;
  page: Page;
  errors: string[];
}

export async function launchElectronE2E(): Promise<TestContext> {
  // Determine the electron executable path
  const electronPath = process.platform === 'win32'
    ? path.join(__dirname, '../../node_modules/.bin/electron.cmd')
    : path.join(__dirname, '../../node_modules/.bin/electron');

  // Launch Electron app in E2E mode
  const app: ElectronApplication = await electron.launch({
    executablePath: electronPath,
    args: ['.'],
    env: { 
      ...process.env, 
      E2E: '1', 
      NODE_ENV: 'test',
      // Disable GPU in CI environments
      DISPLAY: process.env.CI ? ':99' : process.env.DISPLAY
    },
  });

  // Get the first window
  const page: Page = await app.firstWindow();
  
  // Wait for the page to be ready
  await page.waitForLoadState('domcontentloaded');
  
  return { app, page, errors: [] };
}

export function captureRendererErrors(page: Page): string[] {
  const errors: string[] = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  
  // Capture page errors (unhandled exceptions)
  page.on('pageerror', err => {
    errors.push(`Page error: ${String(err)}`);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  return errors;
}

export function setupMainProcessMonitoring(app: ElectronApplication): void {
  const proc = app.process();
  
  // Monitor for unexpected exits
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      throw new Error(`Electron main process exited unexpectedly with code ${code}`);
    }
  });
}

export async function closeApp(context: TestContext): Promise<void> {
  try {
    // Close the app gracefully
    await context.app.close();
  } catch (error) {
    console.warn('Error closing Electron app:', error);
  }
}