export { ThemeService } from '../../services/ThemeService';
export type { Theme, ThemeColors, SemanticColors, SyntaxColors, ThemeMetadata } from '../../services/ThemeService';

// Re-export the singleton instance for convenience
import { ThemeService } from '../../services/ThemeService';
export const themeService = ThemeService.getInstance();