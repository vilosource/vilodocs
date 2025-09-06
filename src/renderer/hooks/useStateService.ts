/**
 * React hooks for using the StateService
 * These hooks bridge the service layer with React components
 */

import { useState, useEffect, useCallback } from 'react';
import { stateService } from '../services/StateService';
import { WorkspaceState, LayoutState } from '../../common/state-types';

/**
 * Hook to use workspace state from StateService
 */
export function useWorkspaceState() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(stateService.getWorkspace());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for service initialization
    stateService.waitForInit().then(() => {
      setWorkspace(stateService.getWorkspace());
      setIsLoading(false);
    });

    // Subscribe to workspace changes
    const unsubscribe = stateService.subscribe('workspaceChanged', (newWorkspace: WorkspaceState) => {
      setWorkspace(newWorkspace);
    });

    return unsubscribe;
  }, []);

  const updateWorkspace = useCallback(async (updates: Partial<WorkspaceState>) => {
    await stateService.updateWorkspace(updates);
  }, []);

  const getExpandedFolders = useCallback(() => {
    return stateService.getExpandedFolders();
  }, []);

  const setExpandedFolders = useCallback(async (folders: string[]) => {
    await stateService.setExpandedFolders(folders);
  }, []);

  return {
    workspace,
    isLoading,
    updateWorkspace,
    getExpandedFolders,
    setExpandedFolders,
  };
}

/**
 * Hook to use layout state from StateService
 */
export function useLayoutState() {
  const [layout, setLayout] = useState<LayoutState>(stateService.getLayout());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for service initialization
    stateService.waitForInit().then(() => {
      setLayout(stateService.getLayout());
      setIsLoading(false);
    });

    // Subscribe to layout changes
    const unsubscribe = stateService.subscribe('layoutChanged', (newLayout: LayoutState) => {
      setLayout(newLayout);
    });

    return unsubscribe;
  }, []);

  const updateLayout = useCallback(async (updates: Partial<LayoutState>) => {
    await stateService.updateLayout(updates);
  }, []);

  return {
    layout,
    isLoading,
    updateLayout,
  };
}

/**
 * Hook to use widget state from StateService
 */
export function useWidgetState(widgetId: string) {
  const [state, setState] = useState(stateService.getWidgetState(widgetId));

  useEffect(() => {
    // Wait for service initialization
    stateService.waitForInit().then(() => {
      setState(stateService.getWidgetState(widgetId));
    });

    // Subscribe to widget changes
    const unsubscribe = stateService.subscribe('widgetChanged', (changedWidgetId: string, newState: any) => {
      if (changedWidgetId === widgetId) {
        setState(newState);
      }
    });

    return unsubscribe;
  }, [widgetId]);

  const updateState = useCallback(async (newState: any) => {
    await stateService.updateWidget(widgetId, newState);
  }, [widgetId]);

  return [state, updateState] as const;
}

/**
 * Hook to get the full application state
 */
export function useApplicationState() {
  const [state, setState] = useState(stateService.getState());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for service initialization
    stateService.waitForInit().then(() => {
      setState(stateService.getState());
      setIsLoading(false);
    });

    // Subscribe to all state changes
    const unsubscribes = [
      stateService.subscribe('stateChanged', (newState) => setState(newState)),
      stateService.subscribe('workspaceChanged', () => setState(stateService.getState())),
      stateService.subscribe('layoutChanged', () => setState(stateService.getState())),
      stateService.subscribe('widgetChanged', () => setState(stateService.getState())),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return {
    state,
    isLoading,
  };
}