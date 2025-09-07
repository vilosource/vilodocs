import React, { useRef, useState, useEffect, useCallback } from 'react';
import './SplitContainer.css';

interface SplitContainerProps {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  minSize?: number;
  onSizesChange?: (newSizes: number[]) => void;
  children: React.ReactNode[];
}

export const SplitContainer: React.FC<SplitContainerProps> = ({
  direction,
  sizes,
  minSize = 50,
  onSizesChange,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localSizes, setLocalSizes] = useState(sizes);
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const initialMousePos = useRef<{ x: number; y: number } | null>(null);
  const initialSizes = useRef<number[]>([]);

  useEffect(() => {
    setLocalSizes(sizes);
  }, [sizes]);

  const normalizeSizes = (newSizes: number[]): number[] => {
    const total = newSizes.reduce((sum, size) => sum + size, 0);
    return newSizes.map(size => (size / total) * 100);
  };

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    setResizingIndex(index);
    initialMousePos.current = { x: event.clientX, y: event.clientY };
    initialSizes.current = [...localSizes];
    
    document.body.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (resizingIndex === null || !initialMousePos.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const totalSize = direction === 'horizontal' ? rect.width : rect.height;
    const mousePos = direction === 'horizontal' ? event.clientX : event.clientY;
    const initialPos = direction === 'horizontal' ? initialMousePos.current.x : initialMousePos.current.y;
    
    const delta = ((mousePos - initialPos) / totalSize) * 100;
    
    const newSizes = [...initialSizes.current];
    const minSizePercent = (minSize / totalSize) * 100;
    
    // Adjust the two panels around the gutter
    newSizes[resizingIndex] = Math.max(minSizePercent, newSizes[resizingIndex] + delta);
    newSizes[resizingIndex + 1] = Math.max(minSizePercent, newSizes[resizingIndex + 1] - delta);
    
    const normalized = normalizeSizes(newSizes);
    setLocalSizes(normalized);
    onSizesChange?.(normalized);
  }, [resizingIndex, direction, minSize, onSizesChange]);

  const handleMouseUp = useCallback(() => {
    setResizingIndex(null);
    initialMousePos.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (resizingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingIndex, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = (index: number) => {
    const count = children.length;
    const equalSizes = Array(count).fill(100 / count);
    setLocalSizes(equalSizes);
    onSizesChange?.(equalSizes);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    const step = 5; // 5% step for keyboard navigation
    let delta = 0;
    
    if (direction === 'horizontal') {
      if (event.key === 'ArrowLeft') delta = -step;
      if (event.key === 'ArrowRight') delta = step;
    } else {
      if (event.key === 'ArrowUp') delta = -step;
      if (event.key === 'ArrowDown') delta = step;
    }
    
    if (delta !== 0) {
      event.preventDefault();
      const newSizes = [...localSizes];
      const totalSize = direction === 'horizontal' 
        ? containerRef.current?.offsetWidth || 1 
        : containerRef.current?.offsetHeight || 1;
      
      const minSizePercent = (minSize / totalSize) * 100;
      
      newSizes[index] = Math.max(minSizePercent, newSizes[index] + delta);
      newSizes[index + 1] = Math.max(minSizePercent, newSizes[index + 1] - delta);
      
      const normalized = normalizeSizes(newSizes);
      setLocalSizes(normalized);
      onSizesChange?.(normalized);
    }
  };

  const childArray = React.Children.toArray(children);

  return (
    <div 
      ref={containerRef}
      className={`split-container split-${direction}`}
      style={{
        flexDirection: direction === 'horizontal' ? 'row' : 'column'
      }}
    >
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          <div 
            className="split-panel"
            style={{ 
              flex: `${localSizes[index]} 1 0`,
              minHeight: direction === 'vertical' ? '50px' : '0',
              minWidth: direction === 'horizontal' ? '50px' : '0'
            }}
          >
            {child}
          </div>
          {index < childArray.length - 1 && (
            <div
              className={`split-gutter split-gutter-${direction}`}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onDoubleClick={() => handleDoubleClick(index)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              role="separator"
              aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
              aria-label="Resize panels"
              tabIndex={0}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};