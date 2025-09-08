import { useCallback, useMemo, useRef, useEffect } from 'react';
import { PaletteItem } from '../components/commandPalette/CommandPalette';
import { useCommandPaletteContext } from '../contexts/CommandPaletteContext';

// Simple fuzzy search implementation
function fuzzySearch(query: string, text: string): { matches: boolean; score: number } {
  if (!query) return { matches: true, score: 0 };
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) {
    return { matches: true, score: 100 };
  }
  
  // Contains match gets good score
  if (lowerText.includes(lowerQuery)) {
    // Score based on position (earlier is better)
    const position = lowerText.indexOf(lowerQuery);
    const score = 80 - (position * 2);
    return { matches: true, score: Math.max(score, 40) };
  }
  
  // Fuzzy match - all query characters must be in text in order
  let queryIndex = 0;
  let lastMatchIndex = -1;
  let score = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        score += 3;
      }
      // Bonus for matching at word boundaries
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '.' || text[i - 1] === '_' || text[i - 1] === '-') {
        score += 5;
      }
      lastMatchIndex = i;
      queryIndex++;
      score += 1;
    }
  }
  
  if (queryIndex === query.length) {
    // All characters matched
    return { matches: true, score: Math.min(score, 35) };
  }
  
  return { matches: false, score: 0 };
}

export function useCommandPalette() {
  const context = useCommandPaletteContext();
  const recentItemsRef = useRef<Map<string, number>>(new Map());
  
  // Track recent item selections
  const executeItem = useCallback((item: PaletteItem) => {
    const count = recentItemsRef.current.get(item.id) || 0;
    recentItemsRef.current.set(item.id, count + 1);
    
    // Execute the item's action
    if (item.action) {
      Promise.resolve(item.action()).catch(error => {
        console.error('Error executing palette item:', error);
      });
    }
  }, []);
  
  // Get items based on mode and query
  const getItems = useCallback(async (mode: string, query: string): Promise<PaletteItem[]> => {
    let items: PaletteItem[] = [];
    const providers = context.getProviders();
    
    // Get items from the appropriate provider
    switch (mode) {
      case 'commands':
        if (providers.has('commands')) {
          const provider = providers.get('commands')!;
          items = await Promise.resolve(provider.getItems(query));
        }
        break;
      case 'files':
        if (providers.has('files')) {
          const provider = providers.get('files')!;
          items = await Promise.resolve(provider.getItems(query));
        } else {
          // No file provider available (no workspace open)
          items = [];
        }
        break;
      case 'symbols':
        // Symbols provider not yet implemented
        items = getMockSymbols();
        break;
      default:
        // For default mode, combine results from multiple providers
        if (providers.has('files')) {
          const fileProvider = providers.get('files')!;
          const fileItems = await Promise.resolve(fileProvider.getItems(query));
          items.push(...fileItems);
        }
    }
    
    // Filter and score items
    if (query) {
      items = items
        .map(item => {
          const result = fuzzySearch(query, item.label);
          if (item.description) {
            const descResult = fuzzySearch(query, item.description);
            if (descResult.score > result.score) {
              return { ...item, score: descResult.score };
            }
          }
          return result.matches ? { ...item, score: result.score } : null;
        })
        .filter((item): item is PaletteItem => item !== null)
        .sort((a, b) => {
          // First sort by score
          const scoreDiff = (b.score || 0) - (a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          
          // Then by recent usage
          const aRecent = recentItemsRef.current.get(a.id) || 0;
          const bRecent = recentItemsRef.current.get(b.id) || 0;
          if (aRecent !== bRecent) return bRecent - aRecent;
          
          // Finally alphabetically
          return a.label.localeCompare(b.label);
        });
    } else {
      // No query - sort by recent usage and alphabetically
      items.sort((a, b) => {
        const aRecent = recentItemsRef.current.get(a.id) || 0;
        const bRecent = recentItemsRef.current.get(b.id) || 0;
        if (aRecent !== bRecent) return bRecent - aRecent;
        return a.label.localeCompare(b.label);
      });
    }
    
    // Limit results for performance
    return items.slice(0, 50);
  }, [context]);
  
  return {
    getItems,
    executeItem,
    ...context
  };
}

// Mock data for testing - will be replaced with actual providers
function getMockCommands(): PaletteItem[] {
  return [
    {
      id: 'editor.splitHorizontal',
      label: 'Split Editor Right',
      description: 'Split the current editor to the right',
      keybinding: 'Ctrl+\\',
      category: 'View',
      action: () => console.log('Split horizontal')
    },
    {
      id: 'editor.splitVertical',
      label: 'Split Editor Down',
      description: 'Split the current editor down',
      keybinding: 'Ctrl+Alt+\\',
      category: 'View',
      action: () => console.log('Split vertical')
    },
    {
      id: 'view.toggleSidebar',
      label: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      keybinding: 'Ctrl+B',
      category: 'View',
      action: () => console.log('Toggle sidebar')
    },
    {
      id: 'file.save',
      label: 'Save',
      description: 'Save the current file',
      keybinding: 'Ctrl+S',
      category: 'File',
      action: () => console.log('Save file')
    },
    {
      id: 'file.saveAll',
      label: 'Save All',
      description: 'Save all open files',
      keybinding: 'Ctrl+K S',
      category: 'File',
      action: () => console.log('Save all files')
    }
  ];
}

function getMockFiles(): PaletteItem[] {
  return [
    {
      id: 'file:package.json',
      label: 'package.json',
      description: 'Project configuration',
      icon: '📦',
      action: () => console.log('Open package.json')
    },
    {
      id: 'file:README.md',
      label: 'README.md',
      description: 'Project documentation',
      icon: '📄',
      action: () => console.log('Open README.md')
    },
    {
      id: 'file:src/index.ts',
      label: 'index.ts',
      description: 'src/index.ts',
      icon: '📄',
      action: () => console.log('Open index.ts')
    }
  ];
}

function getMockSymbols(): PaletteItem[] {
  return [
    {
      id: 'symbol:CommandPalette',
      label: 'CommandPalette',
      description: 'class',
      icon: '🔷',
      action: () => console.log('Go to CommandPalette')
    },
    {
      id: 'symbol:useCommandPalette',
      label: 'useCommandPalette',
      description: 'function',
      icon: '🔶',
      action: () => console.log('Go to useCommandPalette')
    }
  ];
}