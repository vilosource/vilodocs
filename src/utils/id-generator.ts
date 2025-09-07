/**
 * Generates unique IDs for tabs, panes, and other components.
 * Uses a combination of timestamp and counter to ensure uniqueness.
 */

let counter = 0;

/**
 * Generates a unique ID with a prefix
 * @param prefix - The prefix for the ID (e.g., 'tab', 'file', 'pane')
 * @returns A unique ID string
 */
export function generateUniqueId(prefix = 'id'): string {
  // Reset counter periodically to avoid overflow
  if (counter > 999999) {
    counter = 0;
  }
  
  // Combine timestamp with incrementing counter for guaranteed uniqueness
  // Even if called multiple times in the same millisecond
  const timestamp = Date.now();
  const uniquePart = `${timestamp}-${counter++}`;
  
  return `${prefix}-${uniquePart}`;
}

/**
 * Generates a unique ID for a file tab based on the file path
 * @param filePath - The file path
 * @returns A unique ID for the file tab
 */
export function generateFileTabId(filePath: string): string {
  // Use file path hash combined with counter for uniqueness
  // This ensures the same file can be opened multiple times if needed
  const pathHash = hashCode(filePath);
  return generateUniqueId(`file-${pathHash}`);
}

/**
 * Simple hash function for strings
 * @param str - String to hash
 * @returns Hash code
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Export a singleton instance for consistent ID generation across the app
export const idGenerator = {
  generateId: generateUniqueId,
  generateFileTabId,
  /**
   * Resets the counter - useful for testing
   */
  reset: () => {
    counter = 0;
  }
};