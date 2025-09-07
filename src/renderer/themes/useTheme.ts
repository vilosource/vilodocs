import { useEffect, useState } from 'react';
import { ThemeService, Theme } from '../../services/ThemeService';

const themeService = ThemeService.getInstance();

/**
 * React hook for accessing and managing themes
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(themeService.getCurrentTheme());
  const [themes, setThemes] = useState<Theme[]>(themeService.getAllThemes());

  useEffect(() => {
    // Initialize theme service
    themeService.initialize();

    // Subscribe to theme changes
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
    };

    const handleCustomThemeAdded = () => {
      setThemes(themeService.getAllThemes());
    };

    const handleCustomThemeRemoved = () => {
      setThemes(themeService.getAllThemes());
    };

    themeService.on('theme-changed', handleThemeChange);
    themeService.on('custom-theme-added', handleCustomThemeAdded);
    themeService.on('custom-theme-removed', handleCustomThemeRemoved);

    // Cleanup
    return () => {
      themeService.off('theme-changed', handleThemeChange);
      themeService.off('custom-theme-added', handleCustomThemeAdded);
      themeService.off('custom-theme-removed', handleCustomThemeRemoved);
    };
  }, []);

  const setTheme = async (themeId: string) => {
    await themeService.loadTheme(themeId);
  };

  const updateVariable = (name: string, value: string) => {
    themeService.updateVariable(name, value);
  };

  const batchUpdateVariables = (updates: Record<string, string>) => {
    themeService.batchUpdateVariables(updates);
  };

  const saveCustomTheme = async (theme: Theme) => {
    await themeService.saveCustomTheme(theme);
  };

  const removeCustomTheme = async (themeId: string) => {
    await themeService.removeCustomTheme(themeId);
  };

  const importTheme = async (themeJson: string) => {
    return await themeService.importTheme(themeJson);
  };

  const exportTheme = (themeId: string) => {
    return themeService.exportTheme(themeId);
  };

  return {
    currentTheme,
    themes,
    builtInThemes: themeService.getBuiltInThemes(),
    customThemes: themeService.getCustomThemes(),
    setTheme,
    updateVariable,
    batchUpdateVariables,
    saveCustomTheme,
    removeCustomTheme,
    importTheme,
    exportTheme,
  };
}

/**
 * Hook for accessing theme variables in components
 */
export function useThemeVariables() {
  const [variables, setVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateVariables = () => {
      if (typeof getComputedStyle === 'undefined') return;

      const computedStyle = getComputedStyle(document.documentElement);
      const newVariables: Record<string, string> = {};

      // Get common theme variables
      const commonVars = [
        '--theme-color-primary',
        '--theme-color-secondary',
        '--theme-color-accent',
        '--theme-color-error',
        '--theme-color-warning',
        '--theme-color-success',
        '--theme-color-info',
        '--theme-editor-background',
        '--theme-editor-foreground',
        '--theme-activityBar-background',
        '--theme-sideBar-background',
        '--theme-statusBar-background',
        '--theme-panel-background',
      ];

      commonVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName).trim();
        if (value) {
          newVariables[varName] = value;
        }
      });

      setVariables(newVariables);
    };

    // Initial update
    updateVariables();

    // Listen for theme changes
    const handleThemeChange = () => {
      updateVariables();
    };

    themeService.on('theme-changed', handleThemeChange);
    themeService.on('variable-updated', handleThemeChange);

    return () => {
      themeService.off('theme-changed', handleThemeChange);
      themeService.off('variable-updated', handleThemeChange);
    };
  }, []);

  return variables;
}

/**
 * Hook for managing theme preferences
 */
export function useThemePreferences() {
  const [autoTheme, setAutoTheme] = useState<boolean>(false);
  const [preferredLightTheme, setPreferredLightTheme] = useState<string>('light');
  const [preferredDarkTheme, setPreferredDarkTheme] = useState<string>('dark');

  useEffect(() => {
    // Load preferences from localStorage
    const loadPreferences = () => {
      if (typeof localStorage === 'undefined') return;

      const auto = localStorage.getItem('theme.auto') === 'true';
      const light = localStorage.getItem('theme.preferred.light') || 'light';
      const dark = localStorage.getItem('theme.preferred.dark') || 'dark';

      setAutoTheme(auto);
      setPreferredLightTheme(light);
      setPreferredDarkTheme(dark);
    };

    loadPreferences();
  }, []);

  const savePreferences = (auto: boolean, light: string, dark: string) => {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem('theme.auto', auto.toString());
    localStorage.setItem('theme.preferred.light', light);
    localStorage.setItem('theme.preferred.dark', dark);

    setAutoTheme(auto);
    setPreferredLightTheme(light);
    setPreferredDarkTheme(dark);

    // Apply theme based on new preferences
    if (auto) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeService.loadTheme(isDark ? dark : light);
    }
  };

  useEffect(() => {
    if (!autoTheme) return;

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const themeId = e.matches ? preferredDarkTheme : preferredLightTheme;
      themeService.loadTheme(themeId);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Apply initial theme
    const isDark = mediaQuery.matches;
    themeService.loadTheme(isDark ? preferredDarkTheme : preferredLightTheme);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [autoTheme, preferredLightTheme, preferredDarkTheme]);

  return {
    autoTheme,
    preferredLightTheme,
    preferredDarkTheme,
    savePreferences,
  };
}