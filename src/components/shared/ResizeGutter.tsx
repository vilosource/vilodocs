import React, { useRef, useEffect, useCallback } from 'react';
import './ResizeGutter.css';

interface ResizeGutterProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onDoubleClick?: () => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const ResizeGutter: React.FC<ResizeGutterProps> = ({
  orientation,
  onResize,
  onDoubleClick,
  min,
  max,
  step = 5,
  className = ''
}) => {
  const isResizing = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const accumulatedDelta = useRef(0);

  const constrainDelta = (delta: number): number => {
    if (min !== undefined && delta < min) return 0;
    if (max !== undefined && delta > max) return 0;
    return delta;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    isResizing.current = true;
    startPos.current = { x: event.clientX, y: event.clientY };
    accumulatedDelta.current = 0;
    
    document.body.style.cursor = orientation === 'vertical' ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing.current || !startPos.current) return;

    let delta: number;
    if (orientation === 'vertical') {
      delta = event.clientX - startPos.current.x;
    } else {
      delta = event.clientY - startPos.current.y;
    }

    const constrainedDelta = constrainDelta(delta);
    
    if (constrainedDelta !== 0 && constrainedDelta !== accumulatedDelta.current) {
      const deltaDiff = constrainedDelta - accumulatedDelta.current;
      accumulatedDelta.current = constrainedDelta;
      onResize(deltaDiff);
    }
  }, [orientation, onResize, min, max]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    startPos.current = null;
    accumulatedDelta.current = 0;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    let delta = 0;
    
    if (orientation === 'vertical') {
      if (event.key === 'ArrowLeft') delta = -step;
      if (event.key === 'ArrowRight') delta = step;
      if (event.shiftKey) delta *= 5; // Larger steps with shift
    } else {
      if (event.key === 'ArrowUp') delta = -step;
      if (event.key === 'ArrowDown') delta = step;
      if (event.shiftKey) delta *= 5;
    }
    
    if (delta !== 0) {
      event.preventDefault();
      const constrainedDelta = constrainDelta(delta);
      if (constrainedDelta !== 0) {
        onResize(constrainedDelta);
      }
    }
    
    // Home/End keys for min/max
    if (event.key === 'Home' && min !== undefined) {
      event.preventDefault();
      onResize(-Infinity); // Signal to set to minimum
    }
    if (event.key === 'End' && max !== undefined) {
      event.preventDefault();
      onResize(Infinity); // Signal to set to maximum
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick?.();
  };

  return (
    <div
      className={`resize-gutter resize-gutter-${orientation} ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-orientation={orientation}
      aria-label={`Resize ${orientation === 'vertical' ? 'panels horizontally' : 'panels vertically'}`}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
    />
  );
};