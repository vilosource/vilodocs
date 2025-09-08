import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { Shell } from '../components/layout/Shell';
import { EditorGrid } from '../components/editor/EditorGrid';
import { layoutReducer, createInitialState } from '../state/layoutReducer';
import { DragDropManager } from '../dnd/DragDropManager';
import { CommandManager } from '../commands/CommandManager';
import { FocusManager } from '../focus/FocusManager';
import { generateUniqueId, generateFileTabId } from '../utils/id-generator';
import { useLayoutState } from './hooks/useStateService';
import { stateService } from './services/StateService';
import WidgetRegistryService from '../services/WidgetRegistry';
import { FocusOverlay } from '../components/widgets/FocusOverlay';
import './App.css';

// Create singleton instances
const dragDropManager = new DragDropManager();

export const App: React.FC = () => {
  const { layout, updateLayout, isLoading } = useLayoutState();
  const [state, dispatch] = useReducer(layoutReducer, createInitialState());
  const [commandManager] = useState(() => new CommandManager(dispatch));
  const [focusManager] = useState(() => new FocusManager());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load saved editor grid state on mount
  useEffect(() => {
    if (!isLoading && layout.editorGrid && !hasInitialized) {
      dispatch({
        type: 'RESTORE_LAYOUT',
        payload: layout.editorGrid
      });
      setHasInitialized(true);
    }
  }, [isLoading, layout.editorGrid, hasInitialized]);

  // Save editor grid state when it changes
  useEffect(() => {
    if (hasInitialized && state.root) {
      const saveState = async () => {
        await updateLayout({
          editorGrid: state.root,
          lastFocused: {
            region: 'editorGrid',
            leafId: state.activeLeafId
          }
        });
      };
      
      // Debounce saves
      const timeout = setTimeout(saveState, 500);
      return () => clearTimeout(timeout);
    }
  }, [state, hasInitialized, updateLayout]);

  // Handle commands from Shell
  const handleCommand = (commandId: string, context: any) => {
    if (commandId === 'layout.action') {
      dispatch(context);
    }
  };

  // Handle file opening from explorer
  const handleFileOpen = useCallback((filePath: string, content: string) => {
    const fileName = filePath.split('/').pop() || 'Untitled';
    const leafId = state.activeLeafId || state.root.id;
    
    // Use Widget Registry to determine appropriate widget
    const registry = WidgetRegistryService.getInstance();
    const widgetType = registry.getWidgetForFile(filePath);
    
    // Check if file is already open
    const existingTab = Array.from(state.leafMap.values())
      .flatMap(leaf => leaf.tabs)
      .find(tab => tab.filePath === filePath);
    
    if (existingTab) {
      // Switch to existing tab
      const leaf = Array.from(state.leafMap.values())
        .find(l => l.tabs.some(t => t.id === existingTab.id));
      
      if (leaf) {
        dispatch({
          type: 'FOCUS_LEAF',
          payload: { leafId: leaf.id }
        });
        dispatch({
          type: 'ACTIVATE_TAB',
          payload: { leafId: leaf.id, tabId: existingTab.id }
        });
      }
    } else {
      // Create new tab with appropriate widget type
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

  // Get file icon based on extension
  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return '📘';
      case 'js':
      case 'jsx':
        return '📙';
      case 'css':
      case 'scss':
      case 'less':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  // Get the focused tab for the focus overlay
  const getFocusedTab = () => {
    if (!state.focusMode.active || !state.focusMode.tabId) {
      return null;
    }
    
    // Find the tab in any leaf
    for (const leaf of state.leafMap.values()) {
      const tab = leaf.tabs.find(t => t.id === state.focusMode.tabId);
      if (tab) {
        return tab;
      }
    }
    
    return null;
  };

  const focusedTab = getFocusedTab();

  // Handle focus mode close
  const handleCloseFocusMode = useCallback(() => {
    dispatch({ type: 'EXIT_FOCUS_MODE' });
  }, [dispatch]);

  // Add welcome tab if empty
  useEffect(() => {
    if (!isLoading && state.root.tabs?.length === 0) {
      dispatch({
        type: 'ADD_TAB',
        payload: {
          leafId: state.root.id,
          tab: {
            id: 'welcome',
            title: 'Welcome',
            icon: '📄',
            closeable: true,
            widget: { type: 'welcome', props: {} }
          }
        }
      });
    }
  }, [isLoading, state.root]);

  // Register file operations with command manager
  useEffect(() => {
    if (!commandManager) return;

    // Clear storage command (development) - now clears electron-store
    commandManager.registerCommand({
      id: 'dev.clearStorage',
      label: 'Clear Application State (Dev)',
      keybinding: 'Ctrl+Shift+Alt+C',
      execute: async () => {
        if (confirm('Clear all application state? This will reset the application.')) {
          await window.api.saveState(null); // Clear state
          window.location.reload();
        }
      }
    });

    // Open file command
    commandManager.registerCommand({
      id: 'file.open',
      label: 'Open File',
      keybinding: 'Ctrl+O',
      execute: async () => {
        try {
          const file = await window.api.openFile();
          if (file) {
            const leafId = state.activeLeafId || state.root.id;
            const registry = WidgetRegistryService.getInstance();
            const widgetType = registry.getWidgetForFile(file.path);
            
            dispatch({
              type: 'ADD_TAB',
              payload: {
                leafId,
                tab: {
                  id: generateFileTabId(file.path),
                  title: file.path.split('/').pop() || 'Untitled',
                  icon: getFileIcon(file.path.split('/').pop() || ''),
                  closeable: true,
                  dirty: false,
                  filePath: file.path,
                  widget: {
                    type: widgetType,
                    props: { content: file.content, filePath: file.path }
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Failed to open file:', error);
        }
      }
    });

    // Save file command
    commandManager.registerCommand({
      id: 'file.save',
      label: 'Save File',
      keybinding: 'Ctrl+S',
      execute: async () => {
        // Get active tab content
        const activeLeaf = state.leafMap.get(state.activeLeafId);
        if (activeLeaf && activeLeaf.activeTabId) {
          const activeTab = activeLeaf.tabs.find(t => t.id === activeLeaf.activeTabId);
          if (activeTab && activeTab.content) {
            try {
              await window.api.saveFile({ content: activeTab.content });
              // Mark tab as not dirty
              // This would require a new action type
            } catch (error) {
              console.error('Failed to save file:', error);
            }
          }
        }
      }
    });
  }, [commandManager, state, dispatch]);

  // Get all opened tabs from state
  const getOpenedTabs = useCallback(() => {
    const openedTabs: Array<{ id: string; title: string; filePath?: string }> = [];
    
    // Collect all tabs from all leaves
    for (const leaf of state.leafMap.values()) {
      leaf.tabs.forEach(tab => {
        if (tab.filePath) {
          openedTabs.push({
            id: tab.id,
            title: tab.title,
            filePath: tab.filePath
          });
        }
      });
    }
    
    return openedTabs;
  }, [state.leafMap]);

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Shell 
        onCommand={handleCommand}
        onOpenFile={handleFileOpen}
        openedTabs={getOpenedTabs()}
        activeLeafId={state.activeLeafId}
        commandManager={commandManager}
      >
        <EditorGrid 
          state={state} 
          dispatch={dispatch}
          commandManager={commandManager}
          focusManager={focusManager}
        />
      </Shell>
      
      {focusedTab && (
        <FocusOverlay
          tab={focusedTab}
          visible={state.focusMode.active}
          onClose={handleCloseFocusMode}
          onContentChange={(tabId, content) => {
            // Handle content changes - find the leaf and update the tab
            for (const leaf of state.leafMap.values()) {
              const tabIndex = leaf.tabs.findIndex(t => t.id === tabId);
              if (tabIndex !== -1) {
                // Update the tab's content
                dispatch({
                  type: 'UPDATE_TAB_CONTENT',
                  payload: { tabId, content }
                });
                break;
              }
            }
          }}
          onDirtyChange={(tabId, isDirty) => {
            dispatch({
              type: 'UPDATE_TAB_DIRTY',
              payload: { tabId, dirty: isDirty }
            });
          }}
          onSwitchWidget={(tabId, newWidgetType) => {
            dispatch({
              type: 'SWITCH_TAB_WIDGET',
              payload: { tabId, widgetType: newWidgetType }
            });
          }}
        />
      )}
    </div>
  );
};

export default App;