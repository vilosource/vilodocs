export interface RegionVisibility {
  visible: boolean;
}

export interface RegionConfig {
  activityBar: RegionVisibility;
  primarySideBar: RegionVisibility & { width: number };
  secondarySideBar: RegionVisibility & { width: number };
  panel: RegionVisibility & { position: 'bottom' | 'right'; height: number };
  statusBar: RegionVisibility & { height: number };
  editorGrid: RegionVisibility;
}

export type RegionName = keyof RegionConfig;

export interface RegionState extends RegionConfig {
  activityBar: RegionVisibility & { width: number };
  statusBar: RegionVisibility & { height: number };
}

export class RegionManager {
  private state: RegionState;
  private keyboardShortcuts: Record<string, string>;

  constructor(initialState?: Partial<RegionState>) {
    this.state = {
      activityBar: {
        visible: true,
        width: 48,
        ...initialState?.activityBar
      },
      primarySideBar: {
        visible: true,
        width: 280,
        ...initialState?.primarySideBar
      },
      secondarySideBar: {
        visible: false,
        width: 280,
        ...initialState?.secondarySideBar
      },
      panel: {
        visible: false,
        position: 'bottom',
        height: 300,
        ...initialState?.panel
      },
      statusBar: {
        visible: true,
        height: 22,
        ...initialState?.statusBar
      },
      editorGrid: {
        visible: true,
        ...initialState?.editorGrid
      }
    };

    this.keyboardShortcuts = {
      'Ctrl+B': 'toggle-primary-sidebar',
      'Ctrl+J': 'toggle-panel',
      'Ctrl+K Ctrl+B': 'toggle-secondary-sidebar'
    };
  }

  getState(): Readonly<RegionState> {
    return { ...this.state };
  }

  toggleRegion(region: RegionName): void {
    // Editor grid cannot be toggled
    if (region === 'editorGrid') {
      return;
    }

    this.state[region] = {
      ...this.state[region],
      visible: !this.state[region].visible
    };
  }

  resizeRegion(region: 'primarySideBar' | 'secondarySideBar' | 'panel', size: number): void {
    const minSize = 200;
    const actualSize = Math.max(size, minSize);

    if (region === 'panel') {
      this.state.panel.height = actualSize;
    } else {
      this.state[region].width = actualSize;
    }
  }

  setPanelPosition(position: 'bottom' | 'right'): void {
    this.state.panel.position = position;
  }

  getKeyboardShortcuts(): Record<string, string> {
    return { ...this.keyboardShortcuts };
  }

  setRegionState(region: RegionName, updates: Partial<RegionState[RegionName]>): void {
    this.state[region] = {
      ...this.state[region],
      ...updates
    } as RegionState[RegionName];
  }
}