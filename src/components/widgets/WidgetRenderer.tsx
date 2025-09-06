import React from 'react';
import { Tab } from '../../layout/types';
import { TextEditor } from './TextEditor';
import { WelcomeWidget } from './WelcomeWidget';

interface WidgetRendererProps {
  tab: Tab;
  onContentChange?: (tabId: string, content: string) => void;
  onDirtyChange?: (tabId: string, isDirty: boolean) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  tab,
  onContentChange,
  onDirtyChange,
}) => {
  const handleContentChange = (content: string) => {
    onContentChange?.(tab.id, content);
  };

  const handleDirtyChange = (isDirty: boolean) => {
    onDirtyChange?.(tab.id, isDirty);
  };

  switch (tab.widget.type) {
    case 'text-editor':
      return (
        <TextEditor
          content={tab.widget.props?.content as string}
          fileName={tab.title}
          filePath={tab.filePath}
          onContentChange={handleContentChange}
          onDirtyChange={handleDirtyChange}
        />
      );
    
    case 'welcome':
      return <WelcomeWidget />;
    
    default:
      return (
        <div className="widget-error">
          <h3>Unknown widget type: {tab.widget.type}</h3>
          <p>This widget type is not supported.</p>
        </div>
      );
  }
};