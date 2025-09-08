import React, { useEffect, useCallback, useRef, useState } from 'react';
import { EditorGridState, LayoutAction } from '../../state/layoutReducer';
import { EditorSplit } from './EditorSplit';
import { EditorLeaf } from './EditorLeaf';
import { isSplit, isLeaf } from '../../layout/types';
import { CommandManager } from '../../commands/CommandManager';
import { FocusManager } from '../../focus/FocusManager';
import { PaneNavigator } from '../navigation/PaneNavigator';
import './EditorGrid.css';

interface EditorGridProps {
  state: EditorGridState;
  dispatch: (action: LayoutAction) => void;
  commandManager?: CommandManager;
  focusManager?: FocusManager;
}

export const EditorGrid: React.FC<EditorGridProps> = ({ state, dispatch, commandManager, focusManager }) => {
  const localCommandManager = useRef<CommandManager | null>(null);
  const localFocusManager = useRef<FocusManager | null>(null);
  const [isPaneNavigatorActive, setIsPaneNavigatorActive] = useState(false);

  // Use provided managers or create local ones
  useEffect(() => {
    if (!localCommandManager.current) {
      localCommandManager.current = commandManager || new CommandManager(dispatch);
    }
    if (!localFocusManager.current) {
      localFocusManager.current = focusManager || new FocusManager();
    }
  }, [commandManager, focusManager, dispatch]);

  // Listen for pane navigator trigger from command palette
  useEffect(() => {
    const handlePaneNavigatorTrigger = () => {
      setIsPaneNavigatorActive(true);
    };

    document.addEventListener('pane-navigator-trigger', handlePaneNavigatorTrigger);
    return () => document.removeEventListener('pane-navigator-trigger', handlePaneNavigatorTrigger);
  }, []);
  // Handle keyboard shortcuts through CommandManager
  useEffect(() => {
    const cmdManager = localCommandManager.current;
    if (!cmdManager) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for pane navigator shortcut (Alt+P)
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        setIsPaneNavigatorActive(true);
        return;
      }

      // Build context for command execution
      const activeLeaf = findLeafById(state.root, state.activeLeafId);
      const context = {
        activeLeafId: state.activeLeafId,
        activeLeaf,
        editorGrid: state,
      };

      // Let command manager handle the event
      const handled = cmdManager.handleKeyboardEvent(e, context);
      if (handled) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  // Helper function to find leaf by ID
  const findLeafById = (node: typeof state.root, leafId: string): any => {
    if (isLeaf(node) && node.id === leafId) {
      return node;
    }
    if (isSplit(node)) {
      for (const child of node.children) {
        const found = findLeafById(child, leafId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleTabClick = useCallback((tabId: string) => {
    dispatch({
      type: 'ACTIVATE_TAB',
      payload: { tabId }
    });
  }, [dispatch]);

  const handleTabClose = useCallback((tabId: string) => {
    dispatch({
      type: 'CLOSE_TAB',
      payload: { tabId, force: true } // Force close when clicking X button
    });
  }, [dispatch]);

  const handleTabReorder = useCallback((leafId: string, fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'REORDER_TABS',
      payload: { leafId, fromIndex, toIndex }
    });
  }, [dispatch]);

  const handleSplitResize = useCallback((splitId: string, sizes: number[]) => {
    dispatch({
      type: 'RESIZE_SPLIT',
      payload: { splitId, sizes }
    });
  }, [dispatch]);

  const handlePaneSelect = useCallback((leafId: string) => {
    // Find the leaf and activate its active tab
    const leaf = findLeafById(state.root, leafId);
    if (leaf && isLeaf(leaf)) {
      dispatch({
        type: 'ACTIVATE_TAB',
        payload: { tabId: leaf.activeTabId || '' }
      });
    }
  }, [state.root, dispatch]);

  const renderNode = (node: typeof state.root): React.ReactNode => {
    if (isSplit(node)) {
      return (
        <EditorSplit
          key={node.id}
          split={node}
          activeLeafId={state.activeLeafId}
          onResize={(sizes) => handleSplitResize(node.id, sizes)}
        >
          {node.children.map(child => renderNode(child))}
        </EditorSplit>
      );
    }
    
    if (isLeaf(node)) {
      return (
        <EditorLeaf
          key={node.id}
          leaf={node}
          isActive={node.id === state.activeLeafId}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={(fromIndex, toIndex) => handleTabReorder(node.id, fromIndex, toIndex)}
          onFocus={() => {
            if (node.id !== state.activeLeafId) {
              dispatch({
                type: 'ACTIVATE_TAB',
                payload: { tabId: node.activeTabId || '' }
              });
            }
          }}
          dispatch={dispatch}
          focusManager={localFocusManager.current}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="editor-grid">
      {renderNode(state.root)}
      <PaneNavigator
        isActive={isPaneNavigatorActive}
        onDeactivate={() => setIsPaneNavigatorActive(false)}
        onPaneSelect={handlePaneSelect}
      />
    </div>
  );
};