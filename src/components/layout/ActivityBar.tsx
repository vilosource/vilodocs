import React from 'react';
import './ActivityBar.css';

export interface ActivityBarItem {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

interface ActivityBarProps {
  items: ActivityBarItem[];
  onItemClick: (itemId: string) => void;
  visible: boolean;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ 
  items, 
  onItemClick, 
  visible 
}) => {
  if (!visible) return null;

  return (
    <div className="activity-bar" role="navigation" aria-label="Activity Bar">
      <div className="activity-bar-items">
        {items.map(item => (
          <button
            key={item.id}
            className={`activity-bar-item ${item.isActive ? 'active' : ''}`}
            onClick={() => onItemClick(item.id)}
            aria-label={item.label}
            aria-pressed={item.isActive}
            title={item.label}
          >
            <span className="activity-bar-icon">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};