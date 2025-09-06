import React, { useRef, useEffect } from 'react';
import './SideBar.css';

interface SideBarProps {
  position: 'left' | 'right';
  visible: boolean;
  width: number;
  minWidth?: number;
  onResize?: (newWidth: number) => void;
  children?: React.ReactNode;
  title?: string;
}

export const SideBar: React.FC<SideBarProps> = ({
  position,
  visible,
  width,
  minWidth = 200,
  onResize,
  children,
  title
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !onResize) return;

      const sidebarElement = sidebarRef.current;
      if (!sidebarElement) return;

      const rect = sidebarElement.getBoundingClientRect();
      let newWidth: number;

      if (position === 'left') {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, newWidth);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, minWidth, onResize]);

  const handleGutterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  if (!visible) return null;

  return (
    <div
      ref={sidebarRef}
      className={`sidebar sidebar-${position}`}
      style={{ width: `${width}px` }}
      role="complementary"
      aria-label={title || `${position} sidebar`}
    >
      <div className="sidebar-content">
        {title && (
          <div className="sidebar-header">
            <h2 className="sidebar-title">{title}</h2>
          </div>
        )}
        {children}
      </div>
      <div
        className={`sidebar-gutter sidebar-gutter-${position}`}
        onMouseDown={handleGutterMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        tabIndex={0}
      />
    </div>
  );
};