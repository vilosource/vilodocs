import React, { useState } from 'react';
import { Leaf } from '../../layout/types';
import { TabStrip } from '../shared/TabStrip';
import { DockOverlay } from '../dnd/DockOverlay';
import { useDragDrop } from '../../hooks/useDragDrop';
import './EditorLeaf.css';

interface EditorLeafProps {
  leaf: Leaf;
  isActive: boolean;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onFocus: () => void;
  dispatch?: (action: any) => void;
}

export const EditorLeaf: React.FC<EditorLeafProps> = ({
  leaf,
  isActive,
  onTabClick,
  onTabClose,
  onTabReorder,
  onFocus,
  dispatch
}) => {
  const [overlayBounds, setOverlayBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const { isOver, dropPosition, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    dispatch: dispatch || (() => {}),
    leafId: leaf.id
  });

  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onTabClose(tabId);
  };

  const handleLeafDragOver = (e: React.DragEvent) => {
    handleDragOver(e);
    
    // Update overlay bounds
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setOverlayBounds({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
  };

  const handleLeafDragLeave = (e: React.DragEvent) => {
    handleDragLeave(e);
    setOverlayBounds(null);
  };

  const handleLeafDrop = (e: React.DragEvent) => {
    handleDrop(e);
    setOverlayBounds(null);
  };

  return (
    <div 
      className={`editor-leaf ${isActive ? 'active' : ''} ${isOver ? 'drag-over' : ''}`}
      onClick={onFocus}
      role="group"
      aria-label={`Editor pane with ${leaf.tabs.length} tabs`}
      onDragOver={handleLeafDragOver}
      onDragLeave={handleLeafDragLeave}
      onDrop={handleLeafDrop}
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
      {overlayBounds && dropPosition && (
        <DockOverlay
          visible={isOver}
          position={dropPosition}
          bounds={overlayBounds}
        />
      )}
    </div>
  );
};