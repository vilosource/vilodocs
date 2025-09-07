# Markdown Viewer Implementation Guide

## Overview

This document provides the complete implementation plan for the Markdown Viewer widget, which will be the first specialized widget to demonstrate the Widget Registry architecture.

## Implementation Steps

### Step 1: Install Required Dependencies

```bash
npm install --save \
  react-markdown \
  remark-gfm \
  remark-math \
  rehype-highlight \
  rehype-katex \
  remark-emoji \
  github-markdown-css \
  katex

npm install --save-dev \
  @types/katex
```

### Step 2: Create Widget Registry Service

```typescript
// src/services/WidgetRegistry.ts
import { lazy } from 'react';

export interface WidgetProvider {
  type: string;
  name: string;
  description: string;
  filePatterns: string[];
  priority: number;
  component: React.LazyExoticComponent<any>;
  canHandle: (filePath: string, content?: string) => boolean;
  getDefaultProps?: (filePath: string, content: string) => any;
}

export interface FileAssociation {
  pattern: string;
  widgetType: string;
  priority: number;
}

class WidgetRegistryService {
  private static instance: WidgetRegistryService;
  private widgets: Map<string, WidgetProvider> = new Map();
  private fileAssociations: FileAssociation[] = [];
  private userPreferences: Map<string, string> = new Map();

  static getInstance(): WidgetRegistryService {
    if (!this.instance) {
      this.instance = new WidgetRegistryService();
      this.instance.initialize();
    }
    return this.instance;
  }

  private initialize(): void {
    this.registerDefaultWidgets();
    this.loadDefaultAssociations();
    this.loadUserPreferences();
  }

  private registerDefaultWidgets(): void {
    // Text Editor (existing)
    this.registerWidget({
      type: 'text-editor',
      name: 'Text Editor',
      description: 'Plain text and code editor',
      filePatterns: ['*'],
      priority: 10,
      component: lazy(() => import('../components/widgets/TextEditor')),
      canHandle: () => true,
    });

    // Markdown Viewer (new)
    this.registerWidget({
      type: 'markdown-viewer',
      name: 'Markdown Viewer',
      description: 'Rendered markdown preview',
      filePatterns: ['*.md', '*.markdown'],
      priority: 100,
      component: lazy(() => import('../components/widgets/MarkdownViewer')),
      canHandle: (path) => /\.(md|markdown|mdown|mkd)$/i.test(path),
    });

    // Welcome (existing)
    this.registerWidget({
      type: 'welcome',
      name: 'Welcome',
      description: 'Welcome screen',
      filePatterns: [],
      priority: 0,
      component: lazy(() => import('../components/widgets/WelcomeWidget')),
      canHandle: () => false,
    });
  }

  private loadDefaultAssociations(): void {
    this.fileAssociations = [
      // Markdown files open in viewer by default
      { pattern: '*.md', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.markdown', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.mdown', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.mkd', widgetType: 'markdown-viewer', priority: 100 },
      
      // Code files open in text editor
      { pattern: '*.js', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.ts', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.jsx', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.tsx', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.json', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.css', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.html', widgetType: 'text-editor', priority: 50 },
      
      // Default fallback
      { pattern: '*', widgetType: 'text-editor', priority: 0 },
    ];
  }

  registerWidget(provider: WidgetProvider): void {
    this.widgets.set(provider.type, provider);
  }

  getWidgetForFile(filePath: string): string {
    // Check user preferences first
    const userPref = this.userPreferences.get(filePath);
    if (userPref) return userPref;

    // Find best matching widget by priority
    const matches = this.fileAssociations
      .filter(assoc => this.matchesPattern(filePath, assoc.pattern))
      .sort((a, b) => b.priority - a.priority);

    return matches[0]?.widgetType || 'text-editor';
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regex}$`).test(filePath.split('/').pop() || '');
  }

  getWidgetProvider(type: string): WidgetProvider | undefined {
    return this.widgets.get(type);
  }

  switchWidget(currentType: string, filePath: string): string {
    // Get available widgets for this file
    const available = this.getAvailableWidgets(filePath);
    const currentIndex = available.findIndex(w => w.type === currentType);
    const nextIndex = (currentIndex + 1) % available.length;
    return available[nextIndex].type;
  }

  getAvailableWidgets(filePath: string): WidgetProvider[] {
    return Array.from(this.widgets.values())
      .filter(widget => widget.canHandle(filePath));
  }

  private loadUserPreferences(): void {
    // Load from electron-store
    // TODO: Implement persistence
  }

  setUserPreference(filePath: string, widgetType: string): void {
    this.userPreferences.set(filePath, widgetType);
    // TODO: Persist to electron-store
  }
}

export default WidgetRegistryService;
```

### Step 3: Create MarkdownViewer Component

```typescript
// src/components/widgets/MarkdownViewer.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkEmoji from 'remark-emoji';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'github-markdown-css/github-markdown.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';

interface MarkdownViewerProps {
  content: string;
  filePath?: string;
  onSwitchToEdit?: () => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  filePath,
  onSwitchToEdit,
}) => {
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [showToc, setShowToc] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract table of contents from markdown
  useEffect(() => {
    const headings: typeof toc = [];
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
      // Ctrl+E or Double click to edit
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        onSwitchToEdit?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToEdit]);

  const handleDoubleClick = useCallback(() => {
    onSwitchToEdit?.();
  }, [onSwitchToEdit]);

  const scrollToHeading = useCallback((headingId: string) => {
    const element = document.getElementById(headingId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCodeCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Show toast notification
  }, []);

  // Custom components for markdown elements
  const components = {
    h1: ({ children, ...props }: any) => {
      const id = `heading-${props.sourcePosition?.start.line}`;
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: any) => {
      const id = `heading-${props.sourcePosition?.start.line}`;
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: any) => {
      const id = `heading-${props.sourcePosition?.start.line}`;
      return <h3 id={id} {...props}>{children}</h3>;
    },
    code: ({ inline, className, children, ...props }: any) => {
      if (!inline) {
        return (
          <div className="code-block-wrapper">
            <button 
              className="copy-button"
              onClick={() => handleCodeCopy(String(children))}
              title="Copy code"
            >
              📋
            </button>
            <code className={className} {...props}>
              {children}
            </code>
          </div>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              // TODO: Handle checkbox toggle
            }}
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };

  return (
    <div className="markdown-viewer">
      {/* Header */}
      <div className="markdown-header">
        <div className="markdown-actions">
          <button
            className="action-button"
            onClick={() => setShowToc(!showToc)}
            title="Toggle table of contents"
          >
            📑
          </button>
          <button
            className="action-button"
            onClick={onSwitchToEdit}
            title="Edit markdown (Ctrl+E)"
          >
            ✏️
          </button>
        </div>
        <div className="markdown-info">
          <span className="file-name">{filePath?.split('/').pop() || 'Untitled'}</span>
          <span className="word-count">
            {content.split(/\s+/).length} words
          </span>
        </div>
      </div>

      <div className="markdown-body-wrapper">
        {/* Table of Contents */}
        {showToc && toc.length > 0 && (
          <div className="markdown-toc">
            <h3>Table of Contents</h3>
            <ul>
              {toc.map((heading) => (
                <li
                  key={heading.id}
                  className={`toc-item toc-level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Markdown Content */}
        <div 
          ref={contentRef}
          className="markdown-content github-markdown-body"
          onDoubleClick={handleDoubleClick}
        >
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
  );
};

export default MarkdownViewer;
```

### Step 4: Create MarkdownViewer Styles

```css
/* src/components/widgets/MarkdownViewer.css */
.markdown-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

.markdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--theme-spacing-sm) var(--theme-spacing-md);
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
}

.markdown-actions {
  display: flex;
  gap: var(--theme-spacing-sm);
}

.action-button {
  padding: var(--theme-spacing-xs) var(--theme-spacing-sm);
  background: transparent;
  border: 1px solid var(--vscode-button-border, transparent);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  border-radius: var(--theme-radius-sm);
  transition: all var(--theme-transition-fast);
}

.action-button:hover {
  background: var(--vscode-button-hoverBackground);
}

.markdown-info {
  display: flex;
  align-items: center;
  gap: var(--theme-spacing-md);
  font-size: var(--theme-font-size-sm);
  color: var(--vscode-descriptionForeground);
}

.markdown-body-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.markdown-toc {
  width: 250px;
  padding: var(--theme-spacing-md);
  border-right: 1px solid var(--vscode-panel-border);
  overflow-y: auto;
  background: var(--vscode-sideBar-background);
}

.markdown-toc h3 {
  margin-bottom: var(--theme-spacing-md);
  font-size: var(--theme-font-size-sm);
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
}

.markdown-toc ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  padding: var(--theme-spacing-xs) 0;
  cursor: pointer;
  transition: color var(--theme-transition-fast);
}

.toc-item:hover {
  color: var(--vscode-list-hoverForeground);
}

.toc-level-1 { padding-left: 0; font-weight: bold; }
.toc-level-2 { padding-left: var(--theme-spacing-md); }
.toc-level-3 { padding-left: calc(var(--theme-spacing-md) * 2); }
.toc-level-4 { padding-left: calc(var(--theme-spacing-md) * 3); }
.toc-level-5 { padding-left: calc(var(--theme-spacing-md) * 4); }
.toc-level-6 { padding-left: calc(var(--theme-spacing-md) * 5); }

.markdown-content {
  flex: 1;
  padding: var(--theme-spacing-xl);
  overflow-y: auto;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* GitHub Markdown Overrides for Dark Theme */
.markdown-content.github-markdown-body {
  background: transparent;
  color: var(--vscode-editor-foreground);
}

.markdown-content.github-markdown-body h1,
.markdown-content.github-markdown-body h2,
.markdown-content.github-markdown-body h3,
.markdown-content.github-markdown-body h4,
.markdown-content.github-markdown-body h5,
.markdown-content.github-markdown-body h6 {
  border-bottom-color: var(--vscode-panel-border);
  color: var(--vscode-editor-foreground);
}

.markdown-content.github-markdown-body code {
  background: var(--vscode-textCodeBlock-background, rgba(255, 255, 255, 0.05));
  color: var(--vscode-editor-foreground);
}

.markdown-content.github-markdown-body pre {
  background: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.3));
  border: 1px solid var(--vscode-panel-border);
}

.markdown-content.github-markdown-body blockquote {
  border-left-color: var(--vscode-textBlockQuote-border, var(--theme-color-accent));
  color: var(--vscode-textBlockQuote-foreground, var(--vscode-descriptionForeground));
}

.markdown-content.github-markdown-body table {
  border-collapse: collapse;
}

.markdown-content.github-markdown-body table tr {
  background: var(--vscode-editor-background);
  border-top-color: var(--vscode-panel-border);
}

.markdown-content.github-markdown-body table tr:nth-child(2n) {
  background: var(--vscode-list-hoverBackground);
}

.markdown-content.github-markdown-body table th,
.markdown-content.github-markdown-body table td {
  border-color: var(--vscode-panel-border);
  padding: var(--theme-spacing-sm) var(--theme-spacing-md);
}

.markdown-content.github-markdown-body a {
  color: var(--vscode-textLink-foreground, var(--theme-color-accent));
}

.markdown-content.github-markdown-body a:hover {
  color: var(--vscode-textLink-activeForeground, var(--theme-color-accent));
}

/* Code block with copy button */
.code-block-wrapper {
  position: relative;
  margin: var(--theme-spacing-md) 0;
}

.copy-button {
  position: absolute;
  top: var(--theme-spacing-sm);
  right: var(--theme-spacing-sm);
  padding: var(--theme-spacing-xs);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: var(--theme-radius-sm);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--theme-transition-fast);
}

.code-block-wrapper:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background: var(--vscode-button-hoverBackground);
}

/* Checkbox styling */
.markdown-content input[type="checkbox"] {
  margin-right: var(--theme-spacing-xs);
  cursor: pointer;
}

/* Scrollbar styling */
.markdown-content::-webkit-scrollbar,
.markdown-toc::-webkit-scrollbar {
  width: 10px;
}

.markdown-content::-webkit-scrollbar-thumb,
.markdown-toc::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background);
  border-radius: 5px;
}

.markdown-content::-webkit-scrollbar-thumb:hover,
.markdown-toc::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground);
}
```

### Step 5: Update App.tsx to Use Widget Registry

```typescript
// In src/renderer/App.tsx
import WidgetRegistryService from '../services/WidgetRegistry';

const handleFileOpen = useCallback((filePath: string, content: string) => {
  const fileName = filePath.split('/').pop() || 'Untitled';
  const leafId = state.activeLeafId || state.root.id;
  
  // Use Widget Registry to determine widget type
  const registry = WidgetRegistryService.getInstance();
  const widgetType = registry.getWidgetForFile(filePath);
  
  // Check if file is already open
  const existingTab = Array.from(state.leafMap.values())
    .flatMap(leaf => leaf.tabs)
    .find(tab => tab.filePath === filePath);
  
  if (existingTab) {
    // Switch to existing tab
    // ... existing code ...
  } else {
    // Create new tab with appropriate widget
    dispatch({
      type: 'ADD_TAB',
      payload: {
        leafId,
        tab: {
          id: generateFileTabId(filePath),
          title: fileName,
          icon: getFileIcon(fileName),
          closeable: true,
          dirty: false,
          filePath,
          widget: {
            type: widgetType,
            props: { content, filePath }
          }
        }
      }
    });
  }
}, [state, dispatch]);
```

### Step 6: Update WidgetRenderer

```typescript
// In src/components/widgets/WidgetRenderer.tsx
import { MarkdownViewer } from './MarkdownViewer';
import WidgetRegistryService from '../../services/WidgetRegistry';

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  tab,
  onContentChange,
  onDirtyChange,
}) => {
  const registry = WidgetRegistryService.getInstance();
  
  const handleSwitchWidget = useCallback((newWidgetType: string) => {
    // TODO: Implement widget switching
    // This would dispatch an action to update the tab's widget type
  }, []);

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
    
    case 'markdown-viewer':
      return (
        <MarkdownViewer
          content={tab.widget.props?.content as string}
          filePath={tab.filePath}
          onSwitchToEdit={() => handleSwitchWidget('text-editor')}
        />
      );
    
    case 'welcome':
      return <WelcomeWidget />;
    
    default:
      // Fallback to text editor
      return (
        <TextEditor
          content={tab.widget.props?.content as string}
          fileName={tab.title}
          filePath={tab.filePath}
          onContentChange={handleContentChange}
          onDirtyChange={handleDirtyChange}
        />
      );
  }
};
```

## Testing Plan

### Unit Tests
```typescript
// src/services/__tests__/WidgetRegistry.test.ts
describe('WidgetRegistry', () => {
  it('should return markdown-viewer for .md files', () => {
    const registry = WidgetRegistryService.getInstance();
    expect(registry.getWidgetForFile('test.md')).toBe('markdown-viewer');
  });
  
  it('should return text-editor for .js files', () => {
    const registry = WidgetRegistryService.getInstance();
    expect(registry.getWidgetForFile('test.js')).toBe('text-editor');
  });
  
  it('should respect user preferences', () => {
    const registry = WidgetRegistryService.getInstance();
    registry.setUserPreference('test.md', 'text-editor');
    expect(registry.getWidgetForFile('test.md')).toBe('text-editor');
  });
});
```

### E2E Tests
```typescript
// tests/markdown-viewer.e2e.spec.ts
test('markdown files open in viewer by default', async ({ page }) => {
  // Open a markdown file
  await page.click('[data-testid="file-explorer-item-readme.md"]');
  
  // Verify markdown viewer is shown
  await expect(page.locator('.markdown-viewer')).toBeVisible();
  
  // Verify content is rendered
  await expect(page.locator('.github-markdown-body h1')).toContainText('README');
});

test('can switch between viewer and editor', async ({ page }) => {
  // Open markdown file
  await page.click('[data-testid="file-explorer-item-readme.md"]');
  
  // Switch to editor
  await page.keyboard.press('Control+E');
  
  // Verify text editor is shown
  await expect(page.locator('.text-editor')).toBeVisible();
  
  // Switch back to viewer
  await page.keyboard.press('Control+Shift+V');
  
  // Verify markdown viewer is shown
  await expect(page.locator('.markdown-viewer')).toBeVisible();
});
```

## Performance Considerations

1. **Lazy Loading**: Markdown rendering libraries are loaded only when needed
2. **Memoization**: Rendered markdown is cached to avoid re-parsing
3. **Virtual Scrolling**: For large documents, implement virtual scrolling
4. **Web Worker**: Consider moving markdown parsing to a web worker

## Security Considerations

1. **Sanitization**: Ensure markdown content is properly sanitized
2. **CSP**: Configure Content Security Policy for rendered content
3. **Link Handling**: Validate and sanitize external links
4. **Script Execution**: Prevent script execution in rendered markdown

## Future Enhancements

1. **Live Preview**: Real-time preview while editing
2. **Export Options**: PDF, HTML, DOCX export
3. **Themes**: Multiple markdown rendering themes
4. **Extensions**: Support for custom markdown extensions
5. **Search**: In-document search functionality
6. **Outline View**: Collapsible document outline
7. **Synchronized Scrolling**: Sync scroll between editor and preview