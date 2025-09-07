# Theme System Architecture

## Executive Summary

This document outlines the comprehensive theme system architecture for vilodocs, based on analysis of our current implementation and research into industry-leading approaches from VS Code, Obsidian, Discord, and Slack. Our goal is to create a flexible, maintainable, and extensible theme system that ensures visual consistency across all current and future components.

## Current State Audit

### What We Have
- **System Theme Detection**: Main process detects system theme via `nativeTheme.shouldUseDarkColors`
- **IPC Communication**: Theme changes communicated via `SystemThemeChanged` channel
- **Data Attribute Switching**: Renderer sets `data-theme` attribute on document element
- **Mixed Variable Approach**: 
  - Custom variables in `App.css` (--background-color, --foreground-color, etc.)
  - VS Code variables in components (--vscode-editor-background, --vscode-activityBar-background, etc.)
  - Fallback values provided for all VS Code variables

### Issues Identified
1. **Inconsistent Naming**: Mix of custom and VS Code variable names creates confusion
2. **No Central Management**: Theme definitions scattered across CSS files
3. **Limited Extensibility**: No support for custom themes or theme packages
4. **No Runtime Updates**: Can't modify theme without editing CSS files
5. **Widget Isolation**: Future widgets (WebContentsView) may not inherit theme automatically

## Industry Analysis

### VS Code
- **Strengths**: 400+ semantic variables, hierarchical naming, extension support
- **Architecture**: Service-oriented with decoration-ioc, comprehensive workbench colors
- **Key Insight**: Semantic naming (editor.background) creates intuitive theme authoring

### Obsidian
- **Strengths**: 400+ CSS variables, Style Settings plugin integration
- **Architecture**: All variables on body element, YAML-based configuration
- **Key Insight**: User-facing customization through UI, not just files

### Discord
- **Strengths**: Modern CSS features (nesting, layers), community themes
- **Architecture**: CSS variable-based with remote asset loading
- **Key Insight**: Balance between official themes and community customization

### Slack
- **Strengths**: Hybrid local/remote assets, TypeScript migration
- **Current State**: Locked down custom themes for security (2024)
- **Key Insight**: Security considerations for theme injection

## Recommended Architecture

### 1. Theme Definition Structure

```typescript
interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  semantic: SemanticColors;
  syntax?: SyntaxColors;
  metadata: ThemeMetadata;
}

interface ThemeColors {
  // Base colors (palette)
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  
  // Grayscale
  gray: {
    50: string;
    100: string;
    // ... through 900
  };
}

interface SemanticColors {
  // Editor
  'editor.background': string;
  'editor.foreground': string;
  'editor.lineHighlightBackground': string;
  
  // Activity Bar
  'activityBar.background': string;
  'activityBar.foreground': string;
  'activityBar.activeBorder': string;
  
  // Status Bar
  'statusBar.background': string;
  'statusBar.foreground': string;
  
  // ... comprehensive list
}
```

### 2. CSS Variable Strategy

#### Naming Convention
```css
/* Base palette variables */
--theme-color-primary: #007acc;
--theme-color-gray-100: #f3f3f3;

/* Semantic variables (VS Code compatible) */
--vscode-editor-background: var(--theme-editor-background);
--vscode-editor-foreground: var(--theme-editor-foreground);

/* Component-specific overrides */
--markdown-link-color: var(--theme-color-accent);
--browser-tab-background: var(--theme-tab-background);
```

#### Layer Architecture
```css
@layer base, theme, components, utilities;

@layer theme {
  :root {
    /* Light theme defaults */
  }
  
  [data-theme="dark"] {
    /* Dark theme overrides */
  }
  
  [data-theme="custom"] {
    /* Custom theme overrides */
  }
}
```

### 3. Theme Service Implementation

```typescript
class ThemeService {
  private currentTheme: Theme;
  private customThemes: Map<string, Theme>;
  private subscribers: Set<(theme: Theme) => void>;
  
  // Core functionality
  async loadTheme(themeId: string): Promise<void>;
  async applyTheme(theme: Theme): Promise<void>;
  async saveCustomTheme(theme: Theme): Promise<void>;
  
  // Runtime updates
  updateVariable(name: string, value: string): void;
  batchUpdateVariables(updates: Record<string, string>): void;
  
  // Widget integration
  injectThemeIntoWebContents(webContents: WebContents): void;
  getThemeForInjection(): string; // Returns CSS string
  
  // Persistence
  getPersistedTheme(): string;
  persistTheme(themeId: string): void;
}
```

### 4. Widget Theme Injection

For WebContentsView and other isolated contexts:

```typescript
// Main process
webContentsView.webContents.on('dom-ready', () => {
  const themeCSS = themeService.getThemeForInjection();
  webContentsView.webContents.insertCSS(themeCSS);
});

// Handle theme changes
themeService.subscribe((theme) => {
  allWebContentsViews.forEach(view => {
    view.webContents.insertCSS(themeService.getThemeForInjection());
  });
});
```

### 5. Theme Configuration UI

```typescript
interface ThemeSettings {
  // Preset selection
  currentTheme: string;
  availableThemes: Theme[];
  
  // Customization
  customAccentColor?: string;
  customFontFamily?: string;
  customFontSize?: number;
  
  // Advanced
  enableCustomCSS: boolean;
  customCSS?: string;
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create ThemeService with basic functionality
- [ ] Define comprehensive variable schema
- [ ] Migrate existing CSS to new variable system
- [ ] Implement theme persistence

### Phase 2: Core Themes (Week 2)
- [ ] Create default light theme
- [ ] Create default dark theme
- [ ] Implement VS Code theme compatibility layer
- [ ] Add high contrast theme

### Phase 3: Widget Integration (Week 3)
- [ ] WebContentsView theme injection
- [ ] Markdown renderer theming
- [ ] Command palette theming
- [ ] Browser widget theming

### Phase 4: Customization (Week 4)
- [ ] Theme settings UI
- [ ] Custom theme creation
- [ ] Import/export functionality
- [ ] Live preview system

### Phase 5: Advanced Features (Future)
- [ ] Theme marketplace integration
- [ ] Syntax highlighting themes
- [ ] Per-workspace themes
- [ ] Theme scheduling (time-based)

## Security Considerations

1. **CSS Injection**: Sanitize all custom CSS to prevent XSS
2. **Remote Themes**: Validate and sandbox remote theme content
3. **CSP Headers**: Maintain strict Content Security Policy
4. **Variable Validation**: Ensure color values are valid before applying

## Performance Optimizations

1. **CSS Custom Properties**: Native browser performance
2. **Lazy Loading**: Load theme CSS only when needed
3. **Caching**: Cache compiled theme CSS
4. **Batch Updates**: Group variable changes to minimize reflows

## Testing Strategy

1. **Visual Regression**: Screenshot comparison for theme changes
2. **Accessibility**: Ensure WCAG compliance for all themes
3. **Performance**: Measure theme switching performance
4. **Cross-platform**: Test on Windows, macOS, Linux

## Migration Guide

### For Developers
1. Replace hardcoded colors with semantic variables
2. Use ThemeService for runtime theme queries
3. Test components with all built-in themes

### For Users
1. Existing theme preference will be migrated automatically
2. Custom themes can be imported from VS Code (future)
3. Settings will provide theme customization UI

## Best Practices

### DO
- Use semantic variable names
- Provide fallback values
- Test with light and dark themes
- Document custom variables
- Follow contrast guidelines

### DON'T
- Hardcode color values
- Use !important on theme variables
- Mix theme systems
- Ignore accessibility
- Override user preferences

## Appendix A: Complete Variable Reference

### Editor Variables
```css
--vscode-editor-background
--vscode-editor-foreground
--vscode-editor-selectionBackground
--vscode-editor-inactiveSelectionBackground
--vscode-editor-lineHighlightBackground
--vscode-editor-lineHighlightBorder
--vscode-editor-rangeHighlightBackground
--vscode-editor-symbolHighlightBackground
--vscode-editor-hoverHighlightBackground
--vscode-editor-wordHighlightBackground
--vscode-editor-wordHighlightStrongBackground
--vscode-editor-findMatchBackground
--vscode-editor-findMatchHighlightBackground
--vscode-editor-findRangeHighlightBackground
```

### Activity Bar Variables
```css
--vscode-activityBar-background
--vscode-activityBar-foreground
--vscode-activityBar-inactiveForeground
--vscode-activityBar-border
--vscode-activityBar-activeBorder
--vscode-activityBar-activeFocusBorder
--vscode-activityBar-activeBackground
--vscode-activityBar-dropBorder
--vscode-activityBar-hoverBackground
```

### Status Bar Variables
```css
--vscode-statusBar-background
--vscode-statusBar-foreground
--vscode-statusBar-border
--vscode-statusBar-debuggingBackground
--vscode-statusBar-debuggingForeground
--vscode-statusBar-debuggingBorder
--vscode-statusBar-noFolderBackground
--vscode-statusBar-noFolderForeground
--vscode-statusBar-noFolderBorder
```

## Appendix B: Theme JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "type": { "enum": ["light", "dark", "auto"] },
    "colors": {
      "type": "object",
      "properties": {
        "primary": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "secondary": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" }
      }
    },
    "semantic": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z]+\\.[a-zA-Z]+$": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6,8}$|^rgba?\\(.*\\)$"
        }
      }
    }
  },
  "required": ["id", "name", "type", "colors", "semantic"]
}
```

## References

1. [VS Code Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)
2. [Obsidian Theme Migration Guide](https://obsidian.md/blog/1-0-theme-migration-guide/)
3. [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
4. [CSS Custom Properties Performance](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
5. [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)