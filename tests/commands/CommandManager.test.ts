import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CommandManager, Command } from '../../src/commands/CommandManager';

describe('CommandManager', () => {
  let commandManager: CommandManager;
  let mockDispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatch = vi.fn();
    commandManager = new CommandManager(mockDispatch);
  });

  describe('registerCommand', () => {
    test('should register a command', () => {
      const command: Command = {
        id: 'split.horizontal',
        label: 'Split Horizontally',
        keybinding: 'Ctrl+\\',
        execute: vi.fn()
      };

      commandManager.registerCommand(command);
      expect(commandManager.getCommand('split.horizontal')).toEqual(command);
    });

    test('should override existing command', () => {
      const command1: Command = {
        id: 'test.command',
        label: 'Test 1',
        execute: vi.fn()
      };

      const command2: Command = {
        id: 'test.command',
        label: 'Test 2',
        execute: vi.fn()
      };

      commandManager.registerCommand(command1);
      commandManager.registerCommand(command2);
      
      expect(commandManager.getCommand('test.command')).toEqual(command2);
    });
  });

  describe('executeCommand', () => {
    test('should execute registered command', () => {
      const execute = vi.fn();
      const command: Command = {
        id: 'test.command',
        label: 'Test',
        execute
      };

      commandManager.registerCommand(command);
      commandManager.executeCommand('test.command', { foo: 'bar' });

      expect(execute).toHaveBeenCalledWith({ foo: 'bar' });
    });

    test('should return false for unknown command', () => {
      const result = commandManager.executeCommand('unknown.command');
      expect(result).toBe(false);
    });

    test('should check when condition before executing', () => {
      const execute = vi.fn();
      const command: Command = {
        id: 'test.command',
        label: 'Test',
        execute,
        when: (context) => context.hasActiveEditor === true
      };

      commandManager.registerCommand(command);
      
      // Should not execute when condition is false
      const result1 = commandManager.executeCommand('test.command', { hasActiveEditor: false });
      expect(result1).toBe(false);
      expect(execute).not.toHaveBeenCalled();

      // Should execute when condition is true
      const result2 = commandManager.executeCommand('test.command', { hasActiveEditor: true });
      expect(result2).toBe(true);
      expect(execute).toHaveBeenCalledWith({ hasActiveEditor: true });
    });
  });

  describe('getCommandsByKeybinding', () => {
    test('should find commands by keybinding', () => {
      const command1: Command = {
        id: 'command1',
        label: 'Command 1',
        keybinding: 'Ctrl+A',
        execute: vi.fn()
      };

      const command2: Command = {
        id: 'command2',
        label: 'Command 2',
        keybinding: 'Ctrl+B',
        execute: vi.fn()
      };

      const command3: Command = {
        id: 'command3',
        label: 'Command 3',
        keybinding: 'Ctrl+A', // Same as command1
        execute: vi.fn()
      };

      commandManager.registerCommand(command1);
      commandManager.registerCommand(command2);
      commandManager.registerCommand(command3);

      const commands = commandManager.getCommandsByKeybinding('Ctrl+A');
      expect(commands).toHaveLength(2);
      expect(commands.map(c => c.id)).toContain('command1');
      expect(commands.map(c => c.id)).toContain('command3');
    });

    test('should normalize keybinding format', () => {
      const command: Command = {
        id: 'test',
        label: 'Test',
        keybinding: 'ctrl+shift+p',
        execute: vi.fn()
      };

      commandManager.registerCommand(command);
      
      // Should find with different case
      expect(commandManager.getCommandsByKeybinding('Ctrl+Shift+P')).toHaveLength(1);
    });
  });

  describe('handleKeyboardEvent', () => {
    test('should execute command matching keyboard event', () => {
      const execute = vi.fn();
      const command: Command = {
        id: 'test.command',
        label: 'Test',
        keybinding: 'Ctrl+S',
        execute
      };

      commandManager.registerCommand(command);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });

      const result = commandManager.handleKeyboardEvent(event);
      expect(result).toBe(true);
      expect(execute).toHaveBeenCalled();
    });

    test('should handle multi-chord keybindings', () => {
      const execute = vi.fn();
      const command: Command = {
        id: 'test.command',
        label: 'Test',
        keybinding: 'Ctrl+K Ctrl+S',
        execute
      };

      commandManager.registerCommand(command);

      // First chord
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      });
      commandManager.handleKeyboardEvent(event1);

      // Second chord
      const event2 = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      const result = commandManager.handleKeyboardEvent(event2);
      
      expect(result).toBe(true);
      expect(execute).toHaveBeenCalled();
    });

    test('should timeout multi-chord sequences', async () => {
      const execute = vi.fn();
      const command: Command = {
        id: 'test.command',
        label: 'Test',
        keybinding: 'Ctrl+K Ctrl+S',
        execute
      };

      commandManager.registerCommand(command);
      commandManager.setChordTimeout(100);

      // First chord
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      });
      commandManager.handleKeyboardEvent(event1);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second chord after timeout
      const event2 = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      const result = commandManager.handleKeyboardEvent(event2);
      
      expect(result).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('getAllCommands', () => {
    test('should return all registered commands', () => {
      // CommandManager registers default commands in constructor
      const initialCommandCount = commandManager.getAllCommands().length;
      
      commandManager.registerCommand({
        id: 'command1',
        label: 'Command 1',
        execute: vi.fn()
      });

      commandManager.registerCommand({
        id: 'command2',
        label: 'Command 2',
        execute: vi.fn()
      });

      const commands = commandManager.getAllCommands();
      expect(commands).toHaveLength(initialCommandCount + 2);
      expect(commands.map(c => c.id)).toContain('command1');
      expect(commands.map(c => c.id)).toContain('command2');
    });
  });
});