import { lazy, LazyExoticComponent } from 'react';

export interface WidgetProvider {
  type: string;
  name: string;
  description: string;
  filePatterns: string[];
  priority: number;
  component: LazyExoticComponent<any>;
  canHandle: (filePath: string, content?: string) => boolean;
  getDefaultProps?: (filePath: string, content: string) => any;
}

export interface FileAssociation {
  pattern: string;
  widgetType: string;
  priority: number;
}

class WidgetRegistryService {
  private static instance: WidgetRegistryService;
  private widgets: Map<string, WidgetProvider> = new Map();
  private fileAssociations: FileAssociation[] = [];
  private userPreferences: Map<string, string> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WidgetRegistryService {
    if (!this.instance) {
      this.instance = new WidgetRegistryService();
      this.instance.initialize();
    }
    return this.instance;
  }

  private initialize(): void {
    this.registerDefaultWidgets();
    this.loadDefaultAssociations();
    this.loadUserPreferences();
  }

  private registerDefaultWidgets(): void {
    // Text Editor (existing widget)
    this.registerWidget({
      type: 'text-editor',
      name: 'Text Editor',
      description: 'Plain text and code editor',
      filePatterns: ['*'],
      priority: 10,
      component: lazy(() => import('../components/widgets/TextEditor')),
      canHandle: () => true,
    });

    // Markdown Viewer (new widget)
    this.registerWidget({
      type: 'markdown-viewer',
      name: 'Markdown Viewer',
      description: 'Rendered markdown preview',
      filePatterns: ['*.md', '*.markdown', '*.mdown', '*.mkd'],
      priority: 100,
      component: lazy(() => import('../components/widgets/MarkdownViewer')),
      canHandle: (path) => /\.(md|markdown|mdown|mkd)$/i.test(path),
    });

    // Welcome Widget (existing)
    this.registerWidget({
      type: 'welcome',
      name: 'Welcome',
      description: 'Welcome screen',
      filePatterns: [],
      priority: 0,
      component: lazy(() => import('../components/widgets/WelcomeWidget')),
      canHandle: () => false,
    });
  }

  private loadDefaultAssociations(): void {
    this.fileAssociations = [
      // Markdown files open in viewer by default
      { pattern: '*.md', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.markdown', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.mdown', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.mkd', widgetType: 'markdown-viewer', priority: 100 },
      { pattern: '*.mdx', widgetType: 'markdown-viewer', priority: 100 },
      
      // Code files open in text editor
      { pattern: '*.js', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.jsx', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.ts', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.tsx', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.json', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.css', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.scss', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.less', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.html', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.xml', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.yaml', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.yml', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.toml', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.ini', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.conf', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.sh', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.bash', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.zsh', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.fish', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.py', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.rb', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.go', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.rs', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.java', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.c', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.cpp', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.h', widgetType: 'text-editor', priority: 50 },
      { pattern: '*.hpp', widgetType: 'text-editor', priority: 50 },
      
      // Plain text files
      { pattern: '*.txt', widgetType: 'text-editor', priority: 40 },
      { pattern: '*.log', widgetType: 'text-editor', priority: 40 },
      { pattern: '*.out', widgetType: 'text-editor', priority: 40 },
      
      // Default fallback
      { pattern: '*', widgetType: 'text-editor', priority: 0 },
    ];
  }

  registerWidget(provider: WidgetProvider): void {
    this.widgets.set(provider.type, provider);
  }

  registerFileAssociation(pattern: string, widgetType: string, priority = 50): void {
    this.fileAssociations.push({ pattern, widgetType, priority });
    // Sort by priority after adding
    this.fileAssociations.sort((a, b) => b.priority - a.priority);
  }

  getWidgetForFile(filePath: string): string {
    // Extract filename from path
    const filename = filePath.split('/').pop() || filePath.split('\\').pop() || '';
    
    // Check user preferences first
    const userPref = this.userPreferences.get(filePath);
    if (userPref) return userPref;

    // Find best matching widget by priority
    const matches = this.fileAssociations
      .filter(assoc => this.matchesPattern(filename, assoc.pattern))
      .sort((a, b) => b.priority - a.priority);

    return matches[0]?.widgetType || 'text-editor';
  }

  private matchesPattern(filename: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regex}$`).test(filename);
  }

  getWidgetProvider(type: string): WidgetProvider | undefined {
    return this.widgets.get(type);
  }

  switchWidget(currentType: string, filePath: string): string {
    // Get available widgets for this file
    const available = this.getAvailableWidgets(filePath);
    const currentIndex = available.findIndex(w => w.type === currentType);
    const nextIndex = (currentIndex + 1) % available.length;
    return available[nextIndex].type;
  }

  getAvailableWidgets(filePath: string): WidgetProvider[] {
    return Array.from(this.widgets.values())
      .filter(widget => widget.canHandle(filePath))
      .sort((a, b) => b.priority - a.priority);
  }

  private loadUserPreferences(): void {
    // TODO: Load from electron-store
    // For now, just initialize empty
  }

  setUserPreference(filePath: string, widgetType: string): void {
    this.userPreferences.set(filePath, widgetType);
    // TODO: Persist to electron-store
  }

  clearUserPreference(filePath: string): void {
    this.userPreferences.delete(filePath);
    // TODO: Persist to electron-store
  }

  getUserPreferences(): Map<string, string> {
    return new Map(this.userPreferences);
  }

  resetToDefaults(): void {
    this.userPreferences.clear();
    // TODO: Clear from electron-store
  }
}

export default WidgetRegistryService;