# Keyboard System Documentation

## Overview

This document specifies a comprehensive keyboard shortcut system for Vilodocs that maintains compatibility with VS Code shortcuts while providing flexibility for customization. The system will enable power users to navigate and control the application entirely via keyboard.

## Architecture

### Core Components

```typescript
interface KeyboardSystem {
  keybindingService: KeybindingService;      // Core service
  shortcutManager: ShortcutManager;          // Registration & conflicts
  contextService: ContextService;            // When clauses
  chordHandler: ChordHandler;                // Multi-key sequences
  configuration: KeybindingConfiguration;    // User settings
}
```

### Service Architecture

```typescript
class KeybindingService {
  private bindings: Map<string, Keybinding[]>;
  private contexts: ContextService;
  private history: KeystrokeHistory;
  
  // Registration
  registerKeybinding(binding: Keybinding): void;
  unregisterKeybinding(id: string): void;
  
  // Execution
  handleKeyEvent(event: KeyboardEvent): boolean;
  executeBinding(binding: Keybinding): void;
  
  // Query
  getKeybindingsForCommand(commandId: string): Keybinding[];
  getConflicts(keybinding: string): Keybinding[];
}
```

## Keybinding Model

### Keybinding Interface

```typescript
interface Keybinding {
  // Identification
  id: string;
  command: string;
  
  // Key combination
  key: string;                    // "ctrl+shift+p"
  mac?: string;                   // "cmd+shift+p"
  linux?: string;                 // Platform-specific
  win?: string;                   // Platform-specific
  
  // Conditions
  when?: string;                  // Context expression
  
  // Metadata
  source: 'default' | 'user' | 'extension';
  priority: number;
}
```

### Key Notation

```typescript
// Modifiers
const modifiers = {
  'ctrl': 'Control',
  'cmd': 'Meta',          // macOS Command key
  'alt': 'Alt',
  'shift': 'Shift',
  'meta': 'Meta'          // Windows key
};

// Special keys
const specialKeys = {
  'escape': 'Escape',
  'enter': 'Enter',
  'tab': 'Tab',
  'backspace': 'Backspace',
  'delete': 'Delete',
  'space': ' ',
  'up': 'ArrowUp',
  'down': 'ArrowDown',
  'left': 'ArrowLeft',
  'right': 'ArrowRight',
  'home': 'Home',
  'end': 'End',
  'pageup': 'PageUp',
  'pagedown': 'PageDown'
};

// Examples
"ctrl+s"              // Save
"ctrl+shift+p"        // Command palette
"ctrl+k ctrl+s"       // Chord: Save all
"alt+shift+f"         // Format document
```

## VS Code Compatible Shortcuts

### Essential Shortcuts

| Category | Windows/Linux | macOS | Command |
|----------|--------------|-------|---------|
| **General** |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` | `workbench.action.showCommands` |
| Quick Open | `Ctrl+P` | `Cmd+P` | `workbench.action.quickOpen` |
| Settings | `Ctrl+,` | `Cmd+,` | `workbench.action.openSettings` |
| Keyboard Shortcuts | `Ctrl+K Ctrl+S` | `Cmd+K Cmd+S` | `workbench.action.openGlobalKeybindings` |

### File Management

| Windows/Linux | macOS | Command |
|--------------|-------|---------|
| `Ctrl+N` | `Cmd+N` | `workbench.action.files.newFile` |
| `Ctrl+O` | `Cmd+O` | `workbench.action.files.openFile` |
| `Ctrl+S` | `Cmd+S` | `workbench.action.files.save` |
| `Ctrl+Shift+S` | `Cmd+Shift+S` | `workbench.action.files.saveAs` |
| `Ctrl+K S` | `Cmd+K S` | `workbench.action.files.saveAll` |
| `Ctrl+W` | `Cmd+W` | `workbench.action.closeActiveEditor` |
| `Ctrl+K Ctrl+W` | `Cmd+K Cmd+W` | `workbench.action.closeAllEditors` |
| `Ctrl+Shift+T` | `Cmd+Shift+T` | `workbench.action.reopenClosedEditor` |

### Editing

| Windows/Linux | macOS | Command |
|--------------|-------|---------|
| `Ctrl+X` | `Cmd+X` | `editor.action.clipboardCutAction` |
| `Ctrl+C` | `Cmd+C` | `editor.action.clipboardCopyAction` |
| `Ctrl+V` | `Cmd+V` | `editor.action.clipboardPasteAction` |
| `Ctrl+Z` | `Cmd+Z` | `undo` |
| `Ctrl+Shift+Z` | `Cmd+Shift+Z` | `redo` |
| `Ctrl+F` | `Cmd+F` | `actions.find` |
| `Ctrl+H` | `Cmd+Alt+F` | `editor.action.startFindReplaceAction` |
| `Ctrl+D` | `Cmd+D` | `editor.action.addSelectionToNextFindMatch` |
| `Ctrl+Shift+L` | `Cmd+Shift+L` | `editor.action.selectHighlights` |
| `Alt+Up` | `Option+Up` | `editor.action.moveLinesUpAction` |
| `Alt+Down` | `Option+Down` | `editor.action.moveLinesDownAction` |
| `Shift+Alt+Up` | `Shift+Option+Up` | `editor.action.copyLinesUpAction` |
| `Shift+Alt+Down` | `Shift+Option+Down` | `editor.action.copyLinesDownAction` |
| `Ctrl+/` | `Cmd+/` | `editor.action.commentLine` |
| `Shift+Alt+A` | `Shift+Option+A` | `editor.action.blockComment` |

### Navigation

| Windows/Linux | macOS | Command |
|--------------|-------|---------|
| `Ctrl+G` | `Cmd+G` | `workbench.action.gotoLine` |
| `Ctrl+Shift+O` | `Cmd+Shift+O` | `workbench.action.gotoSymbol` |
| `Ctrl+Shift+M` | `Cmd+Shift+M` | `workbench.actions.view.problems` |
| `F8` | `F8` | `editor.action.marker.nextInFiles` |
| `Shift+F8` | `Shift+F8` | `editor.action.marker.prevInFiles` |
| `Ctrl+Tab` | `Ctrl+Tab` | `workbench.action.openNextRecentlyUsedEditorInGroup` |
| `Ctrl+Shift+Tab` | `Ctrl+Shift+Tab` | `workbench.action.openPreviousRecentlyUsedEditorInGroup` |
| `Alt+Left` | `Ctrl+-` | `workbench.action.navigateBack` |
| `Alt+Right` | `Ctrl+Shift+-` | `workbench.action.navigateForward` |

### View/Layout

| Windows/Linux | macOS | Command |
|--------------|-------|---------|
| `Ctrl+B` | `Cmd+B` | `workbench.action.toggleSidebarVisibility` |
| `Ctrl+Shift+E` | `Cmd+Shift+E` | `workbench.view.explorer` |
| `Ctrl+Shift+F` | `Cmd+Shift+F` | `workbench.view.search` |
| `Ctrl+Shift+G` | `Ctrl+Shift+G` | `workbench.view.scm` |
| `Ctrl+Shift+D` | `Cmd+Shift+D` | `workbench.view.debug` |
| `Ctrl+Shift+X` | `Cmd+Shift+X` | `workbench.view.extensions` |
| `` Ctrl+` `` | `` Cmd+` `` | `workbench.action.terminal.toggleTerminal` |
| `Ctrl+\` | `Cmd+\` | `workbench.action.splitEditor` |
| `Ctrl+1` | `Cmd+1` | `workbench.action.focusFirstEditorGroup` |
| `Ctrl+2` | `Cmd+2` | `workbench.action.focusSecondEditorGroup` |
| `Ctrl+K Ctrl+Left` | `Cmd+K Cmd+Left` | `workbench.action.focusLeftGroup` |
| `Ctrl+K Ctrl+Right` | `Cmd+K Cmd+Right` | `workbench.action.focusRightGroup` |

### Markdown-Specific

| Windows/Linux | macOS | Command |
|--------------|-------|---------|
| `Ctrl+Shift+V` | `Cmd+Shift+V` | `markdown.showPreview` |
| `Ctrl+K V` | `Cmd+K V` | `markdown.showPreviewToSide` |
| `Ctrl+E` | `Cmd+E` | `markdown.toggleEditMode` |
| `Ctrl+B` | `Cmd+B` | `markdown.bold` |
| `Ctrl+I` | `Cmd+I` | `markdown.italic` |

## Context System

### Context Variables

```typescript
interface ContextKeys {
  // Editor contexts
  'editorFocus': boolean;
  'editorTextFocus': boolean;
  'editorHasSelection': boolean;
  'editorHasMultipleSelections': boolean;
  'editorReadonly': boolean;
  'editorLangId': string;
  
  // UI contexts
  'sideBarFocus': boolean;
  'sideBarVisible': boolean;
  'panelFocus': boolean;
  'panelVisible': boolean;
  'terminalFocus': boolean;
  
  // Markdown contexts
  'markdownPreviewFocus': boolean;
  'markdownPreviewVisible': boolean;
  'resourceExtname': string;
  
  // Custom contexts
  'inQuickOpen': boolean;
  'inCommandPalette': boolean;
  'workspaceFolderCount': number;
  'isLinux': boolean;
  'isMac': boolean;
  'isWindows': boolean;
}
```

### When Clause Expressions

```typescript
// Expression grammar
type WhenExpression = 
  | ContextKey
  | NotExpression
  | EqualsExpression
  | AndExpression
  | OrExpression
  | InExpression
  | ComparisonExpression;

// Examples
"editorTextFocus"                           // Simple context
"!editorReadonly"                           // Negation
"editorLangId == 'markdown'"               // Equality
"editorTextFocus && !editorReadonly"       // AND
"sideBarFocus || panelFocus"               // OR
"resourceExtname in ['.md', '.markdown']"  // IN
"workspaceFolderCount >= 2"                // Comparison
```

### Context Evaluation

```typescript
class ContextService {
  private contexts: Map<string, any> = new Map();
  
  setContext(key: string, value: any): void {
    this.contexts.set(key, value);
    this.notifyListeners(key, value);
  }
  
  getContext(key: string): any {
    return this.contexts.get(key);
  }
  
  evaluate(expression: string): boolean {
    const expr = this.parseExpression(expression);
    return this.evaluateExpression(expr);
  }
  
  private evaluateExpression(expr: WhenExpression): boolean {
    // Implementation of expression evaluation
    switch (expr.type) {
      case 'context':
        return !!this.getContext(expr.key);
      case 'not':
        return !this.evaluateExpression(expr.expression);
      case 'equals':
        return this.getContext(expr.key) === expr.value;
      case 'and':
        return expr.expressions.every(e => this.evaluateExpression(e));
      case 'or':
        return expr.expressions.some(e => this.evaluateExpression(e));
      // ... more cases
    }
  }
}
```

## Chord Support

### Multi-Key Sequences

```typescript
class ChordHandler {
  private chordState: string[] = [];
  private chordTimeout: number = 2000; // 2 seconds
  private timer: NodeJS.Timeout | null = null;
  
  handleKey(key: string): string | null {
    // Clear existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Add key to chord
    this.chordState.push(key);
    
    // Check if this completes a chord
    const chord = this.chordState.join(' ');
    if (this.isCompleteChord(chord)) {
      this.reset();
      return chord;
    }
    
    // Set timeout for next key
    this.timer = setTimeout(() => this.reset(), this.chordTimeout);
    
    return null;
  }
  
  reset(): void {
    this.chordState = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  
  private isCompleteChord(chord: string): boolean {
    // Check if chord matches any registered binding
    return this.keybindingService.hasBinding(chord);
  }
}
```

### Chord Examples

```typescript
const chordBindings = [
  {
    key: "ctrl+k ctrl+s",
    command: "workbench.action.files.saveAll",
    when: "editorTextFocus"
  },
  {
    key: "ctrl+k ctrl+c",
    command: "editor.action.commentLine",
    when: "editorTextFocus"
  },
  {
    key: "ctrl+k ctrl+u",
    command: "editor.action.uncommentLine",
    when: "editorTextFocus"
  },
  {
    key: "ctrl+k m",
    command: "workbench.action.editor.changeLanguageMode"
  }
];
```

## Configuration System

### User Settings

```typescript
interface KeybindingConfiguration {
  // Settings file location
  userKeybindingsFile: string;  // ~/.config/vilodocs/keybindings.json
  
  // Configuration options
  enableChords: boolean;
  chordTimeout: number;
  overrideDefaults: boolean;
  warnOnConflicts: boolean;
}
```

### Keybindings.json Format

```json
// ~/.config/vilodocs/keybindings.json
[
  {
    "key": "ctrl+shift+alt+n",
    "command": "workbench.action.files.newFile",
    "when": "!inQuickOpen"
  },
  {
    "key": "ctrl+k ctrl+b",
    "command": "workbench.action.toggleSidebarVisibility"
  },
  {
    "key": "ctrl+shift+[",
    "command": "-workbench.action.previousEditor"  // Remove default binding
  },
  {
    "key": "alt+cmd+left",
    "command": "workbench.action.previousEditor",
    "when": "isMac"
  }
]
```

### Configuration UI

```typescript
interface KeybindingEditor {
  // Search and filter
  searchKeybindings(query: string): Keybinding[];
  filterByCategory(category: string): Keybinding[];
  
  // Modification
  addKeybinding(binding: Keybinding): void;
  removeKeybinding(id: string): void;
  updateKeybinding(id: string, newKey: string): void;
  
  // Conflict resolution
  detectConflicts(key: string): Keybinding[];
  resolveConflict(binding1: Keybinding, binding2: Keybinding): void;
  
  // Import/Export
  importVSCodeKeybindings(json: string): void;
  exportKeybindings(): string;
  resetToDefaults(): void;
}
```

## Implementation with Mousetrap

### Integration

```typescript
import Mousetrap from 'mousetrap';

class MousetrapAdapter {
  private mousetrap: Mousetrap.MousetrapInstance;
  
  constructor(element: HTMLElement = document.body) {
    this.mousetrap = new Mousetrap(element);
    this.setupGlobalBindings();
  }
  
  bind(key: string, callback: Function, action?: string): void {
    this.mousetrap.bind(key, (e, combo) => {
      e.preventDefault();
      return callback(combo) === false ? false : undefined;
    }, action);
  }
  
  unbind(key: string): void {
    this.mousetrap.unbind(key);
  }
  
  private setupGlobalBindings(): void {
    // Prevent defaults for common shortcuts
    Mousetrap.prototype.stopCallback = (e, element, combo) => {
      // Allow shortcuts in input fields for specific combos
      const allowedInInput = [
        'ctrl+s', 'cmd+s',
        'ctrl+z', 'cmd+z',
        'ctrl+shift+z', 'cmd+shift+z'
      ];
      
      if (allowedInInput.includes(combo)) {
        return false;
      }
      
      // Default behavior
      return element.tagName === 'INPUT' ||
             element.tagName === 'SELECT' ||
             element.tagName === 'TEXTAREA' ||
             element.contentEditable === 'true';
    };
  }
}
```

### Recording Shortcuts

```typescript
class ShortcutRecorder {
  private recording: boolean = false;
  private keys: Set<string> = new Set();
  
  startRecording(): void {
    this.recording = true;
    this.keys.clear();
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }
  
  stopRecording(): string {
    this.recording = false;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    return this.formatShortcut();
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    e.preventDefault();
    
    if (e.ctrlKey) this.keys.add('ctrl');
    if (e.altKey) this.keys.add('alt');
    if (e.shiftKey) this.keys.add('shift');
    if (e.metaKey) this.keys.add('cmd');
    
    if (!this.isModifier(e.key)) {
      this.keys.add(e.key.toLowerCase());
    }
  };
  
  private formatShortcut(): string {
    const order = ['ctrl', 'alt', 'shift', 'cmd'];
    const modifiers = order.filter(m => this.keys.has(m));
    const keys = Array.from(this.keys).filter(k => !order.includes(k));
    
    return [...modifiers, ...keys].join('+');
  }
}
```

## Conflict Detection

### Conflict Resolution

```typescript
class ConflictDetector {
  detectConflicts(newBinding: Keybinding): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check exact match
    const exact = this.findExactMatch(newBinding.key);
    if (exact.length > 0) {
      conflicts.push({
        type: 'exact',
        bindings: exact,
        severity: 'error'
      });
    }
    
    // Check prefix conflicts (for chords)
    const prefix = this.findPrefixConflicts(newBinding.key);
    if (prefix.length > 0) {
      conflicts.push({
        type: 'prefix',
        bindings: prefix,
        severity: 'warning'
      });
    }
    
    // Check shadow conflicts (overridden by context)
    const shadow = this.findShadowConflicts(newBinding);
    if (shadow.length > 0) {
      conflicts.push({
        type: 'shadow',
        bindings: shadow,
        severity: 'info'
      });
    }
    
    return conflicts;
  }
  
  resolveConflict(conflict: Conflict, resolution: Resolution): void {
    switch (resolution) {
      case 'replace':
        // Remove old binding, add new
        break;
      case 'addCondition':
        // Add when clause to differentiate
        break;
      case 'cancel':
        // Don't add new binding
        break;
    }
  }
}
```

## Performance Optimization

### Lazy Loading

```typescript
class LazyKeybindingLoader {
  private loaded = new Set<string>();
  
  async loadForContext(context: string): Promise<void> {
    if (this.loaded.has(context)) return;
    
    const bindings = await import(`./keybindings/${context}`);
    bindings.default.forEach(b => this.register(b));
    
    this.loaded.add(context);
  }
}
```

### Caching

```typescript
class KeybindingCache {
  private cache = new Map<string, Keybinding[]>();
  
  getCachedBinding(key: string, context: Context): Keybinding[] {
    const cacheKey = `${key}:${this.contextHash(context)}`;
    
    if (!this.cache.has(cacheKey)) {
      const bindings = this.computeBindings(key, context);
      this.cache.set(cacheKey, bindings);
    }
    
    return this.cache.get(cacheKey)!;
  }
  
  invalidate(): void {
    this.cache.clear();
  }
}
```

## Testing

### Unit Tests

```typescript
describe('KeybindingService', () => {
  it('should handle basic shortcuts', () => {
    const service = new KeybindingService();
    const handler = jest.fn();
    
    service.registerKeybinding({
      key: 'ctrl+s',
      command: 'save',
      handler
    });
    
    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 's'
    });
    
    service.handleKeyEvent(event);
    expect(handler).toHaveBeenCalled();
  });
  
  it('should respect when clauses', () => {
    const service = new KeybindingService();
    const handler = jest.fn();
    
    service.registerKeybinding({
      key: 'ctrl+b',
      command: 'bold',
      when: 'editorTextFocus',
      handler
    });
    
    // Without context
    service.handleKeyEvent(createKeyEvent('ctrl+b'));
    expect(handler).not.toHaveBeenCalled();
    
    // With context
    service.setContext('editorTextFocus', true);
    service.handleKeyEvent(createKeyEvent('ctrl+b'));
    expect(handler).toHaveBeenCalled();
  });
});
```

## Migration Path

### Import VS Code Settings

```typescript
class VSCodeImporter {
  async importKeybindings(vscodeSettingsPath: string): Promise<void> {
    const keybindingsPath = path.join(vscodeSettingsPath, 'keybindings.json');
    const content = await fs.readFile(keybindingsPath, 'utf8');
    const bindings = JSON.parse(content);
    
    for (const binding of bindings) {
      // Convert VS Code format to our format
      const converted = this.convertBinding(binding);
      if (this.isSupported(converted)) {
        this.keybindingService.registerKeybinding(converted);
      }
    }
  }
  
  private convertBinding(vscodeBinding: any): Keybinding {
    return {
      key: vscodeBinding.key,
      command: vscodeBinding.command,
      when: vscodeBinding.when,
      source: 'user'
    };
  }
}
```

## Implementation Timeline

### Phase 1: Core System (Week 1)
- [ ] KeybindingService implementation
- [ ] Basic shortcut handling
- [ ] Platform detection
- [ ] Integration with CommandManager

### Phase 2: VS Code Compatibility (Week 2)
- [ ] Import all VS Code shortcuts
- [ ] Context system implementation
- [ ] Chord support
- [ ] When clause evaluation

### Phase 3: Configuration (Week 3)
- [ ] User keybindings.json support
- [ ] Configuration UI
- [ ] Conflict detection
- [ ] Import/export functionality

## References

- [VS Code Keybindings](https://code.visualstudio.com/docs/getstarted/keybindings)
- [Mousetrap Documentation](https://craig.is/killing/mice)
- [VS Code When Clause Contexts](https://code.visualstudio.com/api/references/when-clause-contexts)