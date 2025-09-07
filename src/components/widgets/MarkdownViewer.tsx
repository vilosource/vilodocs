import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkEmoji from 'remark-emoji';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { useScrollableKeyboardNavigation } from '../../hooks/useScrollableKeyboardNavigation';
import { useZoom, formatZoomLevel } from '../../hooks/useZoom';
import 'github-markdown-css/github-markdown.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';

interface MarkdownViewerProps {
  content?: string;
  filePath?: string;
  isActive?: boolean;
  onSwitchToEdit?: () => void;
  onContentChange?: (content: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content = '',
  filePath,
  isActive = false,
  onSwitchToEdit,
  onContentChange,
  onDirtyChange,
}) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add keyboard navigation to the scrollable content
  useScrollableKeyboardNavigation(contentWrapperRef, {
    isActive,
    arrowKeyStep: 40,
    pageStep: 0.9,
    enableVimNavigation: true, // Enable j/k navigation for markdown
  });
  
  // Add zoom functionality
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = useZoom(contentRef, {
    isActive,
    initialZoom: 100,
    minZoom: 50,
    maxZoom: 200,
    zoomStep: 10,
  });

  // Extract table of contents from markdown
  useEffect(() => {
    const headings: TocItem[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = `heading-${index}`;
        headings.push({ id, text, level });
      }
    });
    
    setToc(headings);
  }, [content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E to switch to edit mode
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        onSwitchToEdit?.();
      }
      // Ctrl+Shift+O to toggle table of contents
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setShowToc(prev => !prev);
      }
      // Ctrl+F to focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        // TODO: Implement search functionality
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToEdit]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only switch to edit if double-clicking on the content area, not on buttons or other controls
    const target = e.target as HTMLElement;
    if (target.closest('.markdown-header') || target.closest('.markdown-toc')) {
      return;
    }
    onSwitchToEdit?.();
  }, [onSwitchToEdit]);

  const scrollToHeading = useCallback((headingId: string) => {
    const element = document.getElementById(headingId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCodeCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // TODO: Show toast notification for successful copy
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, []);

  // Handle checkbox changes in task lists
  const handleCheckboxChange = useCallback((lineIndex: number, checked: boolean) => {
    if (!onContentChange) return;
    
    const lines = content.split('\n');
    const line = lines[lineIndex];
    
    // Toggle checkbox state in markdown
    const newLine = checked 
      ? line.replace(/^(\s*[-*+]\s+)\[ \]/, '$1[x]')
      : line.replace(/^(\s*[-*+]\s+)\[x\]/, '$1[ ]');
    
    lines[lineIndex] = newLine;
    const newContent = lines.join('\n');
    
    onContentChange(newContent);
    onDirtyChange?.(true);
  }, [content, onContentChange, onDirtyChange]);

  // Custom components for markdown elements
  const components = {
    h1: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h3 id={id} {...props}>{children}</h3>;
    },
    h4: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h4 id={id} {...props}>{children}</h4>;
    },
    h5: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h5 id={id} {...props}>{children}</h5>;
    },
    h6: ({ children, ...props }: any) => {
      const index = props.sourcePosition?.start?.line;
      const id = `heading-${index}`;
      return <h6 id={id} {...props}>{children}</h6>;
    },
    code: ({ inline, className, children, ...props }: any) => {
      const codeString = String(children).replace(/\n$/, '');
      
      if (!inline) {
        const language = className?.replace('language-', '') || '';
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              {language && <span className="code-language">{language}</span>}
              <button 
                className="copy-button"
                onClick={() => handleCodeCopy(codeString)}
                title="Copy code"
              >
                📋 Copy
              </button>
            </div>
            <pre className={className}>
              <code {...props}>{children}</code>
            </pre>
          </div>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        const lineIndex = props.sourcePosition?.start?.line - 1;
        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleCheckboxChange(lineIndex, e.target.checked)}
            className="task-checkbox"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
    a: ({ href, children, ...props }: any) => {
      // Handle internal links
      if (href?.startsWith('#')) {
        return (
          <a 
            href={href}
            onClick={(e) => {
              e.preventDefault();
              const id = href.substring(1);
              const element = document.getElementById(id);
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      // External links open in new tab
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  // Calculate reading stats
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

  return (
    <div className="markdown-viewer">
      {/* Header */}
      <div className="markdown-header">
        <div className="markdown-actions">
          <button
            className="action-button"
            onClick={() => setShowToc(!showToc)}
            title="Toggle table of contents (Ctrl+Shift+O)"
          >
            {showToc ? '📑' : '📄'} TOC
          </button>
          <button
            className="action-button"
            onClick={onSwitchToEdit}
            title="Edit markdown (Ctrl+E)"
          >
            ✏️ Edit
          </button>
        </div>
        <div className="markdown-info">
          <span className="file-name">{filePath?.split('/').pop() || 'Untitled.md'}</span>
          <span className="separator">•</span>
          <span className="word-count">{wordCount} words</span>
          <span className="separator">•</span>
          <span className="reading-time">{readingTime} min read</span>
          <span className="separator">•</span>
          <span className="zoom-level" title="Ctrl+Scroll to zoom">{formatZoomLevel(zoomLevel)}</span>
        </div>
      </div>

      <div className="markdown-body-wrapper">
        {/* Table of Contents */}
        {showToc && toc.length > 0 && (
          <div className="markdown-toc">
            <div className="toc-header">
              <h3>Table of Contents</h3>
            </div>
            <ul className="toc-list">
              {toc.map((heading) => (
                <li
                  key={heading.id}
                  className={`toc-item toc-level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  <span className="toc-text">{heading.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Markdown Content */}
        <div 
          ref={contentWrapperRef}
          className="markdown-content-wrapper"
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
          aria-label="Markdown content viewer"
        >
          <div ref={contentRef} className="markdown-content-zoom-container">
            <div className="markdown-content github-markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
              rehypePlugins={[rehypeHighlight, rehypeKatex]}
              components={components}
            >
              {content}
            </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownViewer;