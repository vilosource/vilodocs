import React from 'react';
import './DockOverlay.css';

interface DockOverlayProps {
  visible: boolean;
  position: 'center' | 'left' | 'right' | 'top' | 'bottom';
  bounds: { x: number; y: number; width: number; height: number };
}

export const DockOverlay: React.FC<DockOverlayProps> = ({
  visible,
  position,
  bounds
}) => {
  if (!visible) return null;

  // Calculate overlay position based on drop position
  const overlayBounds = { ...bounds };
  
  switch (position) {
    case 'left':
      overlayBounds.width = bounds.width / 2;
      break;
    case 'right':
      overlayBounds.x = bounds.x + bounds.width / 2;
      overlayBounds.width = bounds.width / 2;
      break;
    case 'top':
      overlayBounds.height = bounds.height / 2;
      break;
    case 'bottom':
      overlayBounds.y = bounds.y + bounds.height / 2;
      overlayBounds.height = bounds.height / 2;
      break;
    case 'center':
    default:
      // Use full bounds for center
      break;
  }

  return (
    <div
      className={`dock-overlay dock-overlay-${position}`}
      data-testid="dock-overlay"
      style={{
        position: 'fixed',
        left: `${overlayBounds.x}px`,
        top: `${overlayBounds.y}px`,
        width: `${overlayBounds.width}px`,
        height: `${overlayBounds.height}px`
      }}
    >
      <div className="dock-overlay-inner" />
    </div>
  );
};