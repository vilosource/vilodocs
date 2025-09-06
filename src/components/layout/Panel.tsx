import React, { useRef, useEffect } from 'react';
import './Panel.css';

interface PanelTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface PanelProps {
  visible: boolean;
  position: 'bottom' | 'right';
  height: number;
  minHeight?: number;
  tabs: PanelTab[];
  activeTabId?: string;
  onResize?: (newHeight: number) => void;
  onTabChange?: (tabId: string) => void;
  onClose?: () => void;
}

export const Panel: React.FC<PanelProps> = ({
  visible,
  position,
  height,
  minHeight = 150,
  tabs,
  activeTabId,
  onResize,
  onTabChange,
  onClose
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !onResize) return;

      const panelElement = panelRef.current;
      if (!panelElement) return;

      const rect = panelElement.getBoundingClientRect();
      let newHeight: number;

      if (position === 'bottom') {
        newHeight = rect.bottom - e.clientY;
      } else {
        newHeight = rect.bottom - e.clientY;
      }

      newHeight = Math.max(minHeight, newHeight);
      onResize(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, minHeight, onResize]);

  const handleGutterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = position === 'bottom' ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  if (!visible) return null;

  const panelStyle = position === 'bottom' 
    ? { height: `${height}px` }
    : { width: `${height}px` }; // height is used for width when positioned right

  return (
    <div
      ref={panelRef}
      className={`panel panel-${position}`}
      style={panelStyle}
      role="complementary"
      aria-label="Panel"
    >
      <div
        className={`panel-gutter panel-gutter-${position}`}
        onMouseDown={handleGutterMouseDown}
        role="separator"
        aria-orientation={position === 'bottom' ? 'horizontal' : 'vertical'}
        aria-label="Resize panel"
        tabIndex={0}
      />
      <div className="panel-header">
        <div className="panel-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`panel-tab ${tab.id === activeTab?.id ? 'active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
              role="tab"
              aria-selected={tab.id === activeTab?.id}
              aria-controls={`panel-content-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="panel-actions">
          {onClose && (
            <button
              className="panel-close"
              onClick={onClose}
              aria-label="Close panel"
              title="Close panel"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div 
        className="panel-content"
        id={`panel-content-${activeTab?.id}`}
        role="tabpanel"
        aria-labelledby={activeTab?.id}
      >
        {activeTab?.content}
      </div>
    </div>
  );
};