import React, { forwardRef } from 'react';

interface CommandPaletteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CommandPaletteInput = forwardRef<HTMLInputElement, CommandPaletteInputProps>(
  ({ value, onChange, placeholder, onKeyDown }, ref) => {
    return (
      <div className="command-palette-input-container">
        <input
          ref={ref}
          type="text"
          className="command-palette-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            className="command-palette-clear"
            onClick={() => onChange('')}
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

CommandPaletteInput.displayName = 'CommandPaletteInput';