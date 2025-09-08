import React, { memo } from 'react';
import { PaletteItem } from './CommandPalette';

interface CommandPaletteItemProps {
  item: PaletteItem;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
  query: string;
}

export const CommandPaletteItem = memo<CommandPaletteItemProps>(({
  item,
  isSelected,
  onClick,
  onHover,
  query
}) => {
  // Highlight matching characters in the label
  const highlightMatches = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery) return text;
    
    const parts: React.ReactNode[] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    
    // Simple substring matching for now (will be replaced with fuzzy matching)
    const index = lowerText.indexOf(lowerQuery);
    if (index !== -1) {
      if (index > 0) {
        parts.push(text.substring(0, index));
      }
      parts.push(
        <span key={index} className="match-highlight">
          {text.substring(index, index + searchQuery.length)}
        </span>
      );
      if (index + searchQuery.length < text.length) {
        parts.push(text.substring(index + searchQuery.length));
      }
      return parts;
    }
    
    return text;
  };

  return (
    <div
      className={`command-palette-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {item.icon && (
        <span className="command-palette-item-icon">{item.icon}</span>
      )}
      
      <div className="command-palette-item-content">
        <div className="command-palette-item-label">
          {highlightMatches(item.label, query)}
        </div>
        {item.description && (
          <div className="command-palette-item-description">
            {item.description}
          </div>
        )}
      </div>
      
      <div className="command-palette-item-meta">
        {item.category && (
          <span className="command-palette-item-category">{item.category}</span>
        )}
        {item.keybinding && (
          <kbd className="command-palette-item-keybinding">{item.keybinding}</kbd>
        )}
      </div>
    </div>
  );
});

CommandPaletteItem.displayName = 'CommandPaletteItem';