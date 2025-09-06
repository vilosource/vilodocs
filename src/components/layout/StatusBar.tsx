import React from 'react';
import './StatusBar.css';

export interface StatusBarItem {
  id: string;
  content: React.ReactNode;
  position: 'left' | 'right';
  priority?: number;
  onClick?: () => void;
}

interface StatusBarProps {
  visible: boolean;
  items: StatusBarItem[];
}

export const StatusBar: React.FC<StatusBarProps> = ({ visible, items }) => {
  if (!visible) return null;

  const leftItems = items
    .filter(item => item.position === 'left')
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const rightItems = items
    .filter(item => item.position === 'right')
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  return (
    <div className="status-bar" role="status" aria-label="Status Bar">
      <div className="status-bar-left">
        {leftItems.map(item => (
          <div
            key={item.id}
            className={`status-bar-item ${item.onClick ? 'clickable' : ''}`}
            onClick={item.onClick}
            role={item.onClick ? 'button' : undefined}
            tabIndex={item.onClick ? 0 : undefined}
          >
            {item.content}
          </div>
        ))}
      </div>
      <div className="status-bar-right">
        {rightItems.map(item => (
          <div
            key={item.id}
            className={`status-bar-item ${item.onClick ? 'clickable' : ''}`}
            onClick={item.onClick}
            role={item.onClick ? 'button' : undefined}
            tabIndex={item.onClick ? 0 : undefined}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};