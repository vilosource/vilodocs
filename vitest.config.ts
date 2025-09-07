// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'node_modules/**',
      'tests/**/*.e2e.spec.ts',  // Exclude E2E tests (these are for Playwright)
      'tests/**/*.e2e.spec.tsx'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'out/',
        '.vite/',
        '*.config.ts',
        'src/**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});