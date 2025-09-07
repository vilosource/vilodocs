import { describe, test, expect } from 'vitest';
import { 
  layoutReducer, 
  EditorGridState,
  LayoutAction,
  createLeaf,
  createSplit
} from '../../src/state/layoutReducer';

describe('layoutReducer', () => {
  const initialState: EditorGridState = {
    root: createLeaf('root', []),
    activeLeafId: 'root',
    leafMap: new Map([['root', createLeaf('root', [])]]),
    focusHistory: ['root']
  };

  describe('ADD_TAB', () => {
    test('should add tab to specified leaf', () => {
      const action: LayoutAction = {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: {
            id: 'tab1',
            title: 'File.ts',
            widget: { type: 'text-editor', props: {} }
          }
        }
      };

      const newState = layoutReducer(initialState, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.tabs).toHaveLength(1);
      expect(rootLeaf?.tabs[0].id).toBe('tab1');
      expect(rootLeaf?.activeTabId).toBe('tab1');
    });

    test('should add tab at specified index', () => {
      const stateWithTab = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'First', widget: { type: 'text-editor', props: {} } }
        }
      });

      const action: LayoutAction = {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab2', title: 'Second', widget: { type: 'text-editor', props: {} } },
          index: 0
        }
      };

      const newState = layoutReducer(stateWithTab, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.tabs[0].id).toBe('tab2');
      expect(rootLeaf?.tabs[1].id).toBe('tab1');
    });
  });

  describe('ACTIVATE_TAB', () => {
    test('should activate specified tab', () => {
      const stateWithTabs = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'First', widget: { type: 'text-editor', props: {} } }
        }
      });

      const action: LayoutAction = {
        type: 'ACTIVATE_TAB',
        payload: { tabId: 'tab1' }
      };

      const newState = layoutReducer(stateWithTabs, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.activeTabId).toBe('tab1');
      expect(newState.activeLeafId).toBe('root');
    });
  });

  describe('CLOSE_TAB', () => {
    test('should close tab and activate next', () => {
      let state = initialState;
      
      // Add two tabs
      state = layoutReducer(state, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'First', widget: { type: 'text-editor', props: {} } }
        }
      });
      
      state = layoutReducer(state, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab2', title: 'Second', widget: { type: 'text-editor', props: {} } }
        }
      });

      // Close first tab
      const action: LayoutAction = {
        type: 'CLOSE_TAB',
        payload: { tabId: 'tab1' }
      };

      const newState = layoutReducer(state, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.tabs).toHaveLength(1);
      expect(rootLeaf?.tabs[0].id).toBe('tab2');
      expect(rootLeaf?.activeTabId).toBe('tab2');
    });

    test('should not close tab if dirty and not forced', () => {
      const state = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { 
            id: 'tab1', 
            title: 'Dirty File', 
            dirty: true,
            widget: { type: 'text-editor', props: {} } 
          }
        }
      });

      const action: LayoutAction = {
        type: 'CLOSE_TAB',
        payload: { tabId: 'tab1', force: false }
      };

      const newState = layoutReducer(state, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.tabs).toHaveLength(1);
      expect(rootLeaf?.tabs[0].id).toBe('tab1');
    });
  });

  describe('SPLIT_LEAF', () => {
    test('should split leaf horizontally', () => {
      const state = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'File', widget: { type: 'text-editor', props: {} } }
        }
      });

      const action: LayoutAction = {
        type: 'SPLIT_LEAF',
        payload: {
          leafId: 'root',
          direction: 'horizontal',
          ratio: 0.5
        }
      };

      const newState = layoutReducer(state, action);
      
      // Root should now be a split
      expect(newState.root.type).toBe('split');
      if (newState.root.type === 'split') {
        expect(newState.root.dir).toBe('row');
        expect(newState.root.children).toHaveLength(2);
        expect(newState.root.sizes).toEqual([50, 50]);
        
        // First child should have the original tab
        const firstChild = newState.root.children[0];
        if (firstChild.type === 'leaf') {
          expect(firstChild.tabs).toHaveLength(1);
          expect(firstChild.tabs[0].id).toBe('tab1');
        }
        
        // Second child should have a duplicated tab from the original
        const secondChild = newState.root.children[1];
        if (secondChild.type === 'leaf') {
          expect(secondChild.tabs).toHaveLength(1);
          expect(secondChild.tabs[0].title).toBe('File'); // Duplicated from the original tab
        }
      }
    });

    test('should split leaf vertically', () => {
      const action: LayoutAction = {
        type: 'SPLIT_LEAF',
        payload: {
          leafId: 'root',
          direction: 'vertical',
          ratio: 0.6
        }
      };

      const newState = layoutReducer(initialState, action);
      
      expect(newState.root.type).toBe('split');
      if (newState.root.type === 'split') {
        expect(newState.root.dir).toBe('col');
        expect(newState.root.sizes).toEqual([60, 40]);
      }
    });
  });

  describe('MERGE_LEAF', () => {
    test('should merge empty leaf with sibling', () => {
      // Create a split state
      let state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      // Get the new leaf IDs - find the one with Welcome tab
      let emptyLeafId: string | undefined;
      for (const [id, leaf] of state.leafMap.entries()) {
        if (leaf.tabs.some(t => t.title === 'Welcome')) {
          emptyLeafId = id;
          break;
        }
      }

      if (!emptyLeafId) {
        throw new Error('Could not find leaf with Welcome tab');
      }

      // Close the Welcome tab to make it truly empty
      const welcomeTab = state.leafMap.get(emptyLeafId)?.tabs[0];
      if (welcomeTab) {
        state = layoutReducer(state, {
          type: 'CLOSE_TAB',
          payload: { tabId: welcomeTab.id, force: true }
        });
      }

      // After closing, the structure should have been automatically collapsed
      // since CLOSE_TAB handles merging empty leaves
      expect(state.root.type).toBe('leaf');
      expect(state.leafMap.size).toBe(1);
    });
  });

  describe('MOVE_TAB', () => {
    test('should move tab between leaves', () => {
      // Create split with tabs
      let state = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'File 1', widget: { type: 'text-editor', props: {} } }
        }
      });

      state = layoutReducer(state, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      const leafIds = Array.from(state.leafMap.keys());
      const targetLeafId = leafIds.find(id => id !== 'root' && state.leafMap.get(id)?.tabs.length === 1);

      if (targetLeafId) {
        const action: LayoutAction = {
          type: 'MOVE_TAB',
          payload: {
            tabId: 'tab1',
            targetLeafId,
            index: 0
          }
        };

        const newState = layoutReducer(state, action);
        const targetLeaf = newState.leafMap.get(targetLeafId);
        
        expect(targetLeaf?.tabs.some(t => t.id === 'tab1')).toBe(true);
      }
    });
  });

  describe('REORDER_TABS', () => {
    test('should reorder tabs within leaf', () => {
      let state = initialState;
      
      // Add three tabs
      state = layoutReducer(state, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'File 1', widget: { type: 'text-editor', props: {} } }
        }
      });
      
      state = layoutReducer(state, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab2', title: 'File 2', widget: { type: 'text-editor', props: {} } }
        }
      });
      
      state = layoutReducer(state, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab3', title: 'File 3', widget: { type: 'text-editor', props: {} } }
        }
      });

      const action: LayoutAction = {
        type: 'REORDER_TABS',
        payload: {
          leafId: 'root',
          fromIndex: 0,
          toIndex: 2
        }
      };

      const newState = layoutReducer(state, action);
      const rootLeaf = newState.leafMap.get('root');
      
      expect(rootLeaf?.tabs[0].id).toBe('tab2');
      expect(rootLeaf?.tabs[1].id).toBe('tab3');
      expect(rootLeaf?.tabs[2].id).toBe('tab1');
    });
  });

  describe('RESIZE_SPLIT', () => {
    test('should resize split children', () => {
      const state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      const action: LayoutAction = {
        type: 'RESIZE_SPLIT',
        payload: {
          splitId: state.root.id,
          sizes: [70, 30]
        }
      };

      const newState = layoutReducer(state, action);
      
      if (newState.root.type === 'split') {
        expect(newState.root.sizes).toEqual([70, 30]);
      }
    });

    test('should enforce minimum sizes', () => {
      const state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      const action: LayoutAction = {
        type: 'RESIZE_SPLIT',
        payload: {
          splitId: state.root.id,
          sizes: [95, 5] // Too small for second panel
        }
      };

      const newState = layoutReducer(state, action);
      
      if (newState.root.type === 'split') {
        // Should enforce minimum size
        expect(newState.root.sizes[1]).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe('Invariants', () => {
    test('split should always have at least 2 children', () => {
      const state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      if (state.root.type === 'split') {
        expect(state.root.children.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('sizes should always sum to 100', () => {
      const state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      if (state.root.type === 'split') {
        const sum = state.root.sizes.reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - 100)).toBeLessThan(0.01);
      }
    });

    test('active tab should exist in its leaf', () => {
      const state = layoutReducer(initialState, {
        type: 'ADD_TAB',
        payload: {
          leafId: 'root',
          tab: { id: 'tab1', title: 'File', widget: { type: 'text-editor', props: {} } }
        }
      });

      const rootLeaf = state.leafMap.get('root');
      if (rootLeaf && rootLeaf.type === 'leaf' && rootLeaf.activeTabId) {
        const activeTabExists = rootLeaf.tabs.some(t => t.id === rootLeaf.activeTabId);
        expect(activeTabExists).toBe(true);
      }
    });

    test('leafMap should contain all leaves in tree', () => {
      let state = layoutReducer(initialState, {
        type: 'SPLIT_LEAF',
        payload: { leafId: 'root', direction: 'horizontal' }
      });

      state = layoutReducer(state, {
        type: 'SPLIT_LEAF',
        payload: { leafId: Array.from(state.leafMap.keys())[0], direction: 'vertical' }
      });

      // Count leaves in tree
      const countLeaves = (node: any): number => {
        if (node.type === 'leaf') return 1;
        return node.children.reduce((sum: number, child: any) => sum + countLeaves(child), 0);
      };

      const leafCount = countLeaves(state.root);
      expect(state.leafMap.size).toBe(leafCount);
    });
  });
});