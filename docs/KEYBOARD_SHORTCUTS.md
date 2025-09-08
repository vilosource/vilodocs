# Keyboard Shortcuts

## File Operations

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+O` | Open File | Open a file from the file system |
| `Ctrl+Shift+O` | Open Folder | Open a folder in the file explorer |
| `Ctrl+S` | Save | Save the current file |
| `Ctrl+Shift+S` | Save As | Save the current file with a new name |
| `Ctrl+N` | New File | Create a new untitled file |

## Editor Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+P` | Navigate to Pane | Show number overlays to quickly jump to any pane |
| `Alt+←` | Focus Left Pane | Move focus to the pane on the left |
| `Alt+→` | Focus Right Pane | Move focus to the pane on the right |
| `Alt+↑` | Focus Above Pane | Move focus to the pane above |
| `Alt+↓` | Focus Below Pane | Move focus to the pane below |
| `F6` | Next Pane | Cycle focus to the next pane |
| `Shift+F6` | Previous Pane | Cycle focus to the previous pane |

## Split Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+\` | Split Right | Split the current editor horizontally |
| `Ctrl+Alt+\` | Split Down | Split the current editor vertically |
| `Ctrl+Shift+W` | Close Split | Close the current split pane |
| `Ctrl+Alt+→` | Move Tab to Next Split | Move current tab to the next split |
| `Ctrl+Alt+←` | Move Tab to Previous Split | Move current tab to the previous split |

## Tab Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Tab` | Next Tab | Switch to the next tab in current pane |
| `Ctrl+Shift+Tab` | Previous Tab | Switch to the previous tab in current pane |
| `Ctrl+W` | Close Tab | Close the current tab |
| `Ctrl+K Ctrl+W` | Close All Tabs | Close all tabs in current pane (chord) |

## View Controls

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+B` | Toggle Sidebar | Show/hide the primary sidebar |
| `Ctrl+J` | Toggle Panel | Show/hide the bottom panel |
| `Alt+M` | Toggle Focus Mode | Enter/exit focus mode for current tab |
| `Ctrl+Shift+E` | Show Explorer | Focus on the file explorer |

## Zoom Controls

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+=` | Zoom In | Increase editor font size |
| `Ctrl+-` | Zoom Out | Decrease editor font size |
| `Ctrl+0` | Reset Zoom | Reset editor to default font size |
| `Ctrl+Scroll` | Zoom with Mouse | Use mouse wheel to zoom |

## Command Palette

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+P` | Command Palette | Open command palette |
| `Ctrl+P` | Quick Open | Quick open files by name |

## Pane Navigation Mode

When pane navigation is active (after pressing `Alt+P`):

| Key | Action |
|-----|--------|
| `1-9` | Focus pane with corresponding number |
| `ESC` | Cancel navigation mode |
| Click number | Focus that pane |
| Click backdrop | Cancel navigation mode |

## Chord Commands

Chord commands require pressing two key combinations in sequence:

| Chord | Action | Description |
|-------|--------|-------------|
| `Ctrl+K` then `Ctrl+W` | Close All Tabs | Close all tabs in the current pane |

## Platform-Specific Notes

### macOS
- Replace `Ctrl` with `Cmd` for most shortcuts
- Replace `Alt` with `Option`

### Linux/Windows
- Shortcuts work as listed above

## Customization

Keyboard shortcuts can be customized by modifying the command registration in:
- `src/commands/CommandManager.ts` - Core editor commands
- Component-specific command handlers

## Tips

1. **Quick Pane Navigation**: Use `Alt+P` followed by a number for instant pane switching
2. **Efficient Split Layout**: Combine split commands with pane navigation for complex layouts
3. **Focus Mode**: Use `Alt+M` to hide distractions when focusing on a single file
4. **Command Palette**: Can't remember a shortcut? Use `Ctrl+Shift+P` to search for any command

## Related Documentation

- [Pane Navigation Feature](./features/PANE_NAVIGATION.md) - Detailed guide for the pane navigation system
- [Command System](./architecture/COMMAND_SYSTEM.md) - How commands and shortcuts are implemented