import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.e2e.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: './tests/global-setup.ts',
  // Use a single worker to ensure tests run sequentially with shared app
  workers: 1,
  // Ensure tests in same file run in order
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'off', // No videos as requested
    screenshot: 'only-on-failure'
  },
  // Start Vite dev server before running tests
  webServer: {
    command: 'npm start',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});