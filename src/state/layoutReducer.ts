import { Tab, LayoutNode, Split, Leaf, isSplit, isLeaf } from '../layout/types';

export interface EditorGridState {
  root: LayoutNode;
  activeLeafId: string;
  leafMap: Map<string, Leaf>;
  focusHistory: string[];
  focusMode: {
    active: boolean;
    tabId: string | null;
  };
}

export type LayoutAction =
  | { type: 'ADD_TAB'; payload: { leafId: string; tab: Tab; index?: number } }
  | { type: 'ACTIVATE_TAB'; payload: { tabId: string } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string; force?: boolean } }
  | { type: 'SPLIT_LEAF'; payload: { leafId: string; direction: 'horizontal' | 'vertical'; ratio?: number } }
  | { type: 'MERGE_LEAF'; payload: { leafId: string } }
  | { type: 'MOVE_TAB'; payload: { tabId: string; targetLeafId: string; index?: number } }
  | { type: 'REORDER_TABS'; payload: { leafId: string; fromIndex: number; toIndex: number } }
  | { type: 'RESIZE_SPLIT'; payload: { splitId: string; sizes: number[] } }
  | { type: 'CLOSE_ALL_TABS'; payload: { leafId: string } }
  | { type: 'CLOSE_TABS_TO_RIGHT'; payload: { leafId: string; fromIndex: number } }
  | { type: 'UPDATE_TAB_DIRTY'; payload: { tabId: string; dirty: boolean } }
  | { type: 'UPDATE_TAB_CONTENT'; payload: { tabId: string; content: string } }
  | { type: 'SWITCH_TAB_WIDGET'; payload: { tabId: string; widgetType: string } }
  | { type: 'FOCUS_LEAF'; payload: { leafId: string } }
  | { type: 'TOGGLE_FOCUS_MODE'; payload: { tabId?: string } }
  | { type: 'EXIT_FOCUS_MODE' }
  | { type: 'RESTORE_LAYOUT'; payload: LayoutNode };

let nextId = 1;
const generateId = () => `editor-${nextId++}`;

export function createLeaf(id: string, tabs: Tab[] = []): Leaf {
  return {
    id,
    type: 'leaf',
    tabs,
    activeTabId: tabs.length > 0 ? tabs[0].id : undefined
  };
}

export function createSplit(id: string, dir: 'row' | 'col', children: LayoutNode[], sizes?: number[]): Split {
  const childCount = children.length;
  const defaultSizes = sizes || Array(childCount).fill(100 / childCount);
  
  return {
    id,
    type: 'split',
    dir,
    children,
    sizes: defaultSizes
  };
}

function createWelcomeTab(): Tab {
  return {
    id: `welcome-${generateId()}`,
    title: 'Welcome',
    closeable: true,
    widget: { type: 'welcome', props: {} }
  };
}

function findLeafWithTab(state: EditorGridState, tabId: string): Leaf | undefined {
  for (const leaf of state.leafMap.values()) {
    if (leaf.tabs.some(t => t.id === tabId)) {
      return leaf;
    }
  }
  return undefined;
}

function findParentSplit(node: LayoutNode, targetId: string, parent?: Split): Split | undefined {
  if (node.id === targetId) {
    return parent;
  }
  
  if (isSplit(node)) {
    for (const child of node.children) {
      const found = findParentSplit(child, targetId, node);
      if (found) return found;
    }
  }
  
  return undefined;
}

function rebuildLeafMap(root: LayoutNode): Map<string, Leaf> {
  const leafMap = new Map<string, Leaf>();
  
  function traverse(node: LayoutNode) {
    if (isLeaf(node)) {
      leafMap.set(node.id, node);
    } else if (isSplit(node)) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(root);
  return leafMap;
}

function replaceNode(root: LayoutNode, targetId: string, replacement: LayoutNode): LayoutNode {
  if (root.id === targetId) {
    return replacement;
  }
  
  if (isSplit(root)) {
    return {
      ...root,
      children: root.children.map(child => replaceNode(child, targetId, replacement))
    };
  }
  
  return root;
}

function compactTree(root: LayoutNode): LayoutNode {
  if (isLeaf(root)) {
    return root;
  }
  
  if (isSplit(root)) {
    const compactedChildren = root.children.map(compactTree);
    
    // If split has only one child, replace split with child
    if (compactedChildren.length === 1) {
      return compactedChildren[0];
    }
    
    return {
      ...root,
      children: compactedChildren
    };
  }
  
  return root;
}

function normalizeSizes(sizes: number[]): number[] {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (total === 0) return Array(sizes.length).fill(100 / sizes.length);
  return sizes.map(size => (size / total) * 100);
}

function enforceMinimumSizes(sizes: number[], minSize: number = 10): number[] {
  // First pass: ensure all sizes meet minimum
  let enforced = sizes.map(size => Math.max(size, minSize));
  
  // If we need to adjust, redistribute proportionally
  const total = enforced.reduce((sum, size) => sum + size, 0);
  if (total > 100) {
    // Need to normalize while maintaining minimums
    const minTotal = enforced.length * minSize;
    if (minTotal >= 100) {
      // All panels at minimum
      return Array(enforced.length).fill(100 / enforced.length);
    }
    
    // Scale down sizes that are above minimum
    const availableSpace = 100 - minTotal;
    const aboveMinTotal = enforced.reduce((sum, size) => sum + Math.max(0, size - minSize), 0);
    
    enforced = enforced.map(size => {
      if (size <= minSize) return minSize;
      const excess = size - minSize;
      return minSize + (excess / aboveMinTotal) * availableSpace;
    });
  }
  
  return normalizeSizes(enforced);
}

export function createInitialState(): EditorGridState {
  const welcomeTab = createWelcomeTab();
  const rootLeaf = createLeaf(generateId(), [welcomeTab]);
  
  return {
    root: rootLeaf,
    activeLeafId: rootLeaf.id,
    leafMap: new Map([[rootLeaf.id, rootLeaf]]),
    focusHistory: [rootLeaf.id],
    focusMode: {
      active: false,
      tabId: null
    }
  };
}

export function layoutReducer(state: EditorGridState, action: LayoutAction): EditorGridState {
  switch (action.type) {
    case 'ADD_TAB': {
      const { leafId, tab, index } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf) return state;
      
      const newTabs = [...leaf.tabs];
      if (index !== undefined && index >= 0 && index <= newTabs.length) {
        newTabs.splice(index, 0, tab);
      } else {
        newTabs.push(tab);
      }
      
      const updatedLeaf: Leaf = {
        ...leaf,
        tabs: newTabs,
        activeTabId: tab.id
      };
      
      const newRoot = replaceNode(state.root, leafId, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot),
        activeLeafId: leafId
      };
    }
    
    case 'ACTIVATE_TAB': {
      const { tabId } = action.payload;
      const leaf = findLeafWithTab(state, tabId);
      
      if (!leaf) return state;
      
      const updatedLeaf: Leaf = {
        ...leaf,
        activeTabId: tabId
      };
      
      const newRoot = replaceNode(state.root, leaf.id, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot),
        activeLeafId: leaf.id,
        focusHistory: [...state.focusHistory.filter(id => id !== leaf.id), leaf.id]
      };
    }
    
    case 'CLOSE_TAB': {
      const { tabId, force = false } = action.payload;
      const leaf = findLeafWithTab(state, tabId);
      
      if (!leaf) return state;
      
      const tab = leaf.tabs.find(t => t.id === tabId);
      if (tab?.dirty && !force) {
        // Don't close dirty tabs unless forced
        return state;
      }
      
      const newTabs = leaf.tabs.filter(t => t.id !== tabId);
      const closedIndex = leaf.tabs.findIndex(t => t.id === tabId);
      
      let newActiveTabId = leaf.activeTabId;
      if (leaf.activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Activate next tab or previous if closing last
          const nextIndex = Math.min(closedIndex, newTabs.length - 1);
          newActiveTabId = newTabs[nextIndex].id;
        } else {
          newActiveTabId = undefined;
        }
      }
      
      const updatedLeaf: Leaf = {
        ...leaf,
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
      
      let newRoot = replaceNode(state.root, leaf.id, updatedLeaf);
      
      // If leaf is now empty, try to merge
      if (newTabs.length === 0) {
        const parent = findParentSplit(state.root, leaf.id);
        if (parent && parent.children.length === 2) {
          // Remove empty leaf and promote sibling
          const sibling = parent.children.find(c => c.id !== leaf.id);
          if (sibling) {
            newRoot = replaceNode(newRoot, parent.id, sibling);
            newRoot = compactTree(newRoot);
          }
        }
      }
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'SPLIT_LEAF': {
      const { leafId, direction, ratio = 0.5 } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf) return state;
      
      const newLeafId = generateId();
      
      // If the current leaf has an active tab, duplicate it to the new pane
      let newLeafTabs: Tab[] = [];
      if (leaf.activeTabId && leaf.tabs.length > 0) {
        const activeTab = leaf.tabs.find(t => t.id === leaf.activeTabId);
        if (activeTab) {
          // Clone the active tab for the new pane
          const clonedTab: Tab = {
            ...activeTab,
            id: `${activeTab.id}-split-${generateId()}`, // Generate unique ID
            title: activeTab.title
          };
          newLeafTabs = [clonedTab];
        }
      }
      
      // If no tabs to duplicate, create a welcome tab
      if (newLeafTabs.length === 0) {
        newLeafTabs = [createWelcomeTab()];
      }
      
      const newLeaf = createLeaf(newLeafId, newLeafTabs);
      
      const splitId = generateId();
      const split = createSplit(
        splitId,
        direction === 'horizontal' ? 'row' : 'col',
        [leaf, newLeaf],
        [ratio * 100, (1 - ratio) * 100]
      );
      
      const newRoot = replaceNode(state.root, leafId, split);
      const newLeafMap = rebuildLeafMap(newRoot);
      
      return {
        ...state,
        root: newRoot,
        leafMap: newLeafMap,
        activeLeafId: newLeafId,
        focusHistory: [...state.focusHistory, newLeafId]
      };
    }
    
    case 'MERGE_LEAF': {
      const { leafId } = action.payload;
      const parent = findParentSplit(state.root, leafId);
      
      if (!parent || parent.children.length !== 2) return state;
      
      const sibling = parent.children.find(c => c.id !== leafId);
      if (!sibling) return state;
      
      let newRoot = replaceNode(state.root, parent.id, sibling);
      newRoot = compactTree(newRoot);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'MOVE_TAB': {
      const { tabId, targetLeafId, index } = action.payload;
      const sourceLeaf = findLeafWithTab(state, tabId);
      const targetLeaf = state.leafMap.get(targetLeafId);
      
      if (!sourceLeaf || !targetLeaf || sourceLeaf.id === targetLeafId) return state;
      
      const tab = sourceLeaf.tabs.find(t => t.id === tabId);
      if (!tab) return state;
      
      // Remove from source
      const sourceTabs = sourceLeaf.tabs.filter(t => t.id !== tabId);
      let sourceActiveTab = sourceLeaf.activeTabId;
      if (sourceActiveTab === tabId) {
        sourceActiveTab = sourceTabs.length > 0 ? sourceTabs[0].id : undefined;
      }
      
      // Add to target
      const targetTabs = [...targetLeaf.tabs];
      if (index !== undefined && index >= 0 && index <= targetTabs.length) {
        targetTabs.splice(index, 0, tab);
      } else {
        targetTabs.push(tab);
      }
      
      const updatedSource: Leaf = {
        ...sourceLeaf,
        tabs: sourceTabs,
        activeTabId: sourceActiveTab
      };
      
      const updatedTarget: Leaf = {
        ...targetLeaf,
        tabs: targetTabs,
        activeTabId: tabId
      };
      
      let newRoot = replaceNode(state.root, sourceLeaf.id, updatedSource);
      newRoot = replaceNode(newRoot, targetLeaf.id, updatedTarget);
      
      // Compact tree if source is now empty
      if (sourceTabs.length === 0) {
        const parent = findParentSplit(newRoot, sourceLeaf.id);
        if (parent && parent.children.length === 2) {
          const sibling = parent.children.find(c => c.id !== sourceLeaf.id);
          if (sibling) {
            newRoot = replaceNode(newRoot, parent.id, sibling);
            newRoot = compactTree(newRoot);
          }
        }
      }
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot),
        activeLeafId: targetLeafId
      };
    }
    
    case 'REORDER_TABS': {
      const { leafId, fromIndex, toIndex } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf || fromIndex === toIndex) return state;
      if (fromIndex < 0 || fromIndex >= leaf.tabs.length) return state;
      if (toIndex < 0 || toIndex >= leaf.tabs.length) return state;
      
      const newTabs = [...leaf.tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      
      const updatedLeaf: Leaf = {
        ...leaf,
        tabs: newTabs
      };
      
      const newRoot = replaceNode(state.root, leafId, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'RESIZE_SPLIT': {
      const { splitId, sizes } = action.payload;
      
      function updateSplit(node: LayoutNode): LayoutNode {
        if (isSplit(node) && node.id === splitId) {
          const enforcedSizes = enforceMinimumSizes(sizes);
          return {
            ...node,
            sizes: enforcedSizes
          };
        }
        
        if (isSplit(node)) {
          return {
            ...node,
            children: node.children.map(updateSplit)
          };
        }
        
        return node;
      }
      
      const newRoot = updateSplit(state.root);
      
      return {
        ...state,
        root: newRoot
      };
    }
    
    case 'CLOSE_ALL_TABS': {
      const { leafId } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf) return state;
      
      const updatedLeaf: Leaf = {
        ...leaf,
        tabs: [],
        activeTabId: undefined
      };
      
      let newRoot = replaceNode(state.root, leafId, updatedLeaf);
      
      // Try to merge if empty
      const parent = findParentSplit(newRoot, leafId);
      if (parent && parent.children.length === 2) {
        const sibling = parent.children.find(c => c.id !== leafId);
        if (sibling) {
          newRoot = replaceNode(newRoot, parent.id, sibling);
          newRoot = compactTree(newRoot);
        }
      }
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'CLOSE_TABS_TO_RIGHT': {
      const { leafId, fromIndex } = action.payload;
      const leaf = state.leafMap.get(leafId);
      
      if (!leaf || fromIndex < 0 || fromIndex >= leaf.tabs.length - 1) return state;
      
      const newTabs = leaf.tabs.slice(0, fromIndex + 1);
      
      const updatedLeaf: Leaf = {
        ...leaf,
        tabs: newTabs,
        activeTabId: newTabs.some(t => t.id === leaf.activeTabId) 
          ? leaf.activeTabId 
          : newTabs[newTabs.length - 1]?.id
      };
      
      const newRoot = replaceNode(state.root, leafId, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'UPDATE_TAB_DIRTY': {
      const { tabId, dirty } = action.payload;
      const leaf = findLeafWithTab(state, tabId);
      if (!leaf) return state;

      const updatedTabs = leaf.tabs.map(tab =>
        tab.id === tabId ? { ...tab, dirty } : tab
      );

      const updatedLeaf = { ...leaf, tabs: updatedTabs };
      const newRoot = replaceLeafInTree(state.root, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }

    case 'UPDATE_TAB_CONTENT': {
      const { tabId, content } = action.payload;
      const leaf = findLeafWithTab(state, tabId);
      if (!leaf) return state;

      const updatedTabs = leaf.tabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            widget: {
              ...tab.widget,
              props: {
                ...tab.widget?.props,
                content
              }
            }
          };
        }
        return tab;
      });

      const updatedLeaf = { ...leaf, tabs: updatedTabs };
      const newRoot = replaceLeafInTree(state.root, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }

    case 'SWITCH_TAB_WIDGET': {
      const { tabId, widgetType } = action.payload;
      const leaf = findLeafWithTab(state, tabId);
      if (!leaf) return state;
      
      const updatedTabs = leaf.tabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            widget: {
              ...tab.widget,
              type: widgetType
            }
          };
        }
        return tab;
      });
      
      const updatedLeaf = { ...leaf, tabs: updatedTabs };
      const newRoot = replaceLeafInTree(state.root, updatedLeaf);
      
      return {
        ...state,
        root: newRoot,
        leafMap: rebuildLeafMap(newRoot)
      };
    }
    
    case 'FOCUS_LEAF': {
      const { leafId } = action.payload;
      if (!state.leafMap.has(leafId)) return state;

      return {
        ...state,
        activeLeafId: leafId,
        focusHistory: [...state.focusHistory.filter(id => id !== leafId), leafId]
      };
    }

    case 'RESTORE_LAYOUT': {
      const newRoot = migrateLegacyTabs(action.payload);
      const leafMap = rebuildLeafMap(newRoot);
      
      // Find first leaf to set as active if not already set
      let activeLeafId = state.activeLeafId;
      if (!activeLeafId || !leafMap.has(activeLeafId)) {
        const firstLeaf = Array.from(leafMap.values())[0];
        activeLeafId = firstLeaf?.id || '';
      }
      
      return {
        ...state,
        root: newRoot,
        leafMap,
        activeLeafId
      };
    }

    case 'TOGGLE_FOCUS_MODE': {
      const { tabId } = action.payload;
      
      if (state.focusMode.active) {
        // Exit focus mode
        return {
          ...state,
          focusMode: {
            active: false,
            tabId: null
          }
        };
      } else {
        // Enter focus mode with specified tab or current active tab
        let targetTabId = tabId;
        
        if (!targetTabId) {
          // Find current active tab
          const activeLeaf = state.leafMap.get(state.activeLeafId);
          targetTabId = activeLeaf?.activeTabId || null;
        }
        
        if (!targetTabId) {
          // No active tab to focus on
          return state;
        }
        
        return {
          ...state,
          focusMode: {
            active: true,
            tabId: targetTabId
          }
        };
      }
    }

    case 'EXIT_FOCUS_MODE': {
      if (!state.focusMode.active) {
        return state;
      }
      
      return {
        ...state,
        focusMode: {
          active: false,
          tabId: null
        }
      };
    }
    
    default:
      return state;
  }
}

function replaceLeafInTree(root: LayoutNode, updatedLeaf: Leaf): LayoutNode {
  if (isLeaf(root)) {
    return root.id === updatedLeaf.id ? updatedLeaf : root;
  }
  
  if (isSplit(root)) {
    return {
      ...root,
      children: root.children.map(child => replaceLeafInTree(child, updatedLeaf))
    };
  }
  
  return root;
}

// Migrate legacy tabs that don't have widget property
function migrateLegacyTabs(node: LayoutNode): LayoutNode {
  if (isLeaf(node)) {
    return {
      ...node,
      tabs: node.tabs.map(tab => {
        if (!tab.widget) {
          // Legacy tab - create appropriate widget based on content
          console.warn('Migrating legacy tab without widget:', tab.title);
          
          // If it has content property, assume it's a text editor
          if ('content' in (tab as any)) {
            return {
              ...tab,
              widget: {
                type: 'text-editor',
                props: { content: (tab as any).content }
              }
            };
          }
          
          // Default to welcome widget
          return {
            ...tab,
            widget: { type: 'welcome', props: {} }
          };
        }
        return tab;
      })
    };
  }
  
  if (isSplit(node)) {
    return {
      ...node,
      children: node.children.map(child => migrateLegacyTabs(child))
    };
  }
  
  return node;
}