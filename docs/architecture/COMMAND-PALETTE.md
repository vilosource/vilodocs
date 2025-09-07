# Command Palette Implementation Guide

## Overview

The Command Palette is a central UI component that provides quick access to all application commands through a fuzzy-searchable interface. Based on VS Code's implementation, it will be the primary method for keyboard-driven navigation and command execution in Vilodocs.

## Core Concepts

### Command Palette vs Quick Open

```typescript
interface PaletteModes {
  'command': CommandPalette;      // > prefix or Ctrl+Shift+P
  'file': QuickOpen;              // Ctrl+P
  'symbol': SymbolSearch;         // @ prefix
  'line': GoToLine;               // : prefix
  'help': HelpSearch;             // ? prefix
}
```

## Architecture

### Component Structure

```typescript
interface CommandPaletteComponent {
  // Core state
  isOpen: boolean;
  mode: PaletteMode;
  query: string;
  results: CommandResult[];
  selectedIndex: number;
  
  // Methods
  open(mode?: PaletteMode): void;
  close(): void;
  search(query: string): void;
  execute(): void;
  
  // Navigation
  selectNext(): void;
  selectPrevious(): void;
  selectFirst(): void;
  selectLast(): void;
}
```

### Service Architecture

```typescript
class CommandPaletteService {
  private commands: Map<string, Command>;
  private recentCommands: string[];
  private searchEngine: FuseJS;
  
  // Registration
  registerCommand(command: Command): void;
  unregisterCommand(id: string): void;
  
  // Search
  search(query: string, options?: SearchOptions): CommandResult[];
  
  // Execution
  executeCommand(id: string, args?: any): Promise<any>;
  
  // History
  addToRecent(commandId: string): void;
  getRecentCommands(limit: number): Command[];
  clearHistory(): void;
}
```

## UI Design

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ > Search commands...                           [ESC] │
├─────────────────────────────────────────────────────┤
│ RECENTLY USED                                        │
│ ⏱ File: Open Recent           Ctrl+R                │
│ ⌨ View: Toggle Terminal       Ctrl+`                │
├─────────────────────────────────────────────────────┤
│ COMMANDS                                             │
│ 📁 File: New File             Ctrl+N                 │
│ 💾 File: Save                 Ctrl+S                 │
│ 🔍 File: Find in Files        Ctrl+Shift+F           │
│ ⚙️ Preferences: Open Settings  Ctrl+,                │
│ 🎨 View: Change Theme                                │
└─────────────────────────────────────────────────────┘
```

### Component Implementation

```tsx
const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className="command-palette">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Type '?' for help"
          autoFocus
        />
        
        <div className="results">
          {results.map((result, index) => (
            <CommandItem
              key={result.id}
              command={result}
              isSelected={index === selectedIndex}
              onClick={() => executeCommand(result)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};
```

## Command Registration

### Command Interface

```typescript
interface Command {
  // Identification
  id: string;                    // 'file.newFile'
  title: string;                 // 'New File'
  category?: string;             // 'File'
  
  // Execution
  handler: (...args: any[]) => void | Promise<void>;
  
  // Display
  icon?: string;
  description?: string;
  tooltip?: string;
  
  // Availability
  when?: string;                 // Conditional expression
  enabled?: boolean | (() => boolean);
  visible?: boolean | (() => boolean);
  
  // Keyboard
  keybinding?: string;           // 'ctrl+n'
  
  // Search
  aliases?: string[];            // Alternative names for search
  tags?: string[];              // Search tags
}
```

### Registration API

```typescript
// Simple registration
commandPalette.registerCommand({
  id: 'file.newFile',
  title: 'New File',
  category: 'File',
  keybinding: 'ctrl+n',
  handler: () => createNewFile()
});

// Advanced registration with conditions
commandPalette.registerCommand({
  id: 'markdown.togglePreview',
  title: 'Toggle Markdown Preview',
  category: 'Markdown',
  keybinding: 'ctrl+shift+v',
  when: 'editorLangId == markdown',
  handler: () => toggleMarkdownPreview(),
  aliases: ['preview', 'markdown preview'],
  tags: ['markdown', 'preview', 'view']
});
```

## Search Implementation

### Fuzzy Search with Fuse.js

```typescript
import Fuse from 'fuse.js';

class CommandSearchEngine {
  private fuse: Fuse<Command>;
  
  constructor(commands: Command[]) {
    this.fuse = new Fuse(commands, {
      keys: [
        { name: 'title', weight: 2.0 },
        { name: 'category', weight: 1.5 },
        { name: 'aliases', weight: 1.5 },
        { name: 'tags', weight: 1.0 },
        { name: 'description', weight: 0.5 }
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }
  
  search(query: string): CommandResult[] {
    // Handle special prefixes
    if (query.startsWith('>')) {
      return this.searchCommands(query.slice(1));
    }
    if (query.startsWith('@')) {
      return this.searchSymbols(query.slice(1));
    }
    if (query.startsWith(':')) {
      return this.goToLine(query.slice(1));
    }
    
    // Default search
    return this.fuse.search(query);
  }
}
```

### Result Ranking

```typescript
interface RankingFactors {
  recentUsage: number;      // Weight: 3.0
  exactMatch: number;       // Weight: 5.0
  categoryMatch: number;    // Weight: 2.0
  hasKeybinding: number;    // Weight: 1.5
  fuzzyScore: number;       // Weight: 1.0
}

function rankResults(results: CommandResult[]): CommandResult[] {
  return results
    .map(result => ({
      ...result,
      score: calculateScore(result)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50); // Limit results
}
```

## Quick Open Modes

### File Search (Ctrl+P)

```typescript
class QuickOpenFile {
  private fileIndex: FileIndex;
  
  async search(query: string): Promise<FileResult[]> {
    // Search in workspace files
    const files = await this.fileIndex.search(query);
    
    // Rank by relevance
    return files.sort((a, b) => {
      // Prioritize recently opened
      if (a.recentlyOpened !== b.recentlyOpened) {
        return a.recentlyOpened ? -1 : 1;
      }
      // Then by match quality
      return b.score - a.score;
    });
  }
}
```

### Symbol Search (@)

```typescript
class SymbolSearch {
  async search(query: string): Promise<SymbolResult[]> {
    const currentFile = getCurrentEditor()?.filePath;
    if (!currentFile) return [];
    
    // Get symbols from language service
    const symbols = await getDocumentSymbols(currentFile);
    
    // Filter and rank
    return symbols
      .filter(s => s.name.includes(query))
      .map(s => ({
        label: s.name,
        kind: s.kind,
        location: s.location,
        icon: getSymbolIcon(s.kind)
      }));
  }
}
```

### Go to Line (:)

```typescript
class GoToLine {
  execute(input: string): void {
    const line = parseInt(input, 10);
    if (isNaN(line)) return;
    
    const editor = getCurrentEditor();
    if (editor) {
      editor.goToLine(line);
      editor.focus();
    }
  }
}
```

## Keyboard Navigation

### Shortcut Handling

```typescript
class PaletteKeyboardHandler {
  private shortcuts = {
    'Escape': () => this.close(),
    'Enter': () => this.executeSelected(),
    'ArrowDown': () => this.selectNext(),
    'ArrowUp': () => this.selectPrevious(),
    'Tab': () => this.selectNext(),
    'Shift+Tab': () => this.selectPrevious(),
    'Ctrl+Enter': () => this.executeAndKeepOpen(),
    'Alt+Enter': () => this.executeInBackground(),
    'PageDown': () => this.pageDown(),
    'PageUp': () => this.pageUp(),
    'Home': () => this.selectFirst(),
    'End': () => this.selectLast()
  };
  
  handleKeyDown(event: KeyboardEvent): void {
    const key = this.getKeyCombo(event);
    const handler = this.shortcuts[key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }
}
```

### Global Shortcuts

```typescript
// Register global shortcuts
app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    commandPalette.open('command');
  });
  
  globalShortcut.register('CommandOrControl+P', () => {
    commandPalette.open('file');
  });
});
```

## Context System

### When Clauses

```typescript
interface WhenClause {
  evaluate(context: Context): boolean;
}

class ContextKeyExpr {
  static deserialize(expr: string): WhenClause {
    // Parse expressions like:
    // "editorTextFocus"
    // "!editorReadonly"
    // "editorLangId == 'markdown'"
    // "markdownPreviewFocus && !markdownPreviewLocked"
  }
}

// Usage in commands
{
  id: 'editor.action.formatDocument',
  when: 'editorTextFocus && !editorReadonly',
  handler: formatDocument
}
```

### Context Variables

```typescript
interface ContextVariables {
  // Editor
  editorTextFocus: boolean;
  editorLangId: string;
  editorReadonly: boolean;
  editorHasSelection: boolean;
  
  // Markdown
  markdownPreviewFocus: boolean;
  markdownPreviewVisible: boolean;
  
  // Workspace
  workspaceOpen: boolean;
  workspaceEmpty: boolean;
  
  // UI
  sidebarVisible: boolean;
  panelVisible: boolean;
  
  // Custom
  [key: string]: any;
}
```

## Recent Commands

### History Management

```typescript
class CommandHistory {
  private static readonly MAX_RECENT = 10;
  private static readonly STORAGE_KEY = 'commandPalette.recent';
  
  private recent: string[] = [];
  
  constructor() {
    this.load();
  }
  
  add(commandId: string): void {
    // Remove if exists
    this.recent = this.recent.filter(id => id !== commandId);
    
    // Add to front
    this.recent.unshift(commandId);
    
    // Limit size
    this.recent = this.recent.slice(0, CommandHistory.MAX_RECENT);
    
    // Persist
    this.save();
  }
  
  getRecent(): string[] {
    return [...this.recent];
  }
  
  private load(): void {
    const stored = localStorage.getItem(CommandHistory.STORAGE_KEY);
    if (stored) {
      this.recent = JSON.parse(stored);
    }
  }
  
  private save(): void {
    localStorage.setItem(
      CommandHistory.STORAGE_KEY,
      JSON.stringify(this.recent)
    );
  }
}
```

## Theming

### CSS Variables

```css
.command-palette {
  --palette-bg: var(--vscode-quickInput-background);
  --palette-fg: var(--vscode-quickInput-foreground);
  --palette-border: var(--vscode-quickInputTitle-background);
  --item-hover-bg: var(--vscode-list-hoverBackground);
  --item-selected-bg: var(--vscode-list-activeSelectionBackground);
  --item-selected-fg: var(--vscode-list-activeSelectionForeground);
  --keybinding-fg: var(--vscode-keybindingLabel-foreground);
  --keybinding-bg: var(--vscode-keybindingLabel-background);
  --keybinding-border: var(--vscode-keybindingLabel-border);
}
```

### Component Styling

```css
.command-palette {
  position: fixed;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-height: 400px;
  background: var(--palette-bg);
  border: 1px solid var(--palette-border);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  z-index: 10000;
}

.command-palette-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--palette-fg);
  font-size: 14px;
  outline: none;
}

.command-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
}

.command-item:hover {
  background: var(--item-hover-bg);
}

.command-item.selected {
  background: var(--item-selected-bg);
  color: var(--item-selected-fg);
}

.command-keybinding {
  margin-left: auto;
  padding: 2px 6px;
  background: var(--keybinding-bg);
  border: 1px solid var(--keybinding-border);
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
}
```

## Performance Optimization

### Virtualization

```typescript
class VirtualList {
  private itemHeight = 32;
  private overscan = 3;
  
  getVisibleRange(scrollTop: number, height: number): [number, number] {
    const start = Math.floor(scrollTop / this.itemHeight) - this.overscan;
    const end = Math.ceil((scrollTop + height) / this.itemHeight) + this.overscan;
    
    return [
      Math.max(0, start),
      Math.min(this.items.length, end)
    ];
  }
  
  renderVisibleItems(): ReactElement[] {
    const [start, end] = this.getVisibleRange();
    
    return this.items
      .slice(start, end)
      .map((item, index) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            top: (start + index) * this.itemHeight
          }}
        >
          {renderItem(item)}
        </div>
      ));
  }
}
```

### Search Debouncing

```typescript
class SearchDebouncer {
  private timeout: NodeJS.Timeout | null = null;
  private readonly delay = 100; // ms
  
  debounce(fn: Function): Function {
    return (...args: any[]) => {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      this.timeout = setTimeout(() => {
        fn(...args);
        this.timeout = null;
      }, this.delay);
    };
  }
}
```

### Caching

```typescript
class CommandCache {
  private cache = new Map<string, CommandResult[]>();
  private maxSize = 50;
  
  get(query: string): CommandResult[] | undefined {
    return this.cache.get(query);
  }
  
  set(query: string, results: CommandResult[]): void {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(query, results);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

## Integration with Existing System

### CommandManager Extension

```typescript
// Extend existing CommandManager
class EnhancedCommandManager extends CommandManager {
  private palette: CommandPaletteService;
  
  registerCommand(command: Command): void {
    super.registerCommand(command);
    this.palette.registerCommand(command);
  }
  
  executeCommand(id: string, ...args: any[]): Promise<any> {
    // Track usage for recent commands
    this.palette.trackUsage(id);
    return super.executeCommand(id, ...args);
  }
}
```

### React Integration

```typescript
// Hook for command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('CommandPalette', () => {
  it('should filter commands based on query', () => {
    const commands = [
      { id: 'file.new', title: 'New File' },
      { id: 'file.open', title: 'Open File' },
      { id: 'edit.copy', title: 'Copy' }
    ];
    
    const results = searchCommands('file', commands);
    expect(results).toHaveLength(2);
  });
  
  it('should rank recent commands higher', () => {
    const recent = ['edit.copy'];
    const results = rankResults(commands, recent);
    expect(results[0].id).toBe('edit.copy');
  });
});
```

### E2E Tests

```typescript
test('Command palette workflow', async ({ page }) => {
  // Open palette
  await page.keyboard.press('Control+Shift+P');
  
  // Search for command
  await page.type('new file');
  
  // Execute command
  await page.keyboard.press('Enter');
  
  // Verify action
  await expect(page.locator('.editor-tab')).toContainText('Untitled');
});
```

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] CommandPaletteService implementation
- [ ] Basic UI component
- [ ] Command registration API
- [ ] Integration with CommandManager

### Week 2: Search & Features
- [ ] Fuzzy search with Fuse.js
- [ ] Recent commands tracking
- [ ] Quick open modes
- [ ] Context system

### Week 3: Polish & Testing
- [ ] Keyboard navigation
- [ ] Theming and styling
- [ ] Performance optimization
- [ ] Comprehensive testing

## References

- [VS Code Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)
- [Fuse.js Documentation](https://fusejs.io/)
- [VS Code Extension API - Commands](https://code.visualstudio.com/api/extension-guides/command)