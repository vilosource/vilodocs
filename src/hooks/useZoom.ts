import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseZoomOptions {
  /** Initial zoom level (default: 100) */
  initialZoom?: number;
  /** Minimum zoom level in percent (default: 50) */
  minZoom?: number;
  /** Maximum zoom level in percent (default: 200) */
  maxZoom?: number;
  /** Zoom step in percent (default: 10) */
  zoomStep?: number;
  /** Whether this element is currently active/focused */
  isActive?: boolean;
  /** Callback when zoom changes */
  onZoomChange?: (zoomLevel: number) => void;
}

/**
 * Hook that adds zoom functionality to an element with keyboard shortcuts and mouse wheel.
 * Implements browser-style zoom controls.
 */
export function useZoom(
  containerRef: RefObject<HTMLElement>,
  options: UseZoomOptions = {}
) {
  const {
    initialZoom = 100,
    minZoom = 50,
    maxZoom = 200,
    zoomStep = 10,
    isActive = true,
    onZoomChange
  } = options;

  const [zoomLevel, setZoomLevel] = useState(initialZoom);

  // Apply zoom level to the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply CSS transform for zoom
    container.style.transformOrigin = 'top left';
    container.style.transform = `scale(${zoomLevel / 100})`;
    
    // Adjust container dimensions to account for scaling
    const parent = container.parentElement;
    if (parent) {
      const scale = zoomLevel / 100;
      // Adjust the parent's scroll dimensions
      parent.style.overflow = 'auto';
      
      // If we're zooming in, we need to adjust the container size
      if (scale !== 1) {
        container.style.width = `${100 / scale}%`;
        container.style.height = `${100 / scale}%`;
      } else {
        container.style.width = '100%';
        container.style.height = '100%';
      }
    }

    // Call the callback if provided
    onZoomChange?.(zoomLevel);
  }, [zoomLevel, containerRef, onZoomChange]);

  // Zoom in function
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + zoomStep, maxZoom);
      return newZoom;
    });
  }, [zoomStep, maxZoom]);

  // Zoom out function
  const zoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - zoomStep, minZoom);
      return newZoom;
    });
  }, [zoomStep, minZoom]);

  // Reset zoom to 100%
  const resetZoom = useCallback(() => {
    setZoomLevel(100);
  }, []);

  // Set specific zoom level
  const setZoom = useCallback((level: number) => {
    const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level));
    setZoomLevel(clampedLevel);
  }, [minZoom, maxZoom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd key
      if (!(event.ctrlKey || event.metaKey)) return;

      let handled = true;

      switch (event.key) {
        case '+':
        case '=': // Plus key without shift
          event.preventDefault();
          zoomIn();
          break;

        case '-':
        case '_': // Minus key
          event.preventDefault();
          zoomOut();
          break;

        case '0':
          event.preventDefault();
          resetZoom();
          break;

        default:
          handled = false;
      }

      // Also handle numpad keys
      if (event.code === 'NumpadAdd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        zoomIn();
      } else if (event.code === 'NumpadSubtract' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, zoomIn, zoomOut, resetZoom]);

  // Handle mouse wheel with Ctrl/Cmd
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) return;

    const handleWheel = (event: WheelEvent) => {
      // Check for Ctrl/Cmd key
      if (!(event.ctrlKey || event.metaKey)) return;

      event.preventDefault();

      // Determine zoom direction based on wheel delta
      // Note: deltaY is negative when scrolling up (zoom in)
      if (event.deltaY < 0) {
        zoomIn();
      } else if (event.deltaY > 0) {
        zoomOut();
      }
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, isActive, zoomIn, zoomOut]);

  // Return zoom controls and current level
  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    canZoomIn: zoomLevel < maxZoom,
    canZoomOut: zoomLevel > minZoom,
  };
}

/**
 * Format zoom level for display
 */
export function formatZoomLevel(zoomLevel: number): string {
  return `${Math.round(zoomLevel)}%`;
}

export default useZoom;