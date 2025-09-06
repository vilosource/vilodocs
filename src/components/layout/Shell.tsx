import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityBar, ActivityBarItem } from './ActivityBar';
import { SideBar } from './SideBar';
import { Panel } from './Panel';
import { StatusBar } from './StatusBar';
import { FileExplorer } from '../explorer/FileExplorer';
import { RegionManager } from '../../layout/regions';
import { CommandManager } from '../../commands/CommandManager';
import { FocusManager } from '../../focus/FocusManager';
import { Workspace } from '../../common/ipc';
import { useApplicationState, useLayoutState, useWorkspaceState } from '../../renderer/state/StateProvider';
import './Shell.css';

interface ShellProps {
  children?: React.ReactNode; // Editor Grid will go here
  onCommand?: (commandId: string, context?: any) => void;
  onOpenFile?: (path: string, content: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ children, onCommand, onOpenFile }) => {
  const { state, isLoading } = useApplicationState();
  const { layout, updateLayout } = useLayoutState();
  const { workspace, updateWorkspace } = useWorkspaceState();
  
  const [regionManager] = useState(() => {
    const manager = new RegionManager();
    
    // Initialize with state from global state
    if (layout.regions) {
      manager.setRegionState('activityBar', { visible: layout.regions.activityBar.visible });
      manager.setRegionState('primarySideBar', layout.regions.primarySideBar);
      manager.setRegionState('secondarySideBar', layout.regions.secondarySideBar);
      manager.setRegionState('panel', layout.regions.panel);
      manager.setRegionState('statusBar', layout.regions.statusBar);
    }
    
    return manager;
  });
  
  const [regions, setRegions] = useState(regionManager.getState());
  const [activeView, setActiveView] = useState(layout.regions.primarySideBar.activeView || 'explorer');
  
  const commandManagerRef = useRef<CommandManager | null>(null);
  const focusManagerRef = useRef<FocusManager | null>(null);

  // Update regions when manager state changes
  const updateRegions = useCallback(async () => {
    const newState = regionManager.getState();
    setRegions(newState);
    
    // Update global state
    await updateLayout({
      regions: {
        activityBar: { 
          visible: newState.activityBar.visible,
          selectedViewlet: activeView
        },
        primarySideBar: { 
          visible: newState.primarySideBar.visible, 
          width: newState.primarySideBar.width,
          activeView: activeView
        },
        secondarySideBar: { 
          visible: newState.secondarySideBar.visible, 
          width: newState.secondarySideBar.width 
        },
        panel: { 
          visible: newState.panel.visible, 
          position: newState.panel.position, 
          height: newState.panel.height 
        },
        statusBar: { visible: newState.statusBar.visible }
      }
    });
  }, [updateLayout, activeView]);

  // Initialize command and focus managers
  useEffect(() => {
    if (!commandManagerRef.current) {
      commandManagerRef.current = new CommandManager((action) => {
        // Pass layout actions to parent or handle internally
        if (onCommand) {
          onCommand('layout.action', action);
        }
      });
    }

    if (!focusManagerRef.current) {
      focusManagerRef.current = new FocusManager();
    }

    // Register shell-specific commands
    const cmdManager = commandManagerRef.current;
    
    cmdManager.registerCommand({
      id: 'view.toggleSideBar',
      label: 'Toggle Side Bar',
      keybinding: 'Ctrl+B',
      execute: () => {
        regionManager.toggleRegion('primarySideBar');
        updateRegions();
      }
    });

    cmdManager.registerCommand({
      id: 'view.togglePanel',
      label: 'Toggle Panel',
      keybinding: 'Ctrl+J',
      execute: () => {
        regionManager.toggleRegion('panel');
        updateRegions();
      }
    });

    // Workspace commands
    cmdManager.registerCommand({
      id: 'workbench.action.files.openFolder',
      label: 'Open Folder',
      keybinding: 'Ctrl+K Ctrl+O',
      execute: async () => {
        const newWorkspace = await window.api.openFolder();
        if (newWorkspace) {
          await updateWorkspace({
            current: newWorkspace
          });
        }
      }
    });

    cmdManager.registerCommand({
      id: 'workbench.action.files.openWorkspace',
      label: 'Open Workspace',
      execute: async () => {
        const newWorkspace = await window.api.openWorkspace();
        if (newWorkspace) {
          await updateWorkspace({
            current: newWorkspace
          });
        }
      }
    });

    cmdManager.registerCommand({
      id: 'workbench.action.closeFolder',
      label: 'Close Folder',
      execute: async () => {
        await updateWorkspace({
          current: null
        });
      }
    });
  }, [onCommand, updateRegions, updateWorkspace]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandManagerRef.current) {
        commandManagerRef.current.handleKeyboard(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Activity bar items
  const activityItems: ActivityBarItem[] = [
    { id: 'explorer', icon: '📁', tooltip: 'Explorer', active: activeView === 'explorer' },
    { id: 'search', icon: '🔍', tooltip: 'Search', active: activeView === 'search' },
    { id: 'source-control', icon: '🌿', tooltip: 'Source Control', active: activeView === 'source-control' },
    { id: 'debug', icon: '🐛', tooltip: 'Run and Debug', active: activeView === 'debug' },
    { id: 'extensions', icon: '🧩', tooltip: 'Extensions', active: activeView === 'extensions' },
  ];

  const handleActivityClick = (id: string) => {
    setActiveView(id);
    if (!regions.primarySideBar.visible) {
      regionManager.toggleRegion('primarySideBar');
      updateRegions();
    }
  };

  const handleSideBarClose = () => {
    regionManager.toggleRegion('primarySideBar');
    updateRegions();
  };

  const handleSideBarResize = (side: 'primarySideBar' | 'secondarySideBar', width: number) => {
    regionManager.resizeRegion(side, width);
    updateRegions();
  };

  const handlePanelResize = (height: number) => {
    regionManager.resizeRegion('panel', height);
    updateRegions();
  };

  const handlePanelClose = () => {
    regionManager.toggleRegion('panel');
    updateRegions();
  };

  const handleWorkspaceChange = useCallback(async (newWorkspace: Workspace | null) => {
    await updateWorkspace({
      current: newWorkspace
    });
  }, [updateWorkspace]);

  const handleFileOpen = useCallback((path: string, content: string) => {
    onOpenFile?.(path, content);
  }, [onOpenFile]);

  // Don't render until state is loaded
  if (isLoading) {
    return <div className="shell-loading">Loading...</div>;
  }

  return (
    <div className="shell">
      <div className="shell-main">
        <ActivityBar
          items={activityItems}
          onItemClick={handleActivityClick}
          visible={regions.activityBar.visible}
        />
        
        <SideBar
          position="left"
          visible={regions.primarySideBar.visible}
          width={regions.primarySideBar.width}
          onClose={handleSideBarClose}
          onResize={(width) => handleSideBarResize('primarySideBar', width)}
          title={activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}
        >
          <div className="sidebar-view-content">
            {activeView === 'explorer' && (
              <FileExplorer
                workspace={workspace.current}
                onOpenFile={handleFileOpen}
                onWorkspaceChange={handleWorkspaceChange}
              />
            )}
            {activeView === 'search' && (
              <div className="sidebar-placeholder">Search functionality coming soon...</div>
            )}
            {activeView === 'source-control' && (
              <div className="sidebar-placeholder">Source Control coming soon...</div>
            )}
            {activeView === 'debug' && (
              <div className="sidebar-placeholder">Debug functionality coming soon...</div>
            )}
            {activeView === 'extensions' && (
              <div className="sidebar-placeholder">Extensions coming soon...</div>
            )}
          </div>
        </SideBar>
        
        <div className="shell-content">
          <div className="shell-editor-area">
            {children}
          </div>
          
          <Panel
            visible={regions.panel.visible}
            position={regions.panel.position}
            height={regions.panel.height}
            onClose={handlePanelClose}
            onResize={handlePanelResize}
          >
            <div className="panel-content">
              <div className="panel-tabs">
                <div className="panel-tab active">Terminal</div>
                <div className="panel-tab">Problems</div>
                <div className="panel-tab">Output</div>
                <div className="panel-tab">Debug Console</div>
              </div>
              <div className="panel-body">
                Terminal functionality coming soon...
              </div>
            </div>
          </Panel>
        </div>
        
        <SideBar
          position="right"
          visible={regions.secondarySideBar.visible}
          width={regions.secondarySideBar.width}
          onClose={() => {
            regionManager.toggleRegion('secondarySideBar');
            updateRegions();
          }}
          onResize={(width) => handleSideBarResize('secondarySideBar', width)}
          title="Secondary Side Bar"
        >
          <div className="sidebar-placeholder">Secondary sidebar content...</div>
        </SideBar>
      </div>
      
      <StatusBar 
        visible={regions.statusBar.visible}
        items={[
          { id: 'status', content: 'Ready', position: 'left', priority: 0 },
          { id: 'workspace', content: workspace.current ? 'Workspace Open' : 'No Folder Open', position: 'left', priority: 1 },
          { id: 'encoding', content: 'UTF-8', position: 'right', priority: 0 },
          { id: 'eol', content: 'LF', position: 'right', priority: 1 },
          { id: 'language', content: 'TypeScript', position: 'right', priority: 2 }
        ]}
      />
    </div>
  );
};

export default Shell;