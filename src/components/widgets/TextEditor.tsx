import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useZoom, formatZoomLevel } from '../../hooks/useZoom';
import { useStatusBar } from '../../contexts/StatusBarContext';
import './TextEditor.css';

interface TextEditorProps {
  content?: string;
  fileName?: string;
  filePath?: string;
  isActive?: boolean;
  onContentChange?: (content: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSwitchToViewer?: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  content = '',
  fileName,
  filePath,
  isActive = false,
  onContentChange,
  onDirtyChange,
  onSwitchToViewer,
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isDirty, setIsDirty] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { updateWidgetStatus } = useStatusBar();
  
  // Add zoom functionality
  const { zoomLevel } = useZoom(editorRef, {
    isActive,
    initialZoom: 100,
    minZoom: 50,
    maxZoom: 200,
    zoomStep: 10,
  });

  useEffect(() => {
    setEditorContent(content);
    setIsDirty(false);
  }, [content, filePath]); // Reset when content or file changes
  
  // Focus textarea when widget becomes active
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
      updateCursorPosition();
    }
  }, [isActive, updateCursorPosition]);

  // Update status bar when widget state changes
  useEffect(() => {
    if (isActive) {
      updateWidgetStatus({
        type: 'text-editor',
        fileName,
        filePath,
        isDirty,
        cursorPosition,
        language: fileName ? getLanguageFromFileName(fileName) : 'Plain Text',
        encoding: 'UTF-8',
        eol: 'LF',
        zoomLevel,
        onSwitchToViewer: filePath?.endsWith('.md') ? onSwitchToViewer : undefined
      });
    } else {
      // Clear status when widget becomes inactive
      updateWidgetStatus(null);
    }
  }, [isActive, fileName, filePath, isDirty, cursorPosition, zoomLevel, onSwitchToViewer, updateWidgetStatus]);

  const updateCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const text = textarea.value;
      const selectionStart = textarea.selectionStart;
      const textBeforeCursor = text.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      setCursorPosition({ line, column });
    }
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setEditorContent(newContent);
    const newIsDirty = newContent !== content;
    
    if (newIsDirty !== isDirty) {
      setIsDirty(newIsDirty);
      onDirtyChange?.(newIsDirty);
    }
    
    onContentChange?.(newContent);
    updateCursorPosition();
  }, [content, isDirty, onContentChange, onDirtyChange, updateCursorPosition]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+V to switch to markdown viewer (only for markdown files)
      if (e.ctrlKey && e.shiftKey && e.key === 'V' && filePath?.endsWith('.md')) {
        e.preventDefault();
        onSwitchToViewer?.();
      }
      // Ctrl+K V (VS Code style) - chord sequence for markdown preview
      // TODO: Implement chord sequence handling in the future
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToViewer, filePath]);

  const getLanguageFromFileName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'text';
    }
  };

  return (
    <div className="text-editor">
      <div ref={editorRef} className="editor-main">
        <div className="line-numbers">
          {editorContent.split('\n').map((_, index) => (
            <div key={index + 1} className="line-number">
              {index + 1}
            </div>
          ))}
        </div>
        
        <textarea
          ref={textareaRef}
          className={`editor-textarea language-${fileName ? getLanguageFromFileName(fileName) : 'text'}`}
          value={editorContent}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          placeholder={fileName ? `Start editing ${fileName}...` : 'Start typing...'}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
};