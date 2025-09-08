import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CommandPaletteItem } from './CommandPaletteItem';
import { CommandPaletteInput } from './CommandPaletteInput';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import './CommandPalette.css';

export interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  keybinding?: string;
  score?: number;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'files' | 'commands' | 'symbols' | 'line'>('files');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { getItems, executeItem } = useCommandPalette();

  // Determine mode based on query prefix
  useEffect(() => {
    if (query.startsWith('>')) {
      setMode('commands');
    } else if (query.startsWith('@')) {
      setMode('symbols');
    } else if (query.startsWith(':')) {
      setMode('line');
    } else {
      setMode('files');
    }
  }, [query]);

  // Get filtered items based on mode and query
  const items = useMemo(() => {
    const searchQuery = mode === 'files' ? query : query.slice(1);
    return getItems(mode, searchQuery);
  }, [mode, query, getItems]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, items.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, items.length)) % Math.max(1, items.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (items[selectedIndex]) {
          executeItem(items[selectedIndex]);
          onClose();
          setQuery('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (query) {
          setQuery('');
        } else {
          onClose();
        }
        break;
      case 'Tab':
        e.preventDefault();
        // Tab cycles through modes
        if (e.shiftKey) {
          // Cycle backwards through modes
          const modes: Array<'files' | 'commands'> = ['files', 'commands'];
          const currentIndex = modes.indexOf(mode as any);
          if (currentIndex !== -1) {
            const newIndex = (currentIndex - 1 + modes.length) % modes.length;
            const prefix = newIndex === 1 ? '>' : '';
            setQuery(prefix);
          }
        } else {
          // Cycle forward through modes
          const modes: Array<'files' | 'commands'> = ['files', 'commands'];
          const currentIndex = modes.indexOf(mode as any);
          if (currentIndex !== -1) {
            const newIndex = (currentIndex + 1) % modes.length;
            const prefix = newIndex === 1 ? '>' : '';
            setQuery(prefix);
          }
        }
        break;
    }
  }, [items, selectedIndex, executeItem, onClose, query, mode]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('.command-palette-item');
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="command-palette-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div ref={containerRef} className="command-palette-container">
        <CommandPaletteInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          placeholder={getPlaceholder(mode)}
          onKeyDown={handleKeyDown}
        />
        
        <div ref={listRef} className="command-palette-list">
          {items.length === 0 ? (
            <div className="command-palette-empty">
              {query ? 'No matching results' : getEmptyMessage(mode)}
            </div>
          ) : (
            items.map((item, index) => (
              <CommandPaletteItem
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                onClick={() => {
                  executeItem(item);
                  onClose();
                  setQuery('');
                }}
                onHover={() => setSelectedIndex(index)}
                query={mode === 'files' ? query : query.slice(1)}
              />
            ))
          )}
        </div>
        
        <div className="command-palette-footer">
          <div className="command-palette-hints">
            <span className="hint-item">
              <kbd>↑↓</kbd> Navigate
            </span>
            <span className="hint-item">
              <kbd>Enter</kbd> Select
            </span>
            <span className="hint-item">
              <kbd>Esc</kbd> Close
            </span>
            <span className="hint-item">
              <kbd>Tab</kbd> Switch Mode
            </span>
          </div>
          <div className="command-palette-mode">
            {getModeLabel(mode)}
          </div>
        </div>
      </div>
    </div>
  );
};

function getPlaceholder(mode: string): string {
  switch (mode) {
    case 'commands':
      return 'Type a command...';
    case 'symbols':
      return 'Go to symbol...';
    case 'line':
      return 'Go to line...';
    default:
      return 'Search files or type > for commands';
  }
}

function getEmptyMessage(mode: string): string {
  switch (mode) {
    case 'commands':
      return 'Type to search commands';
    case 'symbols':
      return 'No symbols in current file';
    case 'line':
      return 'Enter a line number';
    default:
      return 'Start typing to search files';
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'commands':
      return 'Commands';
    case 'symbols':
      return 'Symbols';
    case 'line':
      return 'Go to Line';
    default:
      return 'Files';
  }
}