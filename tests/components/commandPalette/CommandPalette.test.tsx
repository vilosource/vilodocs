import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandPalette } from '../../../src/components/commandPalette/CommandPalette';
import { useCommandPalette } from '../../../src/hooks/useCommandPalette';

// Mock the useCommandPalette hook
vi.mock('../../../src/hooks/useCommandPalette');

describe('CommandPalette', () => {
  const mockGetItems = vi.fn();
  const mockExecuteItem = vi.fn();
  const mockUseCommandPalette = useCommandPalette as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementation
    mockUseCommandPalette.mockReturnValue({
      getItems: mockGetItems,
      executeItem: mockExecuteItem,
    });
  });

  describe('async item loading', () => {
    it('should handle async getItems that returns a Promise', async () => {
      const testItems = [
        { id: '1', label: 'File 1', action: vi.fn() },
        { id: '2', label: 'File 2', action: vi.fn() },
      ];
      
      // Mock getItems to return a Promise (async)
      mockGetItems.mockResolvedValue(testItems);
      
      const { container } = render(
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      );
      
      // Initially should not crash even if items haven't loaded yet
      expect(container.querySelector('.command-palette-container')).toBeInTheDocument();
      
      // Wait for items to load
      await waitFor(() => {
        const items = screen.getAllByRole('button');
        expect(items).toHaveLength(2);
      });
      
      // Check that items are rendered
      expect(screen.getByText('File 1')).toBeInTheDocument();
      expect(screen.getByText('File 2')).toBeInTheDocument();
    });

    it('should show empty state while loading', async () => {
      // Mock getItems to return a Promise that takes time to resolve
      mockGetItems.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      
      render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
      
      // Should show empty state initially
      expect(screen.getByText(/Start typing to search files/i)).toBeInTheDocument();
    });

    it('should handle getItems returning null/undefined gracefully', async () => {
      // This is the case that caused our bug - getItems returning undefined
      mockGetItems.mockResolvedValue(undefined);
      
      render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
      
      // Should not crash and show empty state
      await waitFor(() => {
        expect(screen.getByText(/Start typing to search files/i)).toBeInTheDocument();
      });
    });

    it('should update items when query changes', async () => {
      const firstItems = [
        { id: '1', label: 'index.ts', action: vi.fn() },
      ];
      const secondItems = [
        { id: '2', label: 'package.json', action: vi.fn() },
      ];
      
      // Start with empty items, then return specific items based on query
      mockGetItems
        .mockResolvedValueOnce([])  // Initial load with no query
        .mockResolvedValueOnce(firstItems)  // After first query
        .mockResolvedValueOnce(secondItems);  // After second query
      
      const { rerender } = render(
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      );
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText(/Start typing to search files/i)).toBeInTheDocument();
      });
      
      // Type in the input to trigger a search
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'index' } });
      
      // Wait for first items
      await waitFor(() => {
        expect(screen.getByText('index.ts')).toBeInTheDocument();
      });
      
      // Clear and type new query
      fireEvent.change(input, { target: { value: 'package' } });
      
      // Wait for new items
      await waitFor(() => {
        expect(screen.getByText('package.json')).toBeInTheDocument();
      });
      
      expect(mockGetItems).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle getItems throwing an error', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* suppress error */ });
      
      // Return a rejected promise that will be caught
      mockGetItems.mockImplementation(() => Promise.reject(new Error('Failed to fetch items')));
      
      render(<CommandPalette isOpen={true} onClose={vi.fn()} />);
      
      // Should not crash and show empty state
      await waitFor(() => {
        expect(screen.getByText(/Start typing to search files/i)).toBeInTheDocument();
      });
      
      // Verify the error was caught (no unhandled rejection)
      expect(mockGetItems).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('synchronous to async migration', () => {
    it('should have caught the bug where items.map is not a function', async () => {
      // This test simulates the exact bug we encountered
      // getItems returns a Promise, but the component was trying to use it as an array
      
      const mockPromise = Promise.resolve([
        { id: '1', label: 'Test File', action: vi.fn() }
      ]);
      
      // Return the Promise directly (not awaited)
      mockGetItems.mockReturnValue(mockPromise);
      
      // This would have failed with "items.map is not a function" before our fix
      const { container } = render(
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      );
      
      // Should render without crashing
      expect(container.querySelector('.command-palette-container')).toBeInTheDocument();
      
      // And eventually show the items
      await waitFor(() => {
        expect(screen.getByText('Test File')).toBeInTheDocument();
      });
    });
  });
});