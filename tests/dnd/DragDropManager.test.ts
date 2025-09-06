import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DragDropManager, DragState, DropTarget } from '../../src/dnd/DragDropManager';

describe('DragDropManager', () => {
  let manager: DragDropManager;
  let mockDispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatch = vi.fn();
    manager = new DragDropManager(mockDispatch);
  });

  describe('startDrag', () => {
    test('should initialize drag state', () => {
      const dragState: DragState = {
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      };

      manager.startDrag(dragState);
      
      expect(manager.getDragState()).toEqual(dragState);
      expect(manager.isDragging()).toBe(true);
    });

    test('should add dragging class to document body', () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      expect(document.body.classList.contains('dragging')).toBe(true);
    });
  });

  describe('updateDropTarget', () => {
    test('should update current drop target', () => {
      const dropTarget: DropTarget = {
        leafId: 'leaf2',
        position: 'center',
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      };

      manager.updateDropTarget(dropTarget);
      expect(manager.getDropTarget()).toEqual(dropTarget);
    });

    test('should handle edge drop zones', () => {
      const dropTarget: DropTarget = {
        leafId: 'leaf2',
        position: 'left',
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      };

      manager.updateDropTarget(dropTarget);
      expect(manager.getDropTarget()?.position).toBe('left');
    });
  });

  describe('endDrag', () => {
    test('should dispatch MOVE_TAB for center drop', () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      manager.updateDropTarget({
        leafId: 'leaf2',
        position: 'center',
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      });

      manager.endDrag();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'MOVE_TAB',
        payload: {
          tabId: 'tab1',
          targetLeafId: 'leaf2'
        }
      });
    });

    test('should dispatch SPLIT_LEAF for edge drop', async () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      manager.updateDropTarget({
        leafId: 'leaf2',
        position: 'right',
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      });

      manager.endDrag();

      // First call should be SPLIT_LEAF
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SPLIT_LEAF',
        payload: {
          leafId: 'leaf2',
          direction: 'horizontal',
          ratio: 0.5
        }
      });

      // Wait for the setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second call should be MOVE_TAB
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: 'MOVE_TAB',
        payload: {
          tabId: 'tab1',
          targetLeafId: expect.any(String)
        }
      });
    });

    test('should clear drag state', () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      manager.endDrag();

      expect(manager.isDragging()).toBe(false);
      expect(manager.getDragState()).toBeNull();
      expect(manager.getDropTarget()).toBeNull();
    });

    test('should remove dragging class from document body', () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      manager.endDrag();

      expect(document.body.classList.contains('dragging')).toBe(false);
    });
  });

  describe('cancelDrag', () => {
    test('should clear state without dispatching actions', () => {
      manager.startDrag({
        type: 'tab',
        tabId: 'tab1',
        sourceLeafId: 'leaf1',
        dragElement: document.createElement('div')
      });

      manager.updateDropTarget({
        leafId: 'leaf2',
        position: 'center',
        bounds: { x: 0, y: 0, width: 100, height: 100 }
      });

      manager.cancelDrag();

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(manager.isDragging()).toBe(false);
    });
  });

  describe('getDropPosition', () => {
    test('should detect center drop zone', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const position = manager.getDropPosition(50, 50, bounds);
      expect(position).toBe('center');
    });

    test('should detect left drop zone', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const position = manager.getDropPosition(10, 50, bounds);
      expect(position).toBe('left');
    });

    test('should detect right drop zone', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const position = manager.getDropPosition(90, 50, bounds);
      expect(position).toBe('right');
    });

    test('should detect top drop zone', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const position = manager.getDropPosition(50, 10, bounds);
      expect(position).toBe('top');
    });

    test('should detect bottom drop zone', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const position = manager.getDropPosition(50, 90, bounds);
      expect(position).toBe('bottom');
    });
  });

  describe('createDragPreview', () => {
    test('should create preview element', () => {
      const preview = manager.createDragPreview('Test Tab');
      
      expect(preview).toBeInstanceOf(HTMLElement);
      expect(preview.textContent).toBe('Test Tab');
      expect(preview.classList.contains('drag-preview')).toBe(true);
    });

    test('should position preview at cursor', () => {
      const preview = manager.createDragPreview('Test Tab');
      manager.updatePreviewPosition(preview, 100, 200);
      
      expect(preview.style.left).toBe('100px');
      expect(preview.style.top).toBe('200px');
    });
  });
});