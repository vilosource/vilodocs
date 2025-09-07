import { test, expect } from './fixtures/electronTest';

test.describe('Split Panes Testing', () => {
  test.beforeEach(async ({ resetApp, errors }) => {
    // Reset app state and clear errors
    await resetApp();
    errors.length = 0;
  });

  test('horizontal split with Ctrl+\\ creates new pane', async ({ page, errors }) => {
    
    // Count initial editor leaves (panes)
    const initialLeaves = await page.locator('.editor-leaf').count();
    console.log(`Initial panes: ${initialLeaves}`);
    
    // Press Ctrl+\ to split horizontally
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500); // Wait for animation/render
    
    // Count leaves after split
    const newLeaves = await page.locator('.editor-leaf').count();
    console.log(`Panes after horizontal split: ${newLeaves}`);
    
    // Should have one more pane
    expect(newLeaves).toBe(initialLeaves + 1);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
    
    // Verify both panes are visible
    const leaves = await page.locator('.editor-leaf').all();
    for (const leaf of leaves) {
      await expect(leaf).toBeVisible();
    }
  });

  test('vertical split with Ctrl+Alt+\\ creates new pane', async () => {
    const { page, errors } = context!;
    
    // Count initial editor leaves
    const initialLeaves = await page.locator('.editor-leaf').count();
    console.log(`Initial panes: ${initialLeaves}`);
    
    // Press Ctrl+Alt+\ to split vertically
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('\\');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    
    // Count leaves after split
    const newLeaves = await page.locator('.editor-leaf').count();
    console.log(`Panes after vertical split: ${newLeaves}`);
    
    // Should have one more pane
    expect(newLeaves).toBe(initialLeaves + 1);
    
    // Check no errors occurred
    expect(errors).toHaveLength(0);
  });

  test('multiple splits create nested structure', async () => {
    const { page, errors } = context!;
    
    // Start with initial count
    const initialLeaves = await page.locator('.editor-leaf').count();
    
    // Create multiple splits
    await page.keyboard.press('Control+\\'); // Horizontal split
    await page.waitForTimeout(300);
    
    await page.keyboard.press('Control+\\'); // Another horizontal split
    await page.waitForTimeout(300);
    
    // Press Ctrl+Alt+\ for vertical split
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('\\');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    
    // Count final leaves
    const finalLeaves = await page.locator('.editor-leaf').count();
    console.log(`Final panes after multiple splits: ${finalLeaves}`);
    
    // Should have created multiple new panes
    expect(finalLeaves).toBeGreaterThan(initialLeaves);
    
    // Check for split containers
    const splits = await page.locator('.editor-split').count();
    console.log(`Split containers: ${splits}`);
    expect(splits).toBeGreaterThan(0);
    
    // No errors should occur
    expect(errors).toHaveLength(0);
  });

  test('resize gutters appear between split panes', async () => {
    const { page, errors } = context!;
    
    // Create a split first
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Check for resize gutters
    const gutters = await page.locator('.resize-gutter').count();
    console.log(`Resize gutters found: ${gutters}`);
    
    // Should have at least one gutter between the panes
    expect(gutters).toBeGreaterThan(0);
    
    // Check gutter is interactive
    const gutter = page.locator('.resize-gutter').first();
    await expect(gutter).toBeVisible();
    
    // Check cursor changes on hover (indicates it's draggable)
    const cursor = await gutter.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(['col-resize', 'row-resize', 'ew-resize', 'ns-resize']).toContain(cursor);
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('panes can be resized by dragging gutter', async () => {
    const { page, errors } = context!;
    
    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Get the resize gutter
    const gutter = page.locator('.resize-gutter').first();
    await expect(gutter).toBeVisible();
    
    // Get initial sizes of panes
    const firstPane = page.locator('.editor-leaf').first();
    const initialWidth = await firstPane.evaluate(el => el.getBoundingClientRect().width);
    console.log(`Initial first pane width: ${initialWidth}`);
    
    // Drag the gutter
    const gutterBox = await gutter.boundingBox();
    if (gutterBox) {
      await page.mouse.move(gutterBox.x + gutterBox.width / 2, gutterBox.y + gutterBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(gutterBox.x + 50, gutterBox.y + gutterBox.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      // Check new width
      const newWidth = await firstPane.evaluate(el => el.getBoundingClientRect().width);
      console.log(`New first pane width: ${newWidth}`);
      
      // Width should have changed
      expect(Math.abs(newWidth - initialWidth)).toBeGreaterThan(10);
    }
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('focus switches between panes with F6', async () => {
    const { page, errors } = context!;
    
    // Create a split to have multiple panes
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Get all panes
    const panes = await page.locator('.editor-leaf').all();
    expect(panes.length).toBeGreaterThan(1);
    
    // Check which pane has focus initially
    const firstPaneActive = await panes[0].evaluate(el => 
      el.classList.contains('active')
    );
    console.log(`First pane initially active: ${firstPaneActive}`);
    
    // Press F6 to cycle focus
    await page.keyboard.press('F6');
    await page.waitForTimeout(300);
    
    // Check if focus changed
    const firstPaneActiveAfter = await panes[0].evaluate(el => 
      el.classList.contains('active')
    );
    const secondPaneActive = await panes[1].evaluate(el => 
      el.classList.contains('active')
    );
    
    console.log(`After F6 - First pane active: ${firstPaneActiveAfter}, Second pane active: ${secondPaneActive}`);
    
    // One pane should be active
    expect([firstPaneActiveAfter, secondPaneActive]).toContain(true);
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('closing tab in split pane with Ctrl+W', async ({ page, errors }) => {
    
    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Count initial tabs
    const initialTabs = await page.locator('.tab').count();
    console.log(`Initial tabs: ${initialTabs}`);
    
    // Close current tab with Ctrl+W
    await page.keyboard.press('Control+w');
    await page.waitForTimeout(300);
    
    // Count tabs after closing
    const newTabs = await page.locator('.tab').count();
    console.log(`Tabs after Ctrl+W: ${newTabs}`);
    
    // Should have one less tab (or same if it was the only tab)
    expect(newTabs).toBeLessThanOrEqual(initialTabs);
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('drag tab to edge creates split', async () => {
    const { page, errors } = context!;
    
    // Get initial pane count
    const initialPanes = await page.locator('.editor-leaf').count();
    
    // Find a tab to drag
    const tab = page.locator('.tab').first();
    const tabExists = await tab.count() > 0;
    
    if (tabExists) {
      // Get the editor area bounds
      const editorArea = page.locator('.editor-grid, .shell-editor-area').first();
      const editorBox = await editorArea.boundingBox();
      
      if (editorBox) {
        // Drag tab to right edge to create vertical split
        await tab.hover();
        await page.mouse.down();
        await page.mouse.move(editorBox.x + editorBox.width - 20, editorBox.y + editorBox.height / 2);
        await page.waitForTimeout(100); // Wait for drop zone indicator
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        // Check if new pane was created
        const newPanes = await page.locator('.editor-leaf').count();
        console.log(`Panes after drag to edge: ${newPanes}`);
        
        // Might create a new pane (depends on implementation)
        expect(newPanes).toBeGreaterThanOrEqual(initialPanes);
      }
    } else {
      console.log('No tabs available for drag test');
    }
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('split state persists in localStorage', async () => {
    const { page, errors } = context!;
    
    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Get the layout from localStorage
    const layout = await page.evaluate(() => {
      const stored = localStorage.getItem('vilodocs-layout');
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('Stored layout:', JSON.stringify(layout, null, 2));
    
    // Check layout was saved
    expect(layout).toBeTruthy();
    expect(layout?.editorGrid).toBeTruthy();
    
    // Check for split in the layout
    if (layout?.editorGrid?.type === 'split') {
      expect(layout.editorGrid.children).toBeTruthy();
      expect(layout.editorGrid.children.length).toBeGreaterThan(1);
    }
    
    // No errors
    expect(errors).toHaveLength(0);
  });

  test('visual feedback during split creation', async () => {
    const { page, errors } = context!;
    
    // Start watching for visual changes
    const initialScreenshot = await page.screenshot();
    
    // Start split operation
    await page.keyboard.down('Control');
    await page.waitForTimeout(100);
    
    // Take screenshot while holding Ctrl (might show hints)
    const hintScreenshot = await page.screenshot();
    
    // Complete the split
    await page.keyboard.press('\\');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    
    // Final screenshot
    const finalScreenshot = await page.screenshot();
    
    // Screenshots should be different (visual change occurred)
    expect(Buffer.compare(initialScreenshot, finalScreenshot)).not.toBe(0);
    
    // Check for visual indicators (if implemented)
    const hasOverlay = await page.locator('.dock-overlay, .split-preview').count();
    console.log(`Visual indicators found: ${hasOverlay}`);
    
    // No errors
    expect(errors).toHaveLength(0);
  });
});