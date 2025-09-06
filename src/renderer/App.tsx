import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { Shell } from '../components/layout/Shell';
import { EditorGrid } from '../components/editor/EditorGrid';
import { layoutReducer, createInitialState } from '../state/layoutReducer';
import { DragDropManager } from '../dnd/DragDropManager';
import { LayoutPersistence } from '../layout/persistence-browser';
import { CommandManager } from '../commands/CommandManager';
import { FocusManager } from '../focus/FocusManager';
import './App.css';

// Create singleton instances
const dragDropManager = new DragDropManager();
const persistence = new LayoutPersistence();

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(layoutReducer, createInitialState());
  const [commandManager] = useState(() => new CommandManager(dispatch));
  const [focusManager] = useState(() => new FocusManager());
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted state on mount
  useEffect(() => {
    persistence.load().then(layout => {
      if (layout && layout.editorGrid) {
        dispatch({
          type: 'RESTORE_LAYOUT',
          payload: layout.editorGrid
        });
      }
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to load layout:', err);
      setIsLoading(false);
    });
  }, []);

  // Save state changes
  useEffect(() => {
    if (!isLoading) {
      const saveLayout = async () => {
        try {
          await persistence.save({
            version: 1,
            editorGrid: state.root,
            regions: {
              activityBar: { visible: true },
              primarySideBar: { visible: true, width: 240 },
              secondarySideBar: { visible: false, width: 240 },
              panel: { visible: true, position: 'bottom', height: 200 },
              statusBar: { visible: true }
            },
            lastFocused: {
              region: 'editorGrid',
              leafId: state.activeLeafId
            }
          });
        } catch (err) {
          console.error('Failed to save layout:', err);
        }
      };

      // Debounce saves
      const timeout = setTimeout(saveLayout, 500);
      return () => clearTimeout(timeout);
    }
  }, [state, isLoading]);

  // Handle commands from Shell
  const handleCommand = (commandId: string, context: any) => {
    if (commandId === 'layout.action') {
      dispatch(context);
    }
  };

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
            content: 'Welcome to vilodocs!',
            icon: '📄',
            closeable: true
          }
        }
      });
    }
  }, [isLoading, state.root]);

  // Register file operations with command manager
  useEffect(() => {
    if (!commandManager) return;

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
            dispatch({
              type: 'ADD_TAB',
              payload: {
                leafId,
                tab: {
                  id: `file-${Date.now()}`,
                  title: file.name || 'Untitled',
                  content: file.content,
                  icon: '📄',
                  closeable: true,
                  dirty: false
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

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Shell onCommand={handleCommand}>
        <EditorGrid 
          state={state} 
          dispatch={dispatch}
          commandManager={commandManager}
          focusManager={focusManager}
        />
      </Shell>
    </div>
  );
};

export default App;