import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.e2e.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'off', // No videos as requested
    screenshot: 'only-on-failure'
  },
});