import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FocusManager } from '../../src/focus/FocusManager';

describe('FocusManager', () => {
  let focusManager: FocusManager;

  beforeEach(() => {
    focusManager = new FocusManager();
  });

  describe('registerFocusable', () => {
    test('should register a focusable element', () => {
      const element = document.createElement('div');
      focusManager.registerFocusable('leaf1', element, 'leaf');
      
      expect(focusManager.getFocusableElement('leaf1')).toBe(element);
    });

    test('should organize focusables by group', () => {
      const leaf1 = document.createElement('div');
      const leaf2 = document.createElement('div');
      const panel = document.createElement('div');
      
      focusManager.registerFocusable('leaf1', leaf1, 'leaf');
      focusManager.registerFocusable('leaf2', leaf2, 'leaf');
      focusManager.registerFocusable('panel1', panel, 'panel');
      
      const leaves = focusManager.getFocusablesInGroup('leaf');
      expect(leaves).toHaveLength(2);
      expect(leaves.map(f => f.id)).toContain('leaf1');
      expect(leaves.map(f => f.id)).toContain('leaf2');
    });
  });

  describe('focus', () => {
    test('should focus element by id', () => {
      const element = document.createElement('div');
      element.focus = vi.fn();
      element.tabIndex = -1;
      
      focusManager.registerFocusable('test', element, 'leaf');
      focusManager.focus('test');
      
      expect(element.focus).toHaveBeenCalled();
    });

    test('should track focus history', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      
      focusManager.focus('elem1');
      focusManager.focus('elem2');
      
      const history = focusManager.getFocusHistory();
      expect(history).toEqual(['elem1', 'elem2']);
    });

    test('should update current focus', () => {
      const element = document.createElement('div');
      element.focus = vi.fn();
      
      focusManager.registerFocusable('test', element, 'leaf');
      focusManager.focus('test');
      
      expect(focusManager.getCurrentFocus()).toBe('test');
    });
  });

  describe('focusNext', () => {
    test('should focus next element in group', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      const elem3 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      elem3.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      focusManager.registerFocusable('elem3', elem3, 'leaf');
      
      focusManager.focus('elem1');
      focusManager.focusNext('leaf');
      
      expect(elem2.focus).toHaveBeenCalled();
      expect(focusManager.getCurrentFocus()).toBe('elem2');
    });

    test('should wrap around to first element', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      
      focusManager.focus('elem2');
      focusManager.focusNext('leaf');
      
      expect(elem1.focus).toHaveBeenCalled();
    });
  });

  describe('focusPrevious', () => {
    test('should focus previous element in group', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      
      focusManager.focus('elem2');
      focusManager.focusPrevious('leaf');
      
      expect(elem1.focus).toHaveBeenCalled();
    });

    test('should wrap around to last element', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      
      focusManager.focus('elem1');
      focusManager.focusPrevious('leaf');
      
      expect(elem2.focus).toHaveBeenCalled();
    });
  });

  describe('focusLastActive', () => {
    test('should focus last active element from history', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      const elem3 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      elem3.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      focusManager.registerFocusable('elem3', elem3, 'leaf');
      
      focusManager.focus('elem1');
      focusManager.focus('elem2');
      focusManager.focus('elem3');
      
      // Remove current from history
      focusManager.unregisterFocusable('elem3');
      
      focusManager.focusLastActive();
      expect(elem2.focus).toHaveBeenCalled();
    });
  });

  describe('unregisterFocusable', () => {
    test('should remove focusable element', () => {
      const element = document.createElement('div');
      focusManager.registerFocusable('test', element, 'leaf');
      focusManager.unregisterFocusable('test');
      
      expect(focusManager.getFocusableElement('test')).toBeUndefined();
    });

    test('should remove from focus history', () => {
      const elem1 = document.createElement('div');
      const elem2 = document.createElement('div');
      elem1.focus = vi.fn();
      elem2.focus = vi.fn();
      
      focusManager.registerFocusable('elem1', elem1, 'leaf');
      focusManager.registerFocusable('elem2', elem2, 'leaf');
      
      focusManager.focus('elem1');
      focusManager.focus('elem2');
      
      focusManager.unregisterFocusable('elem1');
      
      const history = focusManager.getFocusHistory();
      expect(history).not.toContain('elem1');
      expect(history).toContain('elem2');
    });
  });

  describe('trapFocus', () => {
    test('should trap focus within group', () => {
      const leaf1 = document.createElement('div');
      const leaf2 = document.createElement('div');
      const panel = document.createElement('div');
      leaf1.focus = vi.fn();
      leaf2.focus = vi.fn();
      panel.focus = vi.fn();
      
      focusManager.registerFocusable('leaf1', leaf1, 'leaf');
      focusManager.registerFocusable('leaf2', leaf2, 'leaf');
      focusManager.registerFocusable('panel1', panel, 'panel');
      
      focusManager.trapFocus('leaf');
      
      // Should only cycle within leaf group
      focusManager.focus('leaf1');
      focusManager.focusNext(); // Should use trapped group
      
      expect(leaf2.focus).toHaveBeenCalled();
      expect(panel.focus).not.toHaveBeenCalled();
    });

    test('should release focus trap', () => {
      focusManager.trapFocus('leaf');
      expect(focusManager.isTrapped()).toBe(true);
      
      focusManager.releaseTrap();
      expect(focusManager.isTrapped()).toBe(false);
    });
  });
});