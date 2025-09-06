import React from 'react';
import { Leaf } from '../../layout/types';
import { TabStrip } from '../shared/TabStrip';
import './EditorLeaf.css';

interface EditorLeafProps {
  leaf: Leaf;
  isActive: boolean;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onFocus: () => void;
}

export const EditorLeaf: React.FC<EditorLeafProps> = ({
  leaf,
  isActive,
  onTabClick,
  onTabClose,
  onTabReorder,
  onFocus
}) => {
  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onTabClose(tabId);
  };

  return (
    <div 
      className={`editor-leaf ${isActive ? 'active' : ''}`}
      onClick={onFocus}
      role="group"
      aria-label={`Editor pane with ${leaf.tabs.length} tabs`}
    >
      {leaf.tabs.length > 0 ? (
        <>
          <TabStrip
            tabs={leaf.tabs.map(tab => ({
              id: tab.id,
              title: tab.title,
              icon: tab.icon,
              dirty: tab.dirty,
              closeable: tab.closeable !== false
            }))}
            activeTabId={leaf.activeTabId}
            onTabClick={onTabClick}
            onTabClose={handleTabClose}
            onTabReorder={onTabReorder}
            draggable={true}
          />
          <div className="editor-content">
            {leaf.activeTabId && (
              <div className="editor-widget">
                {/* Widget content would be rendered here based on active tab */}
                <div className="widget-placeholder">
                  {leaf.tabs.find(t => t.id === leaf.activeTabId)?.title || 'No content'}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="editor-empty">
          <div className="empty-message">
            <h2>No files open</h2>
            <p>Open a file to start editing</p>
            <div className="empty-actions">
              <button className="empty-action">Open File</button>
              <button className="empty-action">New File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};