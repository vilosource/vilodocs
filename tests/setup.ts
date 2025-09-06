import { vi } from 'vitest';

// Mock electron if needed in tests
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '0.3.1')
  },
  ipcRenderer: {
    send: vi.fn(),
    on: vi.fn(),
    invoke: vi.fn()
  }
}));