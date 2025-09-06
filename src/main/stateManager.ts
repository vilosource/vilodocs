/**
 * Main process state manager
 * Handles all persistent state operations using electron-store
 */

import Store from 'electron-store';
import { ipcMain, BrowserWindow } from 'electron';
import { 
  ApplicationState, 
  DEFAULT_APPLICATION_STATE,
  StateUpdateAction,
  WidgetRegistration,
  WorkspaceState,
  LayoutState,
  getWorkspaceId
} from '../common/state-types';
import { Channels } from '../common/ipc';

interface StoreSchema {
  state: ApplicationState;
  version: number;
}

export class StateManager {
  private store: Store<StoreSchema>;
  private state: ApplicationState;
  private saveTimeout: NodeJS.Timeout | null = null;
  private widgets: Map<string, WidgetRegistration> = new Map();

  constructor() {
    // Initialize electron-store with schema
    this.store = new Store<StoreSchema>({
      name: 'app-state',
      defaults: {
        state: DEFAULT_APPLICATION_STATE,
        version: 1,
      },
      migrations: {
        '1.0.0': (store) => {
          // Migration from localStorage to electron-store
          console.log('Migrating state to version 1.0.0');
        },
      },
    });

    // Load initial state
    console.log('StateManager: Initializing...');
    this.state = this.loadStateFromDisk();
    console.log('StateManager: Loaded initial state:', JSON.stringify(this.state, null, 2));
    
    // Register IPC handlers
    this.registerIPCHandlers();
    console.log('StateManager: IPC handlers registered');
  }

  /**
   * Load state from disk
   */
  private loadStateFromDisk(): ApplicationState {
    try {
      const stored = this.store.get('state');
      console.log('StateManager: Loading state from disk:', JSON.stringify(stored, null, 2));
      
      // Validate and migrate if needed
      if (this.validateState(stored)) {
        console.log('StateManager: State is valid, returning stored state');
        return stored;
      }
      
      console.warn('StateManager: Invalid state found, using defaults');
      return DEFAULT_APPLICATION_STATE;
    } catch (error) {
      console.error('StateManager: Failed to load state:', error);
      return DEFAULT_APPLICATION_STATE;
    }
  }

  /**
   * Save state to disk (debounced)
   */
  private saveStateToDisk(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      try {
        this.store.set('state', this.state);
        this.store.set('version', this.state.version);
        
        // Notify all windows that state was saved
        this.broadcastToWindows(Channels.StateSaved, this.state);
        
        console.log('State saved to disk');
      } catch (error) {
        console.error('Failed to save state:', error);
        this.broadcastToWindows(Channels.StateError, error);
      }
    }, 500); // 500ms debounce
  }

  /**
   * Validate state structure
   */
  private validateState(state: any): state is ApplicationState {
    return (
      state &&
      typeof state === 'object' &&
      'version' in state &&
      'workspace' in state &&
      'layout' in state &&
      'widgets' in state &&
      'preferences' in state
    );
  }

  /**
   * Register IPC handlers
   */
  private registerIPCHandlers(): void {
    // Load complete state
    ipcMain.handle(Channels.LoadState, () => {
      return this.state;
    });

    // Save complete state
    ipcMain.handle(Channels.SaveState, (_, state: ApplicationState) => {
      this.state = state;
      this.saveStateToDisk();
      this.broadcastToWindows(Channels.StateChanged, this.state);
    });

    // Update partial state
    ipcMain.handle(Channels.UpdateState, (_, action: StateUpdateAction) => {
      this.handleStateUpdate(action);
      this.saveStateToDisk();
      this.broadcastToWindows(Channels.StateChanged, this.state);
    });

    // Widget registration
    ipcMain.handle(Channels.RegisterWidget, (_, widget: WidgetRegistration) => {
      this.widgets.set(widget.id, widget);
      
      // Initialize widget state if not present
      if (!this.state.widgets[widget.id]) {
        this.state.widgets[widget.id] = {
          type: widget.type,
          state: widget.defaultState,
        };
        this.saveStateToDisk();
      }
    });

    // Update widget state
    ipcMain.handle(Channels.UpdateWidgetState, (_, widgetId: string, state: any) => {
      if (this.state.widgets[widgetId]) {
        this.state.widgets[widgetId].state = state;
        this.saveStateToDisk();
        this.broadcastToWindows(Channels.StateChanged, this.state);
      }
    });

    // Get widget state
    ipcMain.handle(Channels.GetWidgetState, (_, widgetId: string) => {
      return this.state.widgets[widgetId]?.state || null;
    });
  }

  /**
   * Handle state update actions
   */
  private handleStateUpdate(action: StateUpdateAction): void {
    switch (action.type) {
      case 'workspace':
        this.updateWorkspace(action.payload);
        break;
      
      case 'layout':
        this.updateLayout(action.payload);
        break;
      
      case 'widget':
        if (action.widgetId) {
          this.updateWidget(action.widgetId, action.payload);
        }
        break;
      
      case 'preferences':
        this.updatePreferences(action.payload);
        break;
    }
  }

  /**
   * Update workspace state
   */
  private updateWorkspace(workspace: Partial<WorkspaceState>): void {
    this.state.workspace = {
      ...this.state.workspace,
      ...workspace,
    };

    // Update recent workspaces
    if (workspace.current) {
      this.updateRecentWorkspaces(workspace.current);
    }

    // Handle expanded folders for current workspace
    if (workspace.current && workspace.expandedFolders) {
      const workspaceId = getWorkspaceId(workspace.current);
      this.state.workspace.expandedFolders[workspaceId] = workspace.expandedFolders[workspaceId] || [];
    }
  }

  /**
   * Update layout state
   */
  private updateLayout(layout: Partial<LayoutState>): void {
    this.state.layout = {
      ...this.state.layout,
      ...layout,
    };
  }

  /**
   * Update widget state
   */
  private updateWidget(widgetId: string, state: any): void {
    if (!this.state.widgets[widgetId]) {
      const widget = this.widgets.get(widgetId);
      if (widget) {
        this.state.widgets[widgetId] = {
          type: widget.type,
          state: state,
        };
      }
    } else {
      this.state.widgets[widgetId].state = state;
    }
  }

  /**
   * Update preferences
   */
  private updatePreferences(preferences: any): void {
    this.state.preferences = {
      ...this.state.preferences,
      ...preferences,
    };
  }

  /**
   * Update recent workspaces list
   */
  private updateRecentWorkspaces(workspace: any): void {
    const recent = this.state.workspace.recent;
    
    // Remove if already exists
    const existingIndex = recent.findIndex(r => 
      r.workspace.folders.map(f => f.path).join('|') === 
      workspace.folders.map((f: any) => f.path).join('|')
    );
    
    if (existingIndex >= 0) {
      recent.splice(existingIndex, 1);
    }
    
    // Add to beginning
    recent.unshift({
      workspace,
      lastOpened: Date.now(),
    });
    
    // Keep only last 10
    if (recent.length > 10) {
      recent.length = 10;
    }
  }

  /**
   * Broadcast state changes to all windows
   */
  private broadcastToWindows(channel: string, data: any): void {
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
  }

  /**
   * Get current state
   */
  getState(): ApplicationState {
    return this.state;
  }

  /**
   * Force save to disk
   */
  forceSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    try {
      this.store.set('state', this.state);
      console.log('State force-saved to disk');
    } catch (error) {
      console.error('Failed to force save state:', error);
    }
  }

  /**
   * Clean up on app quit
   */
  cleanup(): void {
    this.forceSave();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

// Create singleton instance
let stateManager: StateManager | null = null;

export function getStateManager(): StateManager {
  if (!stateManager) {
    stateManager = new StateManager();
  }
  return stateManager;
}

export function initializeStateManager(): void {
  getStateManager();
}