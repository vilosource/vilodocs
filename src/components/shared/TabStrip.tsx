import React, { useRef, useState, useEffect } from 'react';
import './TabStrip.css';

export interface TabItem {
  id: string;
  title: string;
  icon?: string;
  dirty?: boolean;
  closeable?: boolean;
}

interface TabStripProps {
  tabs: TabItem[];
  activeTabId?: string;
  onTabClick: (tabId: string) => void;
  onTabClose?: (tabId: string, event: React.MouseEvent) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  draggable?: boolean;
}

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabReorder,
  draggable = false
}) => {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleTabClick = (tabId: string, event: React.MouseEvent) => {
    // Prevent click when closing
    if ((event.target as HTMLElement).classList.contains('tab-close')) {
      return;
    }
    onTabClick(tabId);
  };

  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onTabClose?.(tabId, event);
  };

  const handleKeyDown = (tabId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTabClick(tabId);
    } else if (event.key === 'Delete' && onTabClose) {
      const tab = tabs.find(t => t.id === tabId);
      if (tab?.closeable !== false) {
        onTabClose(tabId, event as any);
      }
    }
  };

  const handleDragStart = (tabId: string, event: React.DragEvent) => {
    setDraggedTab(tabId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (tabId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (draggedTab && draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (targetTabId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (draggedTab && draggedTab !== targetTabId && onTabReorder) {
      const fromIndex = tabs.findIndex(t => t.id === draggedTab);
      const toIndex = tabs.findIndex(t => t.id === targetTabId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        onTabReorder(fromIndex, toIndex);
      }
    }
    
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  // Focus management
  useEffect(() => {
    if (activeTabId) {
      const activeTabElement = tabRefs.current.get(activeTabId);
      if (activeTabElement && document.activeElement?.classList.contains('tab')) {
        activeTabElement.focus();
      }
    }
  }, [activeTabId]);

  return (
    <div className="tab-strip" role="tablist">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = tab.id === draggedTab;
        const isDragOver = tab.id === dragOverTab;
        const isCloseable = tab.closeable !== false;
        

        return (
          <div
            key={tab.id}
            ref={el => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            className={`tab ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.title}
            tabIndex={isActive ? 0 : -1}
            onClick={(e) => handleTabClick(tab.id, e)}
            onKeyDown={(e) => handleKeyDown(tab.id, e)}
            draggable={draggable}
            onDragStart={(e) => handleDragStart(tab.id, e)}
            onDragOver={(e) => handleDragOver(tab.id, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(tab.id, e)}
            onDragEnd={handleDragEnd}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-title">{tab.title}</span>
            {tab.dirty && <span className="tab-dirty-indicator">●</span>}
            {isCloseable && onTabClose && (
              <button
                className="tab-close"
                onClick={(e) => handleTabClose(tab.id, e)}
                aria-label={`Close ${tab.title}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};