import React, { useEffect, useCallback, useRef } from 'react';
import { Tab } from '../../layout/types';
import { WidgetRenderer } from './WidgetRenderer';
import './FocusOverlay.css';

interface FocusOverlayProps {
  tab: Tab;
  visible: boolean;
  onClose: () => void;
  onContentChange?: (tabId: string, content: string) => void;
  onDirtyChange?: (tabId: string, isDirty: boolean) => void;
  onSwitchWidget?: (tabId: string, newWidgetType: string) => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  tab,
  visible,
  onClose,
  onContentChange,
  onDirtyChange,
  onSwitchWidget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts and focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+M to toggle focus mode
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        onClose();
      }
      // Escape to exit focus mode
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when overlay is open
      document.body.style.overflow = 'hidden';
      
      // Focus the container when it becomes visible
      // Use a small delay to ensure the DOM is ready
      const focusTimeout = setTimeout(() => {
        // Try to focus any textarea or contenteditable element inside the content
        const focusableElement = contentRef.current?.querySelector('textarea, [contenteditable="true"], input[type="text"]');
        if (focusableElement instanceof HTMLElement) {
          focusableElement.focus();
        } else if (containerRef.current) {
          // Fall back to focusing the container itself
          containerRef.current.focus();
        }
      }, 100);
      
      return () => {
        clearTimeout(focusTimeout);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [visible, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Close if clicking the backdrop (not the content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="focus-overlay-backdrop" 
      onClick={handleBackdropClick}
      tabIndex={-1}
    >
      <div className="focus-overlay-container">
        <div className="focus-overlay-header">
          <div className="focus-overlay-title">
            <span className="focus-mode-label">Focus Mode</span>
            <span className="focus-file-name">{tab.title}</span>
          </div>
          <button 
            className="focus-overlay-close"
            onClick={onClose}
            title="Exit Focus Mode (Alt+M or Esc)"
          >
            ✕
          </button>
        </div>
        
        <div ref={contentRef} className="focus-overlay-content">
          <WidgetRenderer
            tab={tab}
            onContentChange={onContentChange}
            onDirtyChange={onDirtyChange}
            onSwitchWidget={onSwitchWidget}
          />
        </div>
        
        <div className="focus-overlay-footer">
          <div className="focus-mode-shortcuts">
            <span className="shortcut-item">
              <kbd>Alt+M</kbd> or <kbd>Esc</kbd> to exit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};