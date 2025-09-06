import { describe, it, expect, beforeEach } from 'vitest';
import { generateUniqueId, generateFileTabId, idGenerator } from '../../src/utils/id-generator';

describe('ID Generator', () => {
  beforeEach(() => {
    // Reset counter before each test
    idGenerator.reset();
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId('test');
      const id2 = generateUniqueId('test');
      const id3 = generateUniqueId('test');
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should include the provided prefix', () => {
      const id = generateUniqueId('custom-prefix');
      expect(id).toMatch(/^custom-prefix-/);
    });

    it('should generate unique IDs even when called rapidly', () => {
      const ids = new Set<string>();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        ids.add(generateUniqueId('rapid'));
      }
      
      // All IDs should be unique
      expect(ids.size).toBe(count);
    });

    it('should handle missing prefix', () => {
      const id = generateUniqueId();
      expect(id).toMatch(/^id-/);
    });

    it('should generate unique IDs even with same timestamp', () => {
      // Mock Date.now to return same value
      const originalDateNow = Date.now;
      const fixedTime = 1234567890;
      Date.now = () => fixedTime;
      
      try {
        const id1 = generateUniqueId('test');
        const id2 = generateUniqueId('test');
        
        expect(id1).not.toBe(id2);
        expect(id1).toContain(fixedTime.toString());
        expect(id2).toContain(fixedTime.toString());
      } finally {
        Date.now = originalDateNow;
      }
    });
  });

  describe('generateFileTabId', () => {
    it('should generate unique IDs for different file paths', () => {
      const id1 = generateFileTabId('/path/to/file1.ts');
      const id2 = generateFileTabId('/path/to/file2.ts');
      
      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for the same file opened multiple times', () => {
      const path = '/path/to/same-file.ts';
      const id1 = generateFileTabId(path);
      const id2 = generateFileTabId(path);
      
      // Even same file should get different IDs (for multiple tabs of same file)
      expect(id1).not.toBe(id2);
    });

    it('should include file hash in the ID', () => {
      const id = generateFileTabId('/test/file.ts');
      expect(id).toMatch(/^file-\d+-/);
    });
  });

  describe('counter overflow handling', () => {
    it('should reset counter after reaching limit', () => {
      // Force counter to near limit
      for (let i = 0; i < 1000000; i++) {
        generateUniqueId('overflow-test');
      }
      
      // Should still generate unique IDs after many calls
      const id1 = generateUniqueId('post-overflow');
      const id2 = generateUniqueId('post-overflow');
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('React key uniqueness', () => {
    it('should never generate duplicate keys for React components', () => {
      // Simulate rapid tab creation that might happen in real usage
      const tabs = [];
      
      // Simulate opening multiple files quickly
      for (let i = 0; i < 10; i++) {
        tabs.push({
          id: generateFileTabId(`/file${i}.ts`),
          name: `file${i}.ts`
        });
      }
      
      // Check all IDs are unique
      const idSet = new Set(tabs.map(t => t.id));
      expect(idSet.size).toBe(tabs.length);
      
      // Simulate opening same file multiple times
      const samePath = '/repeated/file.ts';
      const repeatedTabs = [];
      for (let i = 0; i < 5; i++) {
        repeatedTabs.push({
          id: generateFileTabId(samePath),
          name: 'file.ts'
        });
      }
      
      // Even same file should have unique IDs
      const repeatedIdSet = new Set(repeatedTabs.map(t => t.id));
      expect(repeatedIdSet.size).toBe(repeatedTabs.length);
    });
  });
});