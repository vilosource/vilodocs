import React, { useCallback } from 'react';
import { Tab } from '../../layout/types';
import { TextEditor } from './TextEditor';
import { WelcomeWidget } from './WelcomeWidget';
import { MarkdownViewer } from './MarkdownViewer';
import WidgetRegistryService from '../../services/WidgetRegistry';

interface WidgetRendererProps {
  tab: Tab;
  isActive?: boolean;
  onContentChange?: (tabId: string, content: string) => void;
  onDirtyChange?: (tabId: string, isDirty: boolean) => void;
  onSwitchWidget?: (tabId: string, newWidgetType: string) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  tab,
  isActive = false,
  onContentChange,
  onDirtyChange,
  onSwitchWidget,
}) => {
  const registry = WidgetRegistryService.getInstance();

  const handleContentChange = (content: string) => {
    onContentChange?.(tab.id, content);
  };

  const handleDirtyChange = (isDirty: boolean) => {
    onDirtyChange?.(tab.id, isDirty);
  };

  const handleSwitchToEdit = useCallback(() => {
    onSwitchWidget?.(tab.id, 'text-editor');
  }, [tab.id, onSwitchWidget]);

  const handleSwitchToViewer = useCallback(() => {
    onSwitchWidget?.(tab.id, 'markdown-viewer');
  }, [tab.id, onSwitchWidget]);

  // Handle tabs without widget property (legacy tabs)
  if (!tab.widget) {
    console.warn('Tab missing widget property:', tab);
    return (
      <div className="widget-error">
        <h3>Invalid Tab Configuration</h3>
        <p>This tab is missing widget configuration. Tab: {tab.title}</p>
      </div>
    );
  }

  switch (tab.widget.type) {
    case 'text-editor':
      return (
        <TextEditor
          content={tab.widget.props?.content as string}
          fileName={tab.title}
          filePath={tab.filePath}
          isActive={isActive}
          onContentChange={handleContentChange}
          onDirtyChange={handleDirtyChange}
          onSwitchToViewer={tab.filePath?.endsWith('.md') ? handleSwitchToViewer : undefined}
        />
      );
    
    case 'markdown-viewer':
      return (
        <MarkdownViewer
          content={tab.widget.props?.content as string}
          filePath={tab.filePath}
          isActive={isActive}
          onSwitchToEdit={handleSwitchToEdit}
          onContentChange={handleContentChange}
          onDirtyChange={handleDirtyChange}
        />
      );
    
    case 'welcome':
      return <WelcomeWidget />;
    
    default:
      // Try to render with registered widget from registry
      const provider = registry.getWidgetProvider(tab.widget.type);
      if (provider) {
        // Use lazy component from registry
        const LazyComponent = provider.component;
        return (
          <React.Suspense fallback={<div className="widget-loading">Loading...</div>}>
            <LazyComponent
              content={tab.widget.props?.content}
              filePath={tab.filePath}
              onContentChange={handleContentChange}
              onDirtyChange={handleDirtyChange}
              onSwitchToEdit={handleSwitchToEdit}
              onSwitchToViewer={handleSwitchToViewer}
            />
          </React.Suspense>
        );
      }

      return (
        <div className="widget-error">
          <h3>Unknown widget type: {tab.widget.type}</h3>
          <p>This widget type is not supported.</p>
        </div>
      );
  }
};