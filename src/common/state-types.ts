/**
 * Centralized state type definitions for the application
 */

import { Workspace, FileNode } from './ipc';
import { LayoutNode } from '../layout/types';

/**
 * Root application state
 */
export interface ApplicationState {
  version: number;
  workspace: WorkspaceState;
  layout: LayoutState;
  widgets: WidgetStates;
  preferences: UserPreferences;
}

/**
 * Workspace-related state
 */
export interface WorkspaceState {
  current: Workspace | null;
  recent: RecentWorkspace[];
  expandedFolders: Record<string, string[]>; // workspace id -> expanded paths
  selectedPath: string | null;
}

export interface RecentWorkspace {
  workspace: Workspace;
  lastOpened: number;
  pinned?: boolean;
}

/**
 * Layout and UI state
 */
export interface LayoutState {
  editorGrid: LayoutNode;
  regions: {
    activityBar: {
      visible: boolean;
      selectedViewlet?: string;
    };
    primarySideBar: {
      visible: boolean;
      width: number;
      activeView: string;
    };
    secondarySideBar: {
      visible: boolean;
      width: number;
      activeView?: string;
    };
    panel: {
      visible: boolean;
      position: 'bottom' | 'right';
      height: number;
      activePanel?: string;
    };
    statusBar: {
      visible: boolean;
    };
  };
  lastFocused: {
    region: string;
    leafId?: string;
    tabId?: string;
  };
}

/**
 * Widget-specific states
 */
export interface WidgetStates {
  [widgetId: string]: {
    type: string;
    state: any; // Widget-specific state
  };
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  fontSize?: number;
  autoSave?: boolean;
  autoSaveDelay?: number;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  [key: string]: any;
}

/**
 * Widget registration
 */
export interface WidgetRegistration {
  id: string;
  type: string;
  defaultState: any;
  stateReducer?: (state: any, action: any) => any;
  persistKeys?: string[]; // Specific keys to persist
}

/**
 * State update actions
 */
export interface StateUpdateAction {
  type: 'workspace' | 'layout' | 'widget' | 'preferences';
  payload: any;
  widgetId?: string;
}

/**
 * Default application state
 */
export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  version: 1,
  workspace: {
    current: null,
    recent: [],
    expandedFolders: {},
    selectedPath: null,
  },
  layout: {
    editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
    regions: {
      activityBar: {
        visible: true,
        selectedViewlet: 'explorer',
      },
      primarySideBar: {
        visible: true,
        width: 240,
        activeView: 'explorer',
      },
      secondarySideBar: {
        visible: false,
        width: 240,
      },
      panel: {
        visible: true,
        position: 'bottom',
        height: 200,
      },
      statusBar: {
        visible: true,
      },
    },
    lastFocused: {
      region: 'editorGrid',
    },
  },
  widgets: {},
  preferences: {
    theme: 'dark',
    fontSize: 14,
    autoSave: false,
    autoSaveDelay: 1000,
    tabSize: 2,
    wordWrap: false,
    minimap: true,
  },
};

/**
 * Helper to get workspace ID
 */
export function getWorkspaceId(workspace: Workspace): string {
  // Use the first folder path as the key (or combine all for multi-root)
  const folderPaths = workspace.folders.map(f => f.path).join('|');
  // Create a simple hash of the paths
  let hash = 0;
  for (let i = 0; i < folderPaths.length; i++) {
    const char = folderPaths.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `workspace-${Math.abs(hash)}`;
}