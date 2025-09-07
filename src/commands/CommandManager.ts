import { LayoutAction } from '../state/layoutReducer';

export interface Command {
  id: string;
  label: string;
  keybinding?: string;
  when?: (context: any) => boolean;
  execute: (context?: any) => void;
}

export class CommandManager {
  private commands: Map<string, Command> = new Map();
  private dispatch: (action: LayoutAction) => void;
  private chordState: string | null = null;
  private chordTimeout: number = 1000; // 1 second timeout for chord sequences
  private chordTimer: NodeJS.Timeout | null = null;

  constructor(dispatch: (action: LayoutAction) => void) {
    this.dispatch = dispatch;
    this.registerDefaultCommands();
  }

  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
  }

  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }

  executeCommand(id: string, context?: any): boolean {
    const command = this.commands.get(id);
    if (!command) return false;

    // Check when condition
    if (command.when && !command.when(context)) {
      return false;
    }

    command.execute(context);
    return true;
  }

  getCommandsByKeybinding(keybinding: string): Command[] {
    const normalized = this.normalizeKeybinding(keybinding);
    const commands: Command[] = [];
    
    for (const command of this.commands.values()) {
      if (command.keybinding && this.normalizeKeybinding(command.keybinding) === normalized) {
        commands.push(command);
      }
    }
    
    return commands;
  }

  handleKeyboardEvent(event: KeyboardEvent, context?: any): boolean {
    const keybinding = this.eventToKeybinding(event);
    
    // Check if we're in a chord sequence
    if (this.chordState) {
      const fullKeybinding = `${this.chordState} ${keybinding}`;
      const commands = this.getCommandsByKeybinding(fullKeybinding);
      
      this.clearChordState();
      
      if (commands.length > 0) {
        // Execute the first matching command
        for (const command of commands) {
          if (!command.when || command.when(context)) {
            command.execute(context);
            return true;
          }
        }
      }
      
      return false;
    }

    // Check for single keybinding
    const commands = this.getCommandsByKeybinding(keybinding);
    
    for (const command of commands) {
      if (!command.when || command.when(context)) {
        command.execute(context);
        return true;
      }
    }

    // Check if this is the start of a chord sequence
    const isChordStart = this.isChordStart(keybinding);
    if (isChordStart) {
      this.startChordSequence(keybinding);
      return true;
    }

    return false;
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  setChordTimeout(timeout: number): void {
    this.chordTimeout = timeout;
  }

  private normalizeKeybinding(keybinding: string): string {
    return keybinding
      .split(' ')
      .map(chord => {
        const parts = chord.split('+');
        const key = parts[parts.length - 1];
        const modifiers = parts.slice(0, -1).map(m => m.toLowerCase()).sort();
        return [...modifiers, key.toUpperCase()].join('+');
      })
      .join(' ');
  }

  private eventToKeybinding(event: KeyboardEvent): string {
    const modifiers: string[] = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    
    return [...modifiers, key].join('+');
  }

  private isChordStart(keybinding: string): boolean {
    const normalized = this.normalizeKeybinding(keybinding);
    // Check if any command has a keybinding that starts with this
    for (const command of this.commands.values()) {
      if (command.keybinding) {
        const cmdNormalized = this.normalizeKeybinding(command.keybinding);
        if (cmdNormalized.startsWith(normalized + ' ')) {
          return true;
        }
      }
    }
    return false;
  }

  private startChordSequence(keybinding: string): void {
    this.chordState = keybinding;
    
    // Clear any existing timer
    if (this.chordTimer) {
      clearTimeout(this.chordTimer);
    }
    
    // Set timeout to clear chord state
    this.chordTimer = setTimeout(() => {
      this.clearChordState();
    }, this.chordTimeout);
  }

  private clearChordState(): void {
    this.chordState = null;
    if (this.chordTimer) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
  }

  private registerDefaultCommands(): void {
    // Split commands
    this.registerCommand({
      id: 'editor.splitHorizontal',
      label: 'Split Editor Right',
      keybinding: 'Ctrl+\\',
      execute: (context) => {
        if (context?.activeLeafId) {
          this.dispatch({
            type: 'SPLIT_LEAF',
            payload: {
              leafId: context.activeLeafId,
              direction: 'horizontal',
              ratio: 0.5
            }
          });
        }
      }
    });

    this.registerCommand({
      id: 'editor.splitVertical',
      label: 'Split Editor Down',
      keybinding: 'Ctrl+Alt+\\',
      execute: (context) => {
        if (context?.activeLeafId) {
          this.dispatch({
            type: 'SPLIT_LEAF',
            payload: {
              leafId: context.activeLeafId,
              direction: 'vertical',
              ratio: 0.5
            }
          });
        }
      }
    });

    // Focus mode command
    this.registerCommand({
      id: 'editor.toggleFocusMode',
      label: 'Toggle Focus Mode',
      keybinding: 'Alt+M',
      execute: (context) => {
        this.dispatch({
          type: 'TOGGLE_FOCUS_MODE',
          payload: {
            tabId: context?.activeTabId // Optional - will use current active tab if not provided
          }
        });
      }
    });

    // Zoom commands
    this.registerCommand({
      id: 'view.zoomIn',
      label: 'Zoom In',
      keybinding: 'Ctrl+=',
      execute: () => {
        // Zoom is handled by the useZoom hook in each widget
        // This command registration is mainly for documentation
        console.log('Zoom in: Use Ctrl+Plus or Ctrl+Scroll wheel up');
      }
    });

    this.registerCommand({
      id: 'view.zoomOut',
      label: 'Zoom Out',
      keybinding: 'Ctrl+-',
      execute: () => {
        // Zoom is handled by the useZoom hook in each widget
        console.log('Zoom out: Use Ctrl+Minus or Ctrl+Scroll wheel down');
      }
    });

    this.registerCommand({
      id: 'view.resetZoom',
      label: 'Reset Zoom',
      keybinding: 'Ctrl+0',
      execute: () => {
        // Zoom is handled by the useZoom hook in each widget
        console.log('Reset zoom: Use Ctrl+0');
      }
    });

    // Tab navigation
    this.registerCommand({
      id: 'tab.next',
      label: 'Next Tab',
      keybinding: 'Ctrl+Tab',
      execute: (context) => {
        if (context?.activeLeaf && context.activeLeaf.tabs.length > 1) {
          const currentIndex = context.activeLeaf.tabs.findIndex(
            (t: any) => t.id === context.activeLeaf.activeTabId
          );
          const nextIndex = (currentIndex + 1) % context.activeLeaf.tabs.length;
          const nextTab = context.activeLeaf.tabs[nextIndex];
          
          this.dispatch({
            type: 'ACTIVATE_TAB',
            payload: { tabId: nextTab.id }
          });
        }
      }
    });

    this.registerCommand({
      id: 'tab.previous',
      label: 'Previous Tab',
      keybinding: 'Ctrl+Shift+Tab',
      execute: (context) => {
        if (context?.activeLeaf && context.activeLeaf.tabs.length > 1) {
          const currentIndex = context.activeLeaf.tabs.findIndex(
            (t: any) => t.id === context.activeLeaf.activeTabId
          );
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : context.activeLeaf.tabs.length - 1;
          const prevTab = context.activeLeaf.tabs[prevIndex];
          
          this.dispatch({
            type: 'ACTIVATE_TAB',
            payload: { tabId: prevTab.id }
          });
        }
      }
    });

    // Tab close
    this.registerCommand({
      id: 'tab.close',
      label: 'Close Tab',
      keybinding: 'Ctrl+W',
      execute: (context) => {
        if (context?.activeLeaf?.activeTabId) {
          this.dispatch({
            type: 'CLOSE_TAB',
            payload: { tabId: context.activeLeaf.activeTabId }
          });
        }
      }
    });

    // Close all tabs
    this.registerCommand({
      id: 'tab.closeAll',
      label: 'Close All Tabs',
      keybinding: 'Ctrl+K Ctrl+W',
      execute: (context) => {
        if (context?.activeLeafId) {
          this.dispatch({
            type: 'CLOSE_ALL_TABS',
            payload: { leafId: context.activeLeafId }
          });
        }
      }
    });

    // Focus navigation
    this.registerCommand({
      id: 'focus.nextPane',
      label: 'Focus Next Pane',
      keybinding: 'F6',
      execute: (context) => {
        // Would cycle through panes
        // Implementation would depend on focus management
      }
    });

    this.registerCommand({
      id: 'focus.previousPane',
      label: 'Focus Previous Pane',
      keybinding: 'Shift+F6',
      execute: (context) => {
        // Would cycle through panes in reverse
      }
    });
  }
}