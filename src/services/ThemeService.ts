import { EventEmitter } from 'events';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface SemanticColors {
  'editor.background': string;
  'editor.foreground': string;
  'editor.selectionBackground': string;
  'editor.lineHighlightBackground': string;
  'editor.findMatchBackground': string;
  'editor.findMatchHighlightBackground': string;
  
  'activityBar.background': string;
  'activityBar.foreground': string;
  'activityBar.inactiveForeground': string;
  'activityBar.border': string;
  'activityBar.activeBorder': string;
  'activityBar.activeBackground': string;
  'activityBar.hoverBackground': string;
  
  'sideBar.background': string;
  'sideBar.foreground': string;
  'sideBar.border': string;
  'sideBar.hoverBackground': string;
  'sideBarSectionHeader.background': string;
  'sideBarSectionHeader.foreground': string;
  
  'statusBar.background': string;
  'statusBar.foreground': string;
  'statusBar.border': string;
  'statusBar.debuggingBackground': string;
  'statusBar.debuggingForeground': string;
  'statusBar.hoverBackground': string;
  
  'panel.background': string;
  'panel.border': string;
  'panelTitle.activeBorder': string;
  'panelTitle.activeForeground': string;
  'panelTitle.inactiveForeground': string;
  
  'tab.activeBackground': string;
  'tab.activeForeground': string;
  'tab.inactiveBackground': string;
  'tab.inactiveForeground': string;
  'tab.border': string;
  'tab.activeBorder': string;
  'tab.hoverBackground': string;
  'tab.hoverForeground': string;
  
  'button.background': string;
  'button.foreground': string;
  'button.hoverBackground': string;
  'button.secondaryBackground': string;
  'button.secondaryForeground': string;
  'button.secondaryHoverBackground': string;
  
  'input.background': string;
  'input.foreground': string;
  'input.border': string;
  'input.placeholderForeground': string;
  'inputOption.activeBorder': string;
  'inputOption.activeBackground': string;
  'inputOption.activeForeground': string;
  
  'scrollbar.shadow': string;
  'scrollbarSlider.background': string;
  'scrollbarSlider.hoverBackground': string;
  'scrollbarSlider.activeBackground': string;
  
  'list.activeSelectionBackground': string;
  'list.activeSelectionForeground': string;
  'list.inactiveSelectionBackground': string;
  'list.inactiveSelectionForeground': string;
  'list.hoverBackground': string;
  'list.hoverForeground': string;
  'list.dropBackground': string;
  
  'tree.indentGuidesStroke': string;
  
  'focusBorder': string;
  'foreground': string;
  'widget.shadow': string;
  'selection.background': string;
  'descriptionForeground': string;
  'errorForeground': string;
  'icon.foreground': string;
}

export interface SyntaxColors {
  comment?: string;
  string?: string;
  keyword?: string;
  number?: string;
  regexp?: string;
  operator?: string;
  namespace?: string;
  type?: string;
  struct?: string;
  class?: string;
  interface?: string;
  enum?: string;
  typeParameter?: string;
  function?: string;
  member?: string;
  macro?: string;
  variable?: string;
  parameter?: string;
  property?: string;
  label?: string;
  constant?: string;
}

export interface ThemeMetadata {
  author?: string;
  description?: string;
  version?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  tags?: string[];
}

export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  semantic: SemanticColors;
  syntax?: SyntaxColors;
  metadata?: ThemeMetadata;
}

interface ThemeServiceEvents {
  'theme-changed': (theme: Theme) => void;
  'variable-updated': (name: string, value: string) => void;
  'custom-theme-added': (theme: Theme) => void;
  'custom-theme-removed': (themeId: string) => void;
}

export class ThemeService extends EventEmitter {
  private static instance: ThemeService;
  private currentTheme: Theme | null = null;
  private customThemes: Map<string, Theme> = new Map();
  private builtInThemes: Map<string, Theme> = new Map();
  private cssVariableCache: Map<string, string> = new Map();
  private persistenceKey = 'vilodocs.theme.current';
  private customThemesKey = 'vilodocs.theme.custom';

  private constructor() {
    super();
    this.initializeBuiltInThemes();
    this.loadCustomThemes();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initializeBuiltInThemes(): void {
    this.builtInThemes.set('dark', this.createDarkTheme());
    this.builtInThemes.set('light', this.createLightTheme());
  }

  private createDarkTheme(): Theme {
    return {
      id: 'dark',
      name: 'Dark',
      type: 'dark',
      colors: {
        primary: '#007ACC',
        secondary: '#5A9FD4',
        accent: '#007ACC',
        error: '#F48771',
        warning: '#FFD166',
        success: '#89D185',
        info: '#71B7FF',
        gray: {
          50: '#FAFAFA',
          100: '#F4F4F4',
          200: '#E4E4E4',
          300: '#D3D3D3',
          400: '#A2A2A2',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      semantic: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#CCCCCC',
        'editor.selectionBackground': '#264F78',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        
        'activityBar.background': '#333333',
        'activityBar.foreground': '#CCCCCC',
        'activityBar.inactiveForeground': '#CCCCCC99',
        'activityBar.border': '#333333',
        'activityBar.activeBorder': '#007ACC',
        'activityBar.activeBackground': '#00000000',
        'activityBar.hoverBackground': '#FFFFFF1A',
        
        'sideBar.background': '#252526',
        'sideBar.foreground': '#CCCCCC',
        'sideBar.border': '#333333',
        'sideBar.hoverBackground': '#2A2D2E',
        'sideBarSectionHeader.background': '#00000000',
        'sideBarSectionHeader.foreground': '#CCCCCC',
        
        'statusBar.background': '#007ACC',
        'statusBar.foreground': '#FFFFFF',
        'statusBar.border': '#00000000',
        'statusBar.debuggingBackground': '#CC6633',
        'statusBar.debuggingForeground': '#FFFFFF',
        'statusBar.hoverBackground': '#FFFFFF1A',
        
        'panel.background': '#1E1E1E',
        'panel.border': '#333333',
        'panelTitle.activeBorder': '#007ACC',
        'panelTitle.activeForeground': '#E7E7E7',
        'panelTitle.inactiveForeground': '#E7E7E799',
        
        'tab.activeBackground': '#1E1E1E',
        'tab.activeForeground': '#FFFFFF',
        'tab.inactiveBackground': '#2D2D30',
        'tab.inactiveForeground': '#FFFFFF80',
        'tab.border': '#252526',
        'tab.activeBorder': '#007ACC',
        'tab.hoverBackground': '#2A2D2E',
        'tab.hoverForeground': '#FFFFFF',
        
        'button.background': '#007ACC',
        'button.foreground': '#FFFFFF',
        'button.hoverBackground': '#005A9E',
        'button.secondaryBackground': '#3A3D41',
        'button.secondaryForeground': '#CCCCCC',
        'button.secondaryHoverBackground': '#45494E',
        
        'input.background': '#3C3C3C',
        'input.foreground': '#CCCCCC',
        'input.border': '#00000000',
        'input.placeholderForeground': '#CCCCCC80',
        'inputOption.activeBorder': '#007ACC',
        'inputOption.activeBackground': '#007ACC33',
        'inputOption.activeForeground': '#FFFFFF',
        
        'scrollbar.shadow': '#000000',
        'scrollbarSlider.background': '#79797966',
        'scrollbarSlider.hoverBackground': '#646464B3',
        'scrollbarSlider.activeBackground': '#BFBFBF66',
        
        'list.activeSelectionBackground': '#094771',
        'list.activeSelectionForeground': '#FFFFFF',
        'list.inactiveSelectionBackground': '#37373D',
        'list.inactiveSelectionForeground': '#CCCCCC',
        'list.hoverBackground': '#2A2D2E',
        'list.hoverForeground': '#CCCCCC',
        'list.dropBackground': '#062F4A',
        
        'tree.indentGuidesStroke': '#585858',
        
        'focusBorder': '#007ACC',
        'foreground': '#CCCCCC',
        'widget.shadow': '#0000005C',
        'selection.background': '#007ACC99',
        'descriptionForeground': '#CCCCCCB3',
        'errorForeground': '#F48771',
        'icon.foreground': '#C5C5C5',
      },
    };
  }

  private createLightTheme(): Theme {
    return {
      id: 'light',
      name: 'Light',
      type: 'light',
      colors: {
        primary: '#0066B8',
        secondary: '#4B9EDE',
        accent: '#0066B8',
        error: '#A31515',
        warning: '#BF8803',
        success: '#388A34',
        info: '#1A85FF',
        gray: {
          50: '#171717',
          100: '#262626',
          200: '#404040',
          300: '#525252',
          400: '#737373',
          500: '#A2A2A2',
          600: '#D3D3D3',
          700: '#E4E4E4',
          800: '#F4F4F4',
          900: '#FAFAFA',
        },
      },
      semantic: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#333333',
        'editor.selectionBackground': '#ADD6FF',
        'editor.lineHighlightBackground': '#F3F3F3',
        'editor.findMatchBackground': '#A8AC94',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        
        'activityBar.background': '#2C2C2C',
        'activityBar.foreground': '#FFFFFF',
        'activityBar.inactiveForeground': '#FFFFFF99',
        'activityBar.border': '#2C2C2C',
        'activityBar.activeBorder': '#0066B8',
        'activityBar.activeBackground': '#00000000',
        'activityBar.hoverBackground': '#FFFFFF1A',
        
        'sideBar.background': '#F3F3F3',
        'sideBar.foreground': '#333333',
        'sideBar.border': '#E1E1E1',
        'sideBar.hoverBackground': '#E8E8E8',
        'sideBarSectionHeader.background': '#00000000',
        'sideBarSectionHeader.foreground': '#333333',
        
        'statusBar.background': '#007ACC',
        'statusBar.foreground': '#FFFFFF',
        'statusBar.border': '#00000000',
        'statusBar.debuggingBackground': '#CC6633',
        'statusBar.debuggingForeground': '#FFFFFF',
        'statusBar.hoverBackground': '#FFFFFF1A',
        
        'panel.background': '#F3F3F3',
        'panel.border': '#E1E1E1',
        'panelTitle.activeBorder': '#0066B8',
        'panelTitle.activeForeground': '#333333',
        'panelTitle.inactiveForeground': '#33333399',
        
        'tab.activeBackground': '#FFFFFF',
        'tab.activeForeground': '#333333',
        'tab.inactiveBackground': '#ECECEC',
        'tab.inactiveForeground': '#33333380',
        'tab.border': '#F3F3F3',
        'tab.activeBorder': '#0066B8',
        'tab.hoverBackground': '#E8E8E8',
        'tab.hoverForeground': '#333333',
        
        'button.background': '#007ACC',
        'button.foreground': '#FFFFFF',
        'button.hoverBackground': '#005A9E',
        'button.secondaryBackground': '#E1E1E1',
        'button.secondaryForeground': '#333333',
        'button.secondaryHoverBackground': '#D7D7D7',
        
        'input.background': '#FFFFFF',
        'input.foreground': '#333333',
        'input.border': '#CECECE',
        'input.placeholderForeground': '#33333380',
        'inputOption.activeBorder': '#007ACC',
        'inputOption.activeBackground': '#007ACC33',
        'inputOption.activeForeground': '#000000',
        
        'scrollbar.shadow': '#DDDDDD',
        'scrollbarSlider.background': '#64646466',
        'scrollbarSlider.hoverBackground': '#646464B3',
        'scrollbarSlider.activeBackground': '#00000099',
        
        'list.activeSelectionBackground': '#E4F1FF',
        'list.activeSelectionForeground': '#000000',
        'list.inactiveSelectionBackground': '#E8E8E8',
        'list.inactiveSelectionForeground': '#333333',
        'list.hoverBackground': '#E8E8E8',
        'list.hoverForeground': '#333333',
        'list.dropBackground': '#D6EBFF',
        
        'tree.indentGuidesStroke': '#A9A9A9',
        
        'focusBorder': '#0090F1',
        'foreground': '#333333',
        'widget.shadow': '#00000029',
        'selection.background': '#007ACC99',
        'descriptionForeground': '#717171',
        'errorForeground': '#A31515',
        'icon.foreground': '#424242',
      },
    };
  }

  async initialize(): Promise<void> {
    const persistedThemeId = this.getPersistedTheme();
    const theme = this.getTheme(persistedThemeId) || this.builtInThemes.get('dark')!;
    await this.applyTheme(theme);
  }

  async loadTheme(themeId: string): Promise<void> {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme with id "${themeId}" not found`);
    }
    await this.applyTheme(theme);
  }

  async applyTheme(theme: Theme): Promise<void> {
    this.currentTheme = theme;
    this.updateCSSVariables(theme);
    this.persistTheme(theme.id);
    this.emit('theme-changed', theme);
    
    // Set data-theme attribute
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.type);
    }
  }

  private updateCSSVariables(theme: Theme): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Clear cache
    this.cssVariableCache.clear();
    
    // Apply color palette
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key === 'gray' && typeof value === 'object') {
        Object.entries(value).forEach(([shade, color]) => {
          const varName = `--theme-color-gray-${shade}`;
          root.style.setProperty(varName, color);
          this.cssVariableCache.set(varName, color);
        });
      } else if (typeof value === 'string') {
        const varName = `--theme-color-${key}`;
        root.style.setProperty(varName, value);
        this.cssVariableCache.set(varName, value);
      }
    });
    
    // Apply semantic colors
    Object.entries(theme.semantic).forEach(([key, value]) => {
      const varName = `--theme-${key.replace(/\./g, '-')}`;
      root.style.setProperty(varName, value);
      this.cssVariableCache.set(varName, value);
      
      // Also set VS Code compatible variables
      const vscodeVarName = `--vscode-${key.replace(/\./g, '-')}`;
      root.style.setProperty(vscodeVarName, value);
      this.cssVariableCache.set(vscodeVarName, value);
    });
    
    // Apply syntax colors if available
    if (theme.syntax) {
      Object.entries(theme.syntax).forEach(([key, value]) => {
        if (value) {
          const varName = `--theme-syntax-${key}`;
          root.style.setProperty(varName, value);
          this.cssVariableCache.set(varName, value);
        }
      });
    }
  }

  updateVariable(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    
    document.documentElement.style.setProperty(name, value);
    this.cssVariableCache.set(name, value);
    this.emit('variable-updated', name, value);
  }

  batchUpdateVariables(updates: Record<string, string>): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    Object.entries(updates).forEach(([name, value]) => {
      root.style.setProperty(name, value);
      this.cssVariableCache.set(name, value);
    });
  }

  getThemeForInjection(): string {
    if (!this.currentTheme) return '';
    
    const cssVariables: string[] = [];
    
    // Add all cached variables
    this.cssVariableCache.forEach((value, name) => {
      cssVariables.push(`${name}: ${value};`);
    });
    
    return `:root { ${cssVariables.join(' ')} }`;
  }

  async saveCustomTheme(theme: Theme): Promise<void> {
    this.customThemes.set(theme.id, theme);
    this.persistCustomThemes();
    this.emit('custom-theme-added', theme);
  }

  async removeCustomTheme(themeId: string): Promise<void> {
    if (this.customThemes.delete(themeId)) {
      this.persistCustomThemes();
      this.emit('custom-theme-removed', themeId);
    }
  }

  getTheme(themeId: string): Theme | undefined {
    return this.builtInThemes.get(themeId) || this.customThemes.get(themeId);
  }

  getAllThemes(): Theme[] {
    return [
      ...Array.from(this.builtInThemes.values()),
      ...Array.from(this.customThemes.values()),
    ];
  }

  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  getBuiltInThemes(): Theme[] {
    return Array.from(this.builtInThemes.values());
  }

  getCustomThemes(): Theme[] {
    return Array.from(this.customThemes.values());
  }

  exportTheme(themeId: string): string | undefined {
    const theme = this.getTheme(themeId);
    if (!theme) return undefined;
    return JSON.stringify(theme, null, 2);
  }

  async importTheme(themeJson: string): Promise<Theme> {
    const theme = JSON.parse(themeJson) as Theme;
    
    // Validate theme structure
    if (!theme.id || !theme.name || !theme.type || !theme.colors || !theme.semantic) {
      throw new Error('Invalid theme structure');
    }
    
    // Ensure unique ID for imported themes
    if (this.builtInThemes.has(theme.id)) {
      theme.id = `${theme.id}-custom-${Date.now()}`;
    }
    
    await this.saveCustomTheme(theme);
    return theme;
  }

  private getPersistedTheme(): string {
    if (typeof localStorage === 'undefined') return 'dark';
    return localStorage.getItem(this.persistenceKey) || 'dark';
  }

  private persistTheme(themeId: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.persistenceKey, themeId);
  }

  private loadCustomThemes(): void {
    if (typeof localStorage === 'undefined') return;
    
    const customThemesJson = localStorage.getItem(this.customThemesKey);
    if (!customThemesJson) return;
    
    try {
      const themes = JSON.parse(customThemesJson) as Theme[];
      themes.forEach(theme => {
        this.customThemes.set(theme.id, theme);
      });
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
  }

  private persistCustomThemes(): void {
    if (typeof localStorage === 'undefined') return;
    
    const themes = Array.from(this.customThemes.values());
    localStorage.setItem(this.customThemesKey, JSON.stringify(themes));
  }

  // Helper method for generating theme from current VS Code settings
  generateThemeFromVSCode(vscodeTheme: any): Theme {
    const isDark = vscodeTheme.type === 'dark';
    const baseTheme = isDark ? this.createDarkTheme() : this.createLightTheme();
    
    // Map VS Code colors to our semantic colors
    const semanticMappings = vscodeTheme.colors || {};
    Object.keys(semanticMappings).forEach(vscodeKey => {
      const ourKey = vscodeKey.replace('vscode.', '');
      if (ourKey in baseTheme.semantic) {
        (baseTheme.semantic as any)[ourKey] = semanticMappings[vscodeKey];
      }
    });
    
    // Generate unique ID and name
    baseTheme.id = `vscode-import-${Date.now()}`;
    baseTheme.name = vscodeTheme.name || 'Imported VS Code Theme';
    
    return baseTheme;
  }

  // Cleanup method
  dispose(): void {
    this.removeAllListeners();
    this.cssVariableCache.clear();
  }
}