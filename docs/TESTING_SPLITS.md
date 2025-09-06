# Testing Split Panes - Complete Guide

## Manual Testing in the App

### Basic Split Operations

1. **Horizontal Split** (creates left/right panes)
   - Press `Ctrl+\`
   - The current pane splits into two side-by-side panes
   - Both panes share the same tabs initially

2. **Vertical Split** (creates top/bottom panes)
   - Press `Ctrl+Alt+\`
   - The current pane splits into two stacked panes
   - Both panes share the same tabs initially

3. **Multiple Splits**
   - Keep pressing `Ctrl+\` to create more horizontal splits
   - Mix `Ctrl+\` and `Ctrl+Alt+\` for complex layouts
   - Creates a tree structure of splits

### Visual Indicators

When splits are working correctly, you should see:
- **Multiple editor panes** with their own tab bars
- **Resize gutters** between panes (hover to see resize cursor)
- **Active pane highlight** (border or background color)
- **Independent tab management** in each pane

### Advanced Operations

1. **Resize Panes**
   - Hover over the border between panes
   - Cursor changes to resize indicator (↔ or ↕)
   - Click and drag to resize

2. **Focus Navigation**
   - Press `F6` to cycle focus forward through panes
   - Press `Shift+F6` to cycle backward
   - Click on a pane to focus it directly

3. **Tab Management in Splits**
   - `Ctrl+W` closes tab in current pane
   - `Ctrl+Tab` switches tabs within current pane
   - Drag tabs between panes

4. **Drag to Create Splits**
   - Drag a tab to the edge of a pane
   - Look for the drop zone indicator
   - Drop to create a new split in that direction

## Automated E2E Testing

### Test Results Summary
✅ **Working Features:**
- Horizontal split (`Ctrl+\`) - Creates 2 panes from 1
- Multiple splits - Created 4 panes with 3 split containers
- Resize gutters appear between panes
- No JavaScript errors during operations

### Running the Tests
```bash
# Run all split tests
xvfb-run -a npm run test:e2e -- tests/splits.e2e.spec.ts

# Run specific test
xvfb-run -a npm run test:e2e -- tests/splits.e2e.spec.ts --grep "horizontal split"

# Available tests:
# - horizontal split with Ctrl+\
# - vertical split with Ctrl+Alt+\
# - multiple splits create nested structure
# - resize gutters appear between split panes
# - panes can be resized by dragging gutter
# - focus switches between panes with F6
# - closing tab in split pane with Ctrl+W
# - drag tab to edge creates split
# - split state persists in localStorage
# - visual feedback during split creation
```

## What the E2E Tests Verify

### 1. Split Creation
```javascript
test('horizontal split with Ctrl+\\ creates new pane', async () => {
  const initialLeaves = await page.locator('.editor-leaf').count();
  await page.keyboard.press('Control+\\');
  const newLeaves = await page.locator('.editor-leaf').count();
  expect(newLeaves).toBe(initialLeaves + 1);
});
```

### 2. Multiple Splits
```javascript
// Creates 4 panes with 3 split containers
await page.keyboard.press('Control+\\'); // Split 1
await page.keyboard.press('Control+\\'); // Split 2
await page.keyboard.press('Control+Alt+\\'); // Split 3
```

### 3. Resize Functionality
```javascript
const gutter = page.locator('.resize-gutter').first();
// Drag gutter to resize
await page.mouse.move(gutterBox.x, gutterBox.y);
await page.mouse.down();
await page.mouse.move(gutterBox.x + 50, gutterBox.y);
await page.mouse.up();
```

### 4. Persistence
```javascript
// Create split and check localStorage
await page.keyboard.press('Control+\\');
const layout = await page.evaluate(() => {
  return JSON.parse(localStorage.getItem('vilodocs-layout'));
});
expect(layout.editorGrid.type).toBe('split');
```

## Expected Layout Structure

After creating splits, the internal structure looks like:
```
EditorGrid (root)
├── Split (horizontal)
│   ├── Leaf (pane 1)
│   │   └── Tabs
│   └── Split (vertical)
│       ├── Leaf (pane 2)
│       │   └── Tabs
│       └── Leaf (pane 3)
│           └── Tabs
```

## Troubleshooting

### If splits aren't working:

1. **Check Console for Errors**
   - Press `F12` or `Ctrl+Shift+I` in Electron
   - Look for JavaScript errors
   - Common issue: `Cannot read property 'id' of undefined`

2. **Verify Active Leaf**
   - Splits require an active leaf/pane
   - Click on a pane before splitting
   - Check `state.activeLeafId` is set

3. **Check Keyboard Shortcuts**
   - Some systems may intercept `Ctrl+\`
   - Try the command palette or menu option
   - Verify CommandManager is initialized

4. **Inspect DOM Structure**
   ```javascript
   // In console:
   document.querySelectorAll('.editor-leaf').length // Should increase
   document.querySelectorAll('.editor-split').length // Should exist
   document.querySelectorAll('.resize-gutter').length // Between panes
   ```

## Success Metrics

Splits are working correctly when:
- ✅ Initial state: 1 pane
- ✅ After `Ctrl+\`: 2 panes
- ✅ After 3 splits: 4 panes, 3 split containers
- ✅ Resize gutters visible and draggable
- ✅ Each pane can have different tabs
- ✅ Layout persists after reload
- ✅ No console errors during operations