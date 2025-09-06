import { describe, test, expect, beforeEach } from 'vitest';
import { RegionManager } from '../../src/layout/regions';

describe('RegionManager', () => {
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager();
  });

  describe('Activity Bar', () => {
    test('should be visible by default', () => {
      const state = regionManager.getState();
      expect(state.activityBar.visible).toBe(true);
    });

    test('should toggle visibility', () => {
      regionManager.toggleRegion('activityBar');
      expect(regionManager.getState().activityBar.visible).toBe(false);
      
      regionManager.toggleRegion('activityBar');
      expect(regionManager.getState().activityBar.visible).toBe(true);
    });

    test('should maintain fixed width', () => {
      const state = regionManager.getState();
      expect(state.activityBar.width).toBe(48);
    });
  });

  describe('Primary Side Bar', () => {
    test('should be visible by default', () => {
      const state = regionManager.getState();
      expect(state.primarySideBar.visible).toBe(true);
    });

    test('should have default width of 280px', () => {
      const state = regionManager.getState();
      expect(state.primarySideBar.width).toBe(280);
    });

    test('should enforce minimum width of 200px', () => {
      regionManager.resizeRegion('primarySideBar', 150);
      expect(regionManager.getState().primarySideBar.width).toBe(200);
    });

    test('should remember width after hiding and showing', () => {
      regionManager.resizeRegion('primarySideBar', 350);
      regionManager.toggleRegion('primarySideBar');
      regionManager.toggleRegion('primarySideBar');
      expect(regionManager.getState().primarySideBar.width).toBe(350);
    });
  });

  describe('Secondary Side Bar', () => {
    test('should be hidden by default', () => {
      const state = regionManager.getState();
      expect(state.secondarySideBar.visible).toBe(false);
    });

    test('should have same width constraints as primary', () => {
      regionManager.resizeRegion('secondarySideBar', 150);
      expect(regionManager.getState().secondarySideBar.width).toBe(200);
    });
  });

  describe('Panel', () => {
    test('should be hidden by default', () => {
      const state = regionManager.getState();
      expect(state.panel.visible).toBe(false);
    });

    test('should default to bottom position', () => {
      const state = regionManager.getState();
      expect(state.panel.position).toBe('bottom');
    });

    test('should be movable between bottom and right', () => {
      regionManager.setPanelPosition('right');
      expect(regionManager.getState().panel.position).toBe('right');
      
      regionManager.setPanelPosition('bottom');
      expect(regionManager.getState().panel.position).toBe('bottom');
    });

    test('should maintain size when position changes', () => {
      regionManager.resizeRegion('panel', 300);
      regionManager.setPanelPosition('right');
      expect(regionManager.getState().panel.height).toBe(300);
      
      regionManager.setPanelPosition('bottom');
      expect(regionManager.getState().panel.height).toBe(300);
    });
  });

  describe('Status Bar', () => {
    test('should be visible by default', () => {
      const state = regionManager.getState();
      expect(state.statusBar.visible).toBe(true);
    });

    test('should have fixed height of 22px', () => {
      const state = regionManager.getState();
      expect(state.statusBar.height).toBe(22);
    });
  });

  describe('Editor Grid', () => {
    test('should always be visible', () => {
      const state = regionManager.getState();
      expect(state.editorGrid.visible).toBe(true);
    });

    test('should not be toggleable', () => {
      const initialState = regionManager.getState().editorGrid.visible;
      regionManager.toggleRegion('editorGrid');
      expect(regionManager.getState().editorGrid.visible).toBe(initialState);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should register default keyboard shortcuts', () => {
      const shortcuts = regionManager.getKeyboardShortcuts();
      
      expect(shortcuts['Ctrl+B']).toBe('toggle-primary-sidebar');
      expect(shortcuts['Ctrl+J']).toBe('toggle-panel');
      expect(shortcuts['Ctrl+K Ctrl+B']).toBe('toggle-secondary-sidebar');
    });
  });
});