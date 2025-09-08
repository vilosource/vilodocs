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
import { useWorkspaceState, useLayoutState } from '../../renderer/hooks/useStateService';
import { StatusBarProvider, useStatusBar } from '../../contexts/StatusBarContext';
import { CommandPaletteProvider } from '../../contexts/CommandPaletteContext';
import './Shell.css';

interface ShellProps {
  children?: React.ReactNode; // Editor Grid will go here
  onCommand?: (commandId: string, context?: any) => void;
  onOpenFile?: (path: string, content: string) => void;
  openedTabs?: Array<{ id: string; title: string; filePath?: string }>;
  activeLeafId?: string;
  commandManager?: CommandManager; // Main CommandManager from App
}

interface ShellInnerProps extends ShellProps {}

const ShellInner: React.FC<ShellInnerProps> = ({ children, onCommand, onOpenFile, commandManager }) => {
  const { getStatusBarItems } = useStatusBar();
  const { workspace, updateWorkspace, getExpandedFolders, setExpandedFolders } = useWorkspaceState();
  const { layout, updateLayout, isLoading } = useLayoutState();
  
  const [regionManager] = useState(() => {
    const manager = new RegionManager();
    
    // Initialize with state from StateService
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
  const [activeView, setActiveView] = useState(layout.regions?.primarySideBar?.activeView || 'explorer');
  
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

  // Initialize focus manager and register Shell-specific commands
  useEffect(() => {
    if (!focusManagerRef.current) {
      focusManagerRef.current = new FocusManager();
    }
    
    // Only register commands if we have a commandManager from props
    if (!commandManager) return;
    
    commandManager.registerCommand({
      id: 'view.toggleSideBar',
      label: 'Toggle Side Bar',
      keybinding: 'Ctrl+B',
      execute: () => {
        regionManager.toggleRegion('primarySideBar');
        updateRegions();
      }
    });

    commandManager.registerCommand({
      id: 'view.togglePanel',
      label: 'Toggle Panel',
      keybinding: 'Ctrl+J',
      execute: () => {
        regionManager.toggleRegion('panel');
        updateRegions();
      }
    });

    // Workspace commands
    commandManager.registerCommand({
      id: 'workbench.action.files.openFolder',
      label: 'Open Folder',
      keybinding: 'Ctrl+K Ctrl+O',
      execute: async () => {
        const newWorkspace = await window.api.openFolder();
        if (newWorkspace) {
          await updateWorkspace({ current: newWorkspace });
        }
      }
    });

    commandManager.registerCommand({
      id: 'workbench.action.files.openWorkspace',
      label: 'Open Workspace',
      execute: async () => {
        const newWorkspace = await window.api.openWorkspace();
        if (newWorkspace) {
          await updateWorkspace({ current: newWorkspace });
        }
      }
    });

    commandManager.registerCommand({
      id: 'workbench.action.closeFolder',
      label: 'Close Folder',
      execute: async () => {
        await updateWorkspace({ current: null });
      }
    });
  }, [commandManager, updateRegions, updateWorkspace]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandManager) {
        commandManager.handleKeyboardEvent(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandManager]);

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
    await updateWorkspace({ current: newWorkspace });
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
            tabs={[
              { id: 'terminal', label: 'Terminal', content: <div>Terminal functionality coming soon...</div> },
              { id: 'problems', label: 'Problems', content: <div>No problems detected</div> },
              { id: 'output', label: 'Output', content: <div>Output console</div> },
              { id: 'debug-console', label: 'Debug Console', content: <div>Debug console</div> }
            ]}
            activeTabId="terminal"
            onClose={handlePanelClose}
            onResize={handlePanelResize}
          />
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
        items={getStatusBarItems()}
      />
    </div>
  );
};

export const Shell: React.FC<ShellProps> = (props) => {
  const { workspace } = useWorkspaceState();
  
  const handleOpenFileFromPalette = useCallback(async (path: string) => {
    // Open file using IPC and pass to onOpenFile handler
    const result = await window.api.openFileFromPalette(path);
    if (result && props.onOpenFile) {
      props.onOpenFile(result.path, result.content);
    }
  }, [props]);
  
  return (
    <StatusBarProvider>
      <CommandPaletteProvider 
        commandManager={props.commandManager}
        onOpenFile={handleOpenFileFromPalette}
        workspace={workspace.current}
        openedTabs={props.openedTabs}
        activeLeafId={props.activeLeafId}
      >
        <ShellInner {...props} />
      </CommandPaletteProvider>
    </StatusBarProvider>
  );
};

export default Shell;