import React, { useState, useEffect, useCallback } from 'react';
import './PaneNavigator.css';

interface PaneNavigatorProps {
  isActive: boolean;
  onDeactivate: () => void;
  onPaneSelect: (leafId: string) => void;
}

export const PaneNavigator: React.FC<PaneNavigatorProps> = ({
  isActive,
  onDeactivate,
  onPaneSelect
}) => {
  const [paneElements, setPaneElements] = useState<Array<{ id: string; element: HTMLElement; index: number }>>([]);

  // Find all pane elements when navigation is activated
  useEffect(() => {
    if (!isActive) {
      setPaneElements([]);
      return;
    }

    // Find all editor-leaf elements
    const leafElements = document.querySelectorAll('.editor-leaf[data-leaf-id]');
    const panes: Array<{ id: string; element: HTMLElement; index: number }> = [];

    leafElements.forEach((element, index) => {
      const leafId = element.getAttribute('data-leaf-id');
      if (leafId && element instanceof HTMLElement) {
        panes.push({
          id: leafId,
          element,
          index: index + 1 // 1-indexed for user convenience
        });
      }
    });

    setPaneElements(panes);
  }, [isActive]);

  // Handle keyboard events
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape to cancel navigation
      if (e.key === 'Escape') {
        e.preventDefault();
        onDeactivate();
        return;
      }

      // Handle number keys 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        const pane = paneElements.find(p => p.index === num);
        if (pane) {
          onPaneSelect(pane.id);
          onDeactivate();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, paneElements, onDeactivate, onPaneSelect]);

  if (!isActive) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="pane-navigator-backdrop" onClick={onDeactivate} />
      
      {/* Number overlays for each pane */}
      {paneElements.map(pane => {
        const rect = pane.element.getBoundingClientRect();
        
        return (
          <div
            key={pane.id}
            className="pane-navigator-overlay"
            style={{
              position: 'fixed',
              left: `${rect.left + rect.width / 2 - 20}px`,
              top: `${rect.top + rect.height / 2 - 20}px`,
              zIndex: 10001
            }}
            onClick={() => {
              onPaneSelect(pane.id);
              onDeactivate();
            }}
          >
            <div className="pane-navigator-number">
              {pane.index}
            </div>
          </div>
        );
      })}
      
      {/* Instructions */}
      <div className="pane-navigator-instructions">
        Press 1-9 to focus a pane • ESC to cancel
      </div>
    </>
  );
};