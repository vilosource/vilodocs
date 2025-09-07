import React, { useState, useEffect, useCallback } from 'react';
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditorContent(content);
    setIsDirty(false);
  }, [content, filePath]); // Reset when content or file changes
  
  // Focus textarea when widget becomes active
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  const handleContentChange = useCallback((newContent: string) => {
    setEditorContent(newContent);
    const newIsDirty = newContent !== content;
    
    if (newIsDirty !== isDirty) {
      setIsDirty(newIsDirty);
      onDirtyChange?.(newIsDirty);
    }
    
    onContentChange?.(newContent);
  }, [content, isDirty, onContentChange, onDirtyChange]);

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
      <div className="editor-header">
        {fileName && (
          <div className="file-info">
            <span className="file-name">{fileName}</span>
            {isDirty && <span className="dirty-indicator">●</span>}
          </div>
        )}
        {filePath && (
          <div className="file-path" title={filePath}>
            {filePath}
          </div>
        )}
      </div>
      
      <div className="editor-main">
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
          placeholder={fileName ? `Start editing ${fileName}...` : 'Start typing...'}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
      
      <div className="editor-footer">
        <div className="editor-stats">
          <span>Lines: {editorContent.split('\n').length}</span>
          <span>Characters: {editorContent.length}</span>
          {fileName && (
            <span>Language: {getLanguageFromFileName(fileName)}</span>
          )}
        </div>
      </div>
    </div>
  );
};