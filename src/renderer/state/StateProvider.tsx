/**
 * Global state provider for the renderer process
 * Manages state synchronization with the main process
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  ApplicationState,
  DEFAULT_APPLICATION_STATE,
  StateUpdateAction,
  WorkspaceState,
  LayoutState,
  WidgetRegistration,
  getWorkspaceId,
} from '../../common/state-types';

interface StateContextValue {
  state: ApplicationState;
  isLoading: boolean;
  error: Error | null;
  
  // State update methods
  updateWorkspace: (workspace: Partial<WorkspaceState>) => Promise<void>;
  updateLayout: (layout: Partial<LayoutState>) => Promise<void>;
  updateWidget: (widgetId: string, state: any) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  
  // Widget management
  registerWidget: (widget: WidgetRegistration) => Promise<void>;
  getWidgetState: (widgetId: string) => any;
  
  // Utility methods
  getExpandedFolders: () => string[];
  setExpandedFolders: (folders: string[]) => Promise<void>;
}

const StateContext = createContext<StateContextValue | null>(null);

interface StateProviderProps {
  children: React.ReactNode;
}

export const StateProvider: React.FC<StateProviderProps> = ({ children }) => {
  const [state, setState] = useState<ApplicationState>(DEFAULT_APPLICATION_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track pending updates to avoid conflicts
  const pendingUpdates = useRef<Set<string>>(new Set());
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Load initial state from main process
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        const loadedState = await window.api.loadState();
        setState(loadedState);
        console.log('State loaded from main process:', loadedState);
      } catch (err) {
        console.error('Failed to load state:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialState();
  }, []);
  
  // Listen for state changes from main process
  useEffect(() => {
    const unsubscribe = window.api.onStateChanged((newState) => {
      console.log('State changed from main process:', newState);
      setState(newState);
    });
    
    return unsubscribe;
  }, []);
  
  // Generic state update method
  const updateStateSection = useCallback(async (
    type: StateUpdateAction['type'],
    payload: any,
    widgetId?: string
  ) => {
    const updateId = `${type}-${Date.now()}`;
    pendingUpdates.current.add(updateId);
    
    try {
      const action: StateUpdateAction = { type, payload, widgetId };
      await window.api.updateState(action);
      
      // Update local state optimistically
      setState(prevState => {
        const newState = { ...prevState };
        
        switch (type) {
          case 'workspace':
            newState.workspace = { ...newState.workspace, ...payload };
            break;
          case 'layout':
            newState.layout = { ...newState.layout, ...payload };
            break;
          case 'widget':
            if (widgetId) {
              if (!newState.widgets[widgetId]) {
                newState.widgets[widgetId] = { type: 'unknown', state: payload };
              } else {
                newState.widgets[widgetId].state = payload;
              }
            }
            break;
          case 'preferences':
            newState.preferences = { ...newState.preferences, ...payload };
            break;
        }
        
        return newState;
      });
    } catch (err) {
      console.error(`Failed to update ${type}:`, err);
      setError(err as Error);
      throw err;
    } finally {
      pendingUpdates.current.delete(updateId);
    }
  }, []);
  
  // Specific update methods
  const updateWorkspace = useCallback(async (workspace: Partial<WorkspaceState>) => {
    await updateStateSection('workspace', workspace);
  }, [updateStateSection]);
  
  const updateLayout = useCallback(async (layout: Partial<LayoutState>) => {
    await updateStateSection('layout', layout);
  }, [updateStateSection]);
  
  const updateWidget = useCallback(async (widgetId: string, widgetState: any) => {
    await updateStateSection('widget', widgetState, widgetId);
  }, [updateStateSection]);
  
  const updatePreferences = useCallback(async (preferences: any) => {
    await updateStateSection('preferences', preferences);
  }, [updateStateSection]);
  
  // Widget management
  const registerWidget = useCallback(async (widget: WidgetRegistration) => {
    try {
      await window.api.registerWidget(widget);
      
      // Initialize widget state if not present
      setState(prevState => {
        if (!prevState.widgets[widget.id]) {
          const newState = { ...prevState };
          newState.widgets[widget.id] = {
            type: widget.type,
            state: widget.defaultState,
          };
          return newState;
        }
        return prevState;
      });
    } catch (err) {
      console.error('Failed to register widget:', err);
      setError(err as Error);
      throw err;
    }
  }, []);
  
  const getWidgetState = useCallback((widgetId: string) => {
    return state.widgets[widgetId]?.state || null;
  }, [state.widgets]);
  
  // Utility methods for workspace-specific state
  const getExpandedFolders = useCallback(() => {
    if (!state.workspace.current) return [];
    const workspaceId = getWorkspaceId(state.workspace.current);
    return state.workspace.expandedFolders[workspaceId] || [];
  }, [state.workspace]);
  
  const setExpandedFolders = useCallback(async (folders: string[]) => {
    if (!state.workspace.current) return;
    
    const workspaceId = getWorkspaceId(state.workspace.current);
    const newExpandedFolders = {
      ...state.workspace.expandedFolders,
      [workspaceId]: folders,
    };
    
    await updateWorkspace({ expandedFolders: newExpandedFolders });
  }, [state.workspace.current, state.workspace.expandedFolders, updateWorkspace]);
  
  const contextValue: StateContextValue = {
    state,
    isLoading,
    error,
    updateWorkspace,
    updateLayout,
    updateWidget,
    updatePreferences,
    registerWidget,
    getWidgetState,
    getExpandedFolders,
    setExpandedFolders,
  };
  
  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};

// Custom hook to use the state context
export function useApplicationState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useApplicationState must be used within StateProvider');
  }
  return context;
}

// Convenience hooks for specific state sections
export function useWorkspaceState() {
  const { state, updateWorkspace, getExpandedFolders, setExpandedFolders } = useApplicationState();
  return {
    workspace: state.workspace,
    updateWorkspace,
    getExpandedFolders,
    setExpandedFolders,
  };
}

export function useLayoutState() {
  const { state, updateLayout } = useApplicationState();
  return {
    layout: state.layout,
    updateLayout,
  };
}

export function useWidgetState(widgetId: string) {
  const { getWidgetState, updateWidget } = useApplicationState();
  const state = getWidgetState(widgetId);
  
  const setState = useCallback(async (newState: any) => {
    await updateWidget(widgetId, newState);
  }, [widgetId, updateWidget]);
  
  return [state, setState] as const;
}

export function usePreferences() {
  const { state, updatePreferences } = useApplicationState();
  return {
    preferences: state.preferences,
    updatePreferences,
  };
}