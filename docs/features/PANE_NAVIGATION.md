# Pane Navigation Feature

## Overview

The Pane Navigation feature provides quick keyboard-based navigation between multiple editor panes using number overlays, similar to Ace Jump or EasyMotion in text editors. This feature allows users to instantly focus any visible pane without using the mouse or cycling through panes sequentially.

## How to Use

### Activating Pane Navigation

There are two ways to activate pane navigation:

1. **Keyboard Shortcut**: Press `Alt+P`
2. **Command Palette**: Press `Ctrl+Shift+P` and search for "Navigate to Pane"

### Navigation Mode

When activated, the feature:
- Displays a semi-transparent backdrop over the entire application
- Shows numbered overlays (1-9) centered on each visible pane
- Displays instructions at the bottom of the screen

### Selecting a Pane

Once in navigation mode, you can:
- **Press a number key (1-9)**: Instantly focus the corresponding pane
- **Click on a number overlay**: Focus that pane with the mouse
- **Press ESC**: Cancel navigation mode
- **Click the backdrop**: Cancel navigation mode

## Visual Design

### Number Overlays
- Circular badges with numbers displayed in the center of each pane
- High contrast colors for visibility
- Smooth zoom-in animation when appearing
- Hover effect that scales up and changes color

### Theme Support
- Automatically adapts to light and dark themes
- Uses VS Code color variables for consistency
- High contrast mode support for accessibility

## Technical Implementation

### Components

#### PaneNavigator Component
Located at: `src/components/navigation/PaneNavigator.tsx`

Main responsibilities:
- Detects all editor panes in the DOM
- Calculates overlay positions
- Handles keyboard and mouse events
- Manages navigation state

#### Integration Points

1. **EditorGrid Component** (`src/components/editor/EditorGrid.tsx`)
   - Hosts the PaneNavigator component
   - Manages navigation activation state
   - Handles pane focus actions

2. **CommandManager** (`src/commands/CommandManager.ts`)
   - Registers the "Navigate to Pane" command
   - Defines the Alt+P keyboard shortcut
   - Dispatches custom events for activation

### Architecture

```
User Input (Alt+P or Command Palette)
    ↓
EditorGrid Component
    ↓
PaneNavigator Component
    ↓
DOM Query for .editor-leaf elements
    ↓
Render Number Overlays
    ↓
User Selection (Number key or Click)
    ↓
Focus Target Pane
```

### CSS Classes

- `.pane-navigator-backdrop` - Semi-transparent overlay
- `.pane-navigator-overlay` - Container for each number
- `.pane-navigator-number` - The number badge itself
- `.pane-navigator-instructions` - Bottom instruction bar

## Limitations

- Supports up to 9 panes (keys 1-9)
- Only works with visible panes
- Does not work with collapsed or hidden panes

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `Alt+P` | Activate pane navigation |
| `1-9` | Focus corresponding pane (in navigation mode) |
| `ESC` | Cancel navigation mode |

## Use Cases

### Quick Pane Switching
When working with multiple files split across panes, quickly jump to any pane without sequential navigation.

### Keyboard-Only Workflows
Perfect for users who prefer keyboard navigation over mouse usage.

### Multi-File Editing
When comparing or editing related files in different panes, quickly switch context without losing focus.

## Related Features

- **Split Commands**: Create new panes with `Ctrl+\` (horizontal) and `Ctrl+Alt+\` (vertical)
- **Sequential Navigation**: Use `Alt+Arrow Keys` for directional pane navigation
- **Tab Management**: Navigate tabs within a pane using `Ctrl+Tab`

## Testing

The feature includes comprehensive E2E tests located at:
`tests/pane-navigation.e2e.spec.ts`

Test coverage includes:
- Overlay display verification
- Number key navigation
- ESC key cancellation
- Click navigation
- Command palette integration
- Edge cases (invalid numbers, non-number keys)

## Future Enhancements

Potential improvements for future versions:
- Support for more than 9 panes (using letters or two-digit numbers)
- Customizable activation shortcut
- Animation speed preferences
- Remember last used pane for quick toggle
- Visual hints showing pane content preview