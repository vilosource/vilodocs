import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropManager, DragState, DropTarget } from '../dnd/DragDropManager';
import { LayoutAction } from '../state/layoutReducer';

interface UseDragDropOptions {
  dispatch: (action: LayoutAction) => void;
  leafId: string;
  tabId?: string;
}

interface UseDragDropReturn {
  isDragging: boolean;
  isOver: boolean;
  dropPosition: 'center' | 'left' | 'right' | 'top' | 'bottom' | null;
  handleDragStart: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragEnd: (e: React.DragEvent) => void;
}

let globalDragDropManager: DragDropManager | null = null;

export function useDragDrop({ dispatch, leafId, tabId }: UseDragDropOptions): UseDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<'center' | 'left' | 'right' | 'top' | 'bottom' | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);

  // Initialize global manager if needed
  useEffect(() => {
    if (!globalDragDropManager) {
      globalDragDropManager = new DragDropManager(dispatch);
    }
  }, [dispatch]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!tabId || !globalDragDropManager) return;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
    
    const dragState: DragState = {
      type: 'tab',
      tabId,
      sourceLeafId: leafId,
      dragElement: e.currentTarget as HTMLElement
    };
    
    globalDragDropManager.startDrag(dragState);
    setIsDragging(true);

    // Create drag preview
    const tabTitle = (e.currentTarget as HTMLElement).textContent || 'Tab';
    dragPreviewRef.current = globalDragDropManager.createDragPreview(tabTitle);
  }, [tabId, leafId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!globalDragDropManager || !globalDragDropManager.isDragging()) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const bounds = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
    
    const position = globalDragDropManager.getDropPosition(e.clientX, e.clientY, bounds);
    setDropPosition(position);
    setIsOver(true);
    
    const dropTarget: DropTarget = {
      leafId,
      position,
      bounds
    };
    
    globalDragDropManager.updateDropTarget(dropTarget);

    // Update preview position
    if (dragPreviewRef.current) {
      globalDragDropManager.updatePreviewPosition(
        dragPreviewRef.current,
        e.clientX + 10,
        e.clientY + 10
      );
    }
  }, [leafId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only handle if leaving the actual drop zone
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (e.currentTarget as HTMLElement).contains(relatedTarget)) {
      return;
    }
    
    setIsOver(false);
    setDropPosition(null);
    
    if (globalDragDropManager) {
      globalDragDropManager.updateDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!globalDragDropManager) return;
    
    globalDragDropManager.endDrag();
    
    setIsOver(false);
    setDropPosition(null);
    setIsDragging(false);

    // Clean up preview
    if (dragPreviewRef.current) {
      dragPreviewRef.current.remove();
      dragPreviewRef.current = null;
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (globalDragDropManager) {
      globalDragDropManager.cancelDrag();
    }
    
    setIsDragging(false);
    setIsOver(false);
    setDropPosition(null);

    // Clean up preview
    if (dragPreviewRef.current) {
      dragPreviewRef.current.remove();
      dragPreviewRef.current = null;
    }
  }, []);

  // Update preview position on mouse move during drag
  useEffect(() => {
    if (!isDragging || !dragPreviewRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragPreviewRef.current && globalDragDropManager) {
        globalDragDropManager.updatePreviewPosition(
          dragPreviewRef.current,
          e.clientX + 10,
          e.clientY + 10
        );
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  return {
    isDragging,
    isOver,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
}