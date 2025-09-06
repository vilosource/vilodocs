import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { Shell } from '../components/layout/Shell';
import { EditorGrid } from '../components/editor/EditorGrid';
import { layoutReducer, createInitialState } from '../state/layoutReducer';
import { DragDropManager } from '../dnd/DragDropManager';
import { CommandManager } from '../commands/CommandManager';
import { FocusManager } from '../focus/FocusManager';
import { generateUniqueId, generateFileTabId } from '../utils/id-generator';
import './App.css';

// Create singleton instances
const dragDropManager = new DragDropManager();

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(layoutReducer, createInitialState());
  const [commandManager] = useState(() => new CommandManager(dispatch));
  const [focusManager] = useState(() => new FocusManager());
  const [isLoading, setIsLoading] = useState(false);

  // The state loading and saving is now handled by StateProvider
  useEffect(() => {
    setIsLoading(false);
  }, []);

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
      // Create new tab with unique ID
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
              type: 'text-editor',
              props: { content }
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
                    type: 'text-editor',
                    props: { content: file.content }
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

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Shell 
        onCommand={handleCommand}
        onOpenFile={handleFileOpen}
      >
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