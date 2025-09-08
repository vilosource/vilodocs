import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CommandPalette, PaletteItem } from '../components/commandPalette/CommandPalette';

interface CommandPaletteContextValue {
  isOpen: boolean;
  openPalette: (mode?: 'files' | 'commands') => void;
  closePalette: () => void;
  togglePalette: () => void;
  registerProvider: (name: string, provider: CommandPaletteProvider) => void;
  unregisterProvider: (name: string) => void;
}

export interface CommandPaletteProvider {
  getItems: (query: string) => PaletteItem[] | Promise<PaletteItem[]>;
  priority?: number;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

export const useCommandPaletteContext = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPaletteContext must be used within CommandPaletteProvider');
  }
  return context;
};

interface CommandPaletteProviderProps {
  children: React.ReactNode;
  commandManager?: any; // Will be properly typed when integrated
}

export const CommandPaletteProvider: React.FC<CommandPaletteProviderProps> = ({ 
  children, 
  commandManager 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<'files' | 'commands'>('files');
  const providersRef = useRef<Map<string, CommandPaletteProvider>>(new Map());

  const openPalette = useCallback((mode: 'files' | 'commands' = 'files') => {
    setInitialMode(mode);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePalette = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const registerProvider = useCallback((name: string, provider: CommandPaletteProvider) => {
    providersRef.current.set(name, provider);
  }, []);

  const unregisterProvider = useCallback((name: string) => {
    providersRef.current.delete(name);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P or Cmd+Shift+P: Open command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openPalette('commands');
        return;
      }
      
      // Ctrl+P or Cmd+P: Open file palette
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openPalette('files');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPalette]);

  // Register default command provider if commandManager is provided
  useEffect(() => {
    if (commandManager) {
      const commandProvider: CommandPaletteProvider = {
        getItems: (query) => {
          const commands = commandManager.getAllCommands();
          const lowerQuery = query.toLowerCase();
          
          return commands
            .filter((cmd: any) => 
              cmd.label.toLowerCase().includes(lowerQuery) ||
              cmd.id.toLowerCase().includes(lowerQuery)
            )
            .map((cmd: any) => ({
              id: cmd.id,
              label: cmd.label,
              description: cmd.id,
              keybinding: cmd.keybinding,
              category: 'Commands',
              action: () => commandManager.executeCommand(cmd.id)
            }));
        },
        priority: 10
      };
      
      registerProvider('commands', commandProvider);
      
      return () => {
        unregisterProvider('commands');
      };
    }
  }, [commandManager, registerProvider, unregisterProvider]);

  const value: CommandPaletteContextValue = {
    isOpen,
    openPalette,
    closePalette,
    togglePalette,
    registerProvider,
    unregisterProvider
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette 
        isOpen={isOpen} 
        onClose={closePalette}
      />
    </CommandPaletteContext.Provider>
  );
};