import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityBar, ActivityBarItem } from './ActivityBar';
import { SideBar } from './SideBar';
import { Panel } from './Panel';
import { StatusBar, StatusBarItem } from './StatusBar';
import { FileExplorer } from '../explorer/FileExplorer';
import { RegionManager } from '../../layout/regions';
import { LayoutPersistence } from '../../layout/persistence-browser';
import { CommandManager } from '../../commands/CommandManager';
import { FocusManager } from '../../focus/FocusManager';
import { Workspace } from '../../common/ipc';
import './Shell.css';

interface ShellProps {
  children?: React.ReactNode; // Editor Grid will go here
  onCommand?: (commandId: string, context?: any) => void;
  onOpenFile?: (path: string, content: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ children, onCommand, onOpenFile }) => {
  const [regionManager] = useState(() => new RegionManager());
  const [persistence] = useState(() => new LayoutPersistence());
  const [regions, setRegions] = useState(regionManager.getState());
  const [activeView, setActiveView] = useState('explorer');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const commandManagerRef = useRef<CommandManager | null>(null);
  const focusManagerRef = useRef<FocusManager | null>(null);

  // Update regions when manager state changes
  const updateRegions = () => {
    const newState = regionManager.getState();
    setRegions(newState);
    
    // Save to persistence
    persistence.save({
      version: 1,
      editorGrid: { id: 'root', tabs: [], activeTabId: undefined },
      regions: {
        activityBar: { visible: newState.activityBar.visible },
        primarySideBar: { 
          visible: newState.primarySideBar.visible, 
          width: newState.primarySideBar.width 
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
      },
      lastFocused: { region: 'editorGrid' }
    });
  };

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
          setWorkspace(newWorkspace);
          if (!regions.primarySideBar.visible) {
            regionManager.toggleRegion('primarySideBar');
            updateRegions();
          }
          setActiveView('explorer');
        }
      }
    });

    cmdManager.registerCommand({
      id: 'workbench.action.files.openWorkspace',
      label: 'Open Workspace',
      execute: async () => {
        const newWorkspace = await window.api.openWorkspace();
        if (newWorkspace) {
          setWorkspace(newWorkspace);
          if (!regions.primarySideBar.visible) {
            regionManager.toggleRegion('primarySideBar');
            updateRegions();
          }
          setActiveView('explorer');
        }
      }
    });

    // Load persisted layout
    persistence.load().then(layout => {
      if (layout) {
        regionManager.setRegionState('activityBar', layout.regions.activityBar);
        regionManager.setRegionState('primarySideBar', layout.regions.primarySideBar);
        regionManager.setRegionState('secondarySideBar', layout.regions.secondarySideBar);
        regionManager.setRegionState('panel', layout.regions.panel);
        regionManager.setRegionState('statusBar', layout.regions.statusBar);
        updateRegions();
      }
    });
  }, [onCommand]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandManagerRef.current) return;

      // Get current context for command execution
      const context = {
        activeView,
        regions,
        focusedElement: document.activeElement,
        // Additional context can be added here
      };

      // Let command manager handle the event
      const handled = commandManagerRef.current.handleKeyboardEvent(e, context);
      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, regions]);

  const activityBarItems: ActivityBarItem[] = [
    { id: 'explorer', icon: '📁', label: 'Explorer', isActive: activeView === 'explorer' },
    { id: 'search', icon: '🔍', label: 'Search', isActive: activeView === 'search' },
    { id: 'scm', icon: '🌿', label: 'Source Control', isActive: activeView === 'scm' },
    { id: 'debug', icon: '🐛', label: 'Debug', isActive: activeView === 'debug' },
    { id: 'extensions', icon: '🧩', label: 'Extensions', isActive: activeView === 'extensions' },
  ];

  const panelTabs = [
    { id: 'problems', label: 'Problems', content: <div>No problems detected</div> },
    { id: 'output', label: 'Output', content: <div>Output console</div> },
    { id: 'terminal', label: 'Terminal', content: <div>Terminal</div> },
    { id: 'debug-console', label: 'Debug Console', content: <div>Debug console</div> },
  ];

  const statusBarItems: StatusBarItem[] = [
    { id: 'branch', content: '🌿 main', position: 'left', priority: 1 },
    { id: 'errors', content: '❌ 0 ⚠️ 0', position: 'left', priority: 2 },
    { id: 'line-col', content: 'Ln 1, Col 1', position: 'right', priority: 1 },
    { id: 'encoding', content: 'UTF-8', position: 'right', priority: 2 },
    { id: 'eol', content: 'LF', position: 'right', priority: 3 },
    { id: 'language', content: 'Plain Text', position: 'right', priority: 4 },
  ];

  const handleActivityBarClick = (itemId: string) => {
    setActiveView(itemId);
    if (!regions.primarySideBar.visible) {
      regionManager.toggleRegion('primarySideBar');
      updateRegions();
    }
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

  const handleWorkspaceChange = useCallback((newWorkspace: Workspace | null) => {
    setWorkspace(newWorkspace);
  }, []);

  const handleFileOpen = useCallback((path: string, content: string) => {
    onOpenFile?.(path, content);
  }, [onOpenFile]);

  return (
    <div className="shell">
      <div className="shell-main">
        <ActivityBar
          items={activityBarItems}
          onItemClick={handleActivityBarClick}
          visible={regions.activityBar.visible}
          data-focus-group="activity-bar"
        />
        
        <SideBar
          position="left"
          visible={regions.primarySideBar.visible}
          width={regions.primarySideBar.width}
          minWidth={200}
          onResize={(width) => handleSideBarResize('primarySideBar', width)}
          title={activityBarItems.find(i => i.id === activeView)?.label}
          data-focus-group="primary-sidebar"
        >
          <div className="sidebar-view-content">
            {activeView === 'explorer' && (
              <FileExplorer
                workspace={workspace}
                onOpenFile={handleFileOpen}
                onWorkspaceChange={handleWorkspaceChange}
              />
            )}
            {activeView === 'search' && <div>Search</div>}
            {activeView === 'scm' && <div>Source Control</div>}
            {activeView === 'debug' && <div>Debug</div>}
            {activeView === 'extensions' && <div>Extensions</div>}
          </div>
        </SideBar>
        
        <div className="shell-editor-area">
          {children || <div className="welcome-tab">Welcome to vilodocs</div>}
          
          <Panel
            visible={regions.panel.visible}
            position={regions.panel.position}
            height={regions.panel.height}
            minHeight={150}
            tabs={panelTabs}
            activeTabId="terminal"
            onResize={handlePanelResize}
            onClose={handlePanelClose}
            data-focus-group="panel"
          />
        </div>
        
        <SideBar
          position="right"
          visible={regions.secondarySideBar.visible}
          width={regions.secondarySideBar.width}
          minWidth={200}
          onResize={(width) => handleSideBarResize('secondarySideBar', width)}
          data-focus-group="secondary-sidebar"
        >
          <div>Secondary sidebar content</div>
        </SideBar>
      </div>
      
      <StatusBar
        visible={regions.statusBar.visible}
        items={statusBarItems}
      />
    </div>
  );
};