import React, { createContext, useContext, useState, useCallback } from 'react';
import { StatusBarItem } from '../components/layout/StatusBar';

export interface WidgetStatusInfo {
  type: 'text-editor' | 'markdown-viewer' | 'welcome' | 'unknown';
  fileName?: string;
  filePath?: string;
  isDirty?: boolean;
  wordCount?: number;
  readingTime?: number;
  cursorPosition?: { line: number; column: number };
  language?: string;
  encoding?: string;
  eol?: string;
  zoomLevel?: number;
  onToggleToc?: () => void;
  onSwitchToEdit?: () => void;
  onSwitchToViewer?: () => void;
}

interface StatusBarContextType {
  widgetStatus: WidgetStatusInfo | null;
  updateWidgetStatus: (status: WidgetStatusInfo | null) => void;
  getStatusBarItems: () => StatusBarItem[];
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined);

export const StatusBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatusInfo | null>(null);

  const updateWidgetStatus = useCallback((status: WidgetStatusInfo | null) => {
    setWidgetStatus(status);
  }, []);

  const getStatusBarItems = useCallback((): StatusBarItem[] => {
    const items: StatusBarItem[] = [];

    if (!widgetStatus) {
      // Default items when no widget is active
      items.push({ id: 'status', content: 'Ready', position: 'left', priority: 0 });
      items.push({ id: 'encoding', content: 'UTF-8', position: 'right', priority: 10 });
      items.push({ id: 'eol', content: 'LF', position: 'right', priority: 11 });
      return items;
    }

    // Left side items
    if (widgetStatus.fileName) {
      const fileContent = (
        <span className="status-file">
          {widgetStatus.fileName}
          {widgetStatus.isDirty && <span className="dirty-indicator"> ●</span>}
        </span>
      );
      items.push({ id: 'file', content: fileContent, position: 'left', priority: 0 });
    }

    if (widgetStatus.type === 'text-editor' && widgetStatus.cursorPosition) {
      items.push({
        id: 'cursor',
        content: `Ln ${widgetStatus.cursorPosition.line}, Col ${widgetStatus.cursorPosition.column}`,
        position: 'left',
        priority: 1
      });
    }

    if (widgetStatus.type === 'markdown-viewer') {
      if (widgetStatus.wordCount !== undefined) {
        items.push({
          id: 'word-count',
          content: `${widgetStatus.wordCount} words`,
          position: 'left',
          priority: 1
        });
      }
      if (widgetStatus.readingTime !== undefined) {
        items.push({
          id: 'reading-time',
          content: `${widgetStatus.readingTime} min read`,
          position: 'left',
          priority: 2
        });
      }
    }

    // Right side items
    if (widgetStatus.type === 'markdown-viewer') {
      // Action buttons for markdown
      if (widgetStatus.onToggleToc) {
        items.push({
          id: 'toggle-toc',
          content: '📑 TOC',
          position: 'right',
          priority: 0,
          onClick: widgetStatus.onToggleToc
        });
      }
      if (widgetStatus.onSwitchToEdit) {
        items.push({
          id: 'switch-edit',
          content: '✏️ Edit',
          position: 'right',
          priority: 1,
          onClick: widgetStatus.onSwitchToEdit
        });
      }
    }

    if (widgetStatus.type === 'text-editor' && widgetStatus.filePath?.endsWith('.md')) {
      // Preview button for markdown files in editor
      if (widgetStatus.onSwitchToViewer) {
        items.push({
          id: 'switch-preview',
          content: '👁️ Preview',
          position: 'right',
          priority: 0,
          onClick: widgetStatus.onSwitchToViewer
        });
      }
    }

    // Common right side items
    items.push({
      id: 'encoding',
      content: widgetStatus.encoding || 'UTF-8',
      position: 'right',
      priority: 10
    });

    items.push({
      id: 'eol',
      content: widgetStatus.eol || 'LF',
      position: 'right',
      priority: 11
    });

    if (widgetStatus.language) {
      items.push({
        id: 'language',
        content: widgetStatus.language,
        position: 'right',
        priority: 12
      });
    }

    if (widgetStatus.zoomLevel && widgetStatus.zoomLevel !== 100) {
      items.push({
        id: 'zoom',
        content: `${widgetStatus.zoomLevel}%`,
        position: 'right',
        priority: 13
      });
    }

    return items;
  }, [widgetStatus]);

  return (
    <StatusBarContext.Provider value={{ widgetStatus, updateWidgetStatus, getStatusBarItems }}>
      {children}
    </StatusBarContext.Provider>
  );
};

export const useStatusBar = () => {
  const context = useContext(StatusBarContext);
  if (!context) {
    // Return a no-op implementation when context is not available
    // This prevents errors when widgets are rendered outside the provider
    return {
      widgetStatus: null,
      updateWidgetStatus: () => {},
      getStatusBarItems: () => []
    };
  }
  return context;
};