/**
 * StateService - Singleton service for managing application state in the renderer process
 * Following VSCode's service-oriented architecture pattern
 * 
 * This service manages state outside of React to avoid circular dependencies
 * and communicates with the main process via IPC.
 */

import { EventEmitter } from 'events';
import {
  ApplicationState,
  DEFAULT_APPLICATION_STATE,
  StateUpdateAction,
  WorkspaceState,
  LayoutState,
  WidgetRegistration,
  getWorkspaceId,
} from '../../common/state-types';

class StateService extends EventEmitter {
  private static instance: StateService;
  private state: ApplicationState = DEFAULT_APPLICATION_STATE;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    super();
    this.initialize();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService();
    }
    return StateService.instance;
  }

  /**
   * Initialize the service by loading state from main process
   */
  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('StateService: Initializing...');
      
      // Load initial state from main process
      const loadedState = await window.api.loadState();
      this.state = loadedState;
      console.log('StateService: Loaded initial state:', loadedState);
      
      // Listen for state changes from main process
      window.api.onStateChanged((newState) => {
        console.log('StateService: State changed from main process');
        this.state = newState;
        this.emit('stateChanged', newState);
      });
      
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('StateService: Failed to initialize:', error);
      this.state = DEFAULT_APPLICATION_STATE;
      this.isInitialized = true;
    }
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    
    return new Promise((resolve) => {
      this.once('initialized', resolve);
    });
  }

  /**
   * Get the current state
   */
  getState(): ApplicationState {
    return this.state;
  }

  /**
   * Get workspace state
   */
  getWorkspace(): WorkspaceState {
    return this.state.workspace;
  }

  /**
   * Get layout state
   */
  getLayout(): LayoutState {
    return this.state.layout;
  }

  /**
   * Update workspace state
   */
  async updateWorkspace(workspace: Partial<WorkspaceState>): Promise<void> {
    const action: StateUpdateAction = {
      type: 'workspace',
      payload: workspace,
    };
    
    await window.api.updateState(action);
    
    // Optimistically update local state
    this.state.workspace = { ...this.state.workspace, ...workspace };
    this.emit('workspaceChanged', this.state.workspace);
  }

  /**
   * Update layout state
   */
  async updateLayout(layout: Partial<LayoutState>): Promise<void> {
    const action: StateUpdateAction = {
      type: 'layout',
      payload: layout,
    };
    
    await window.api.updateState(action);
    
    // Optimistically update local state
    this.state.layout = { ...this.state.layout, ...layout };
    this.emit('layoutChanged', this.state.layout);
  }

  /**
   * Update widget state
   */
  async updateWidget(widgetId: string, widgetState: any): Promise<void> {
    const action: StateUpdateAction = {
      type: 'widget',
      payload: widgetState,
      widgetId,
    };
    
    await window.api.updateState(action);
    
    // Optimistically update local state
    if (!this.state.widgets[widgetId]) {
      this.state.widgets[widgetId] = { type: 'unknown', state: widgetState };
    } else {
      this.state.widgets[widgetId].state = widgetState;
    }
    this.emit('widgetChanged', widgetId, widgetState);
  }

  /**
   * Register a widget
   */
  async registerWidget(widget: WidgetRegistration): Promise<void> {
    await window.api.registerWidget(widget);
    
    // Initialize widget state if not present
    if (!this.state.widgets[widget.id]) {
      this.state.widgets[widget.id] = {
        type: widget.type,
        state: widget.defaultState,
      };
    }
  }

  /**
   * Get widget state
   */
  getWidgetState(widgetId: string): any {
    return this.state.widgets[widgetId]?.state || null;
  }

  /**
   * Get expanded folders for current workspace
   */
  getExpandedFolders(): string[] {
    if (!this.state.workspace.current) return [];
    const workspaceId = getWorkspaceId(this.state.workspace.current);
    return this.state.workspace.expandedFolders[workspaceId] || [];
  }

  /**
   * Set expanded folders for current workspace
   */
  async setExpandedFolders(folders: string[]): Promise<void> {
    if (!this.state.workspace.current) return;
    
    const workspaceId = getWorkspaceId(this.state.workspace.current);
    const newExpandedFolders = {
      ...this.state.workspace.expandedFolders,
      [workspaceId]: folders,
    };
    
    await this.updateWorkspace({ expandedFolders: newExpandedFolders });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(event: string, callback: (...args: any[]) => void): () => void {
    this.on(event, callback);
    return () => this.off(event, callback);
  }
}

// Export singleton instance
export const stateService = StateService.getInstance();