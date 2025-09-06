/**
 * Storage utilities for development and debugging
 */

/**
 * Clears all localStorage data and reloads the application
 */
export function clearStorageAndReload(): void {
  console.log('Clearing all localStorage...');
  localStorage.clear();
  console.log('Storage cleared. Reloading...');
  window.location.reload();
}

/**
 * Clears only the layout persistence data
 */
export function clearLayoutStorage(): void {
  console.log('Clearing layout storage...');
  localStorage.removeItem('vilodocs-layout');
  localStorage.removeItem('vilodocs-layout-backup');
  console.log('Layout storage cleared');
}

/**
 * Exports current localStorage for debugging
 */
export function exportStorage(): Record<string, any> {
  const storage: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        storage[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        storage[key] = localStorage.getItem(key);
      }
    }
  }
  return storage;
}

/**
 * Logs current storage contents to console
 */
export function debugStorage(): void {
  console.log('=== LocalStorage Debug ===');
  const storage = exportStorage();
  console.log('Storage contents:', storage);
  console.log('Storage size:', JSON.stringify(storage).length, 'bytes');
  console.log('==========================');
}

// Expose utilities to window for development console access
if (process.env.NODE_ENV === 'development') {
  (window as any).storageUtils = {
    clear: clearStorageAndReload,
    clearLayout: clearLayoutStorage,
    export: exportStorage,
    debug: debugStorage
  };
  
  console.log('Storage utilities available at window.storageUtils');
  console.log('- storageUtils.clear() - Clear all storage and reload');
  console.log('- storageUtils.clearLayout() - Clear only layout storage');
  console.log('- storageUtils.export() - Export storage contents');
  console.log('- storageUtils.debug() - Debug storage contents');
}