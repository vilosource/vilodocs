import React, { useEffect, useCallback } from 'react';
import { EditorGridState, LayoutAction } from '../../state/layoutReducer';
import { EditorSplit } from './EditorSplit';
import { EditorLeaf } from './EditorLeaf';
import { isSplit, isLeaf } from '../../layout/types';
import './EditorGrid.css';

interface EditorGridProps {
  state: EditorGridState;
  dispatch: (action: LayoutAction) => void;
}

export const EditorGrid: React.FC<EditorGridProps> = ({ state, dispatch }) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '\\') {
          e.preventDefault();
          // Split horizontally
          dispatch({
            type: 'SPLIT_LEAF',
            payload: {
              leafId: state.activeLeafId,
              direction: 'horizontal',
              ratio: 0.5
            }
          });
        } else if (e.altKey && e.key === '\\') {
          e.preventDefault();
          // Split vertically
          dispatch({
            type: 'SPLIT_LEAF',
            payload: {
              leafId: state.activeLeafId,
              direction: 'vertical',
              ratio: 0.5
            }
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.activeLeafId, dispatch]);

  const handleTabClick = useCallback((tabId: string) => {
    dispatch({
      type: 'ACTIVATE_TAB',
      payload: { tabId }
    });
  }, [dispatch]);

  const handleTabClose = useCallback((tabId: string) => {
    dispatch({
      type: 'CLOSE_TAB',
      payload: { tabId }
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
        />
      );
    }
    
    return null;
  };

  return (
    <div className="editor-grid">
      {renderNode(state.root)}
    </div>
  );
};