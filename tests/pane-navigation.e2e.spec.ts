import { test, expect } from './fixtures/electronTest';
import path from 'path';
import fs from 'fs';

test.describe('Pane Navigation Feature', () => {
  test('should show number overlays when Alt+P is pressed', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create multiple splits to have multiple panes
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    // Split again to have 3 panes
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation with Alt+P
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Check that the backdrop is visible
    const backdrop = await page.locator('.pane-navigator-backdrop');
    await expect(backdrop).toBeVisible();

    // Check that number overlays are visible
    const overlays = await page.locator('.pane-navigator-overlay');
    const overlayCount = await overlays.count();
    expect(overlayCount).toBe(3); // Should have 3 overlays for 3 panes

    // Check that each overlay has a number
    for (let i = 0; i < overlayCount; i++) {
      const numberElement = await overlays.nth(i).locator('.pane-navigator-number');
      await expect(numberElement).toBeVisible();
      const text = await numberElement.textContent();
      expect(text).toBe((i + 1).toString());
    }

    // Check that instructions are visible
    const instructions = await page.locator('.pane-navigator-instructions');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText('Press 1-9 to focus a pane');
    await expect(instructions).toContainText('ESC to cancel');

    // Press ESC to cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Check that overlays are gone
    await expect(backdrop).not.toBeVisible();
  });

  test('should focus correct pane when number key is pressed', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a test file to have content in the first pane
    const testDir = path.join(__dirname, 'temp');
    const testFile1 = path.join(testDir, 'pane-nav-test1.md');
    const testFile2 = path.join(testDir, 'pane-nav-test2.md');
    const testContent1 = '# First Pane\n\nContent for the first pane.';
    const testContent2 = '# Second Pane\n\nContent for the second pane.';

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile1, testContent1);
    fs.writeFileSync(testFile2, testContent2);

    // Open first file
    await page.keyboard.press('Control+o');
    await page.waitForTimeout(500);
    await page.keyboard.type(testFile1);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Create a split and open second file
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Control+o');
    await page.waitForTimeout(500);
    await page.keyboard.type(testFile2);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Now we have 2 panes, second one should be active
    const activePaneBefore = await page.locator('.editor-leaf.active');
    const activeCountBefore = await activePaneBefore.count();
    expect(activeCountBefore).toBe(1);

    // Trigger pane navigation
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Press "1" to focus the first pane
    await page.keyboard.press('1');
    await page.waitForTimeout(500);

    // Check that the first pane is now active
    const firstPane = await page.locator('.editor-leaf').first();
    await expect(firstPane).toHaveClass(/active/);

    // Clean up
    fs.unlinkSync(testFile1);
    fs.unlinkSync(testFile2);
    fs.rmdirSync(testDir, { recursive: true });
  });

  test('should cancel navigation when clicking backdrop', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Check that backdrop is visible
    const backdrop = await page.locator('.pane-navigator-backdrop');
    await expect(backdrop).toBeVisible();

    // Click the backdrop
    await backdrop.click();
    await page.waitForTimeout(200);

    // Check that navigation is cancelled
    await expect(backdrop).not.toBeVisible();
    const overlays = await page.locator('.pane-navigator-overlay');
    await expect(overlays.first()).not.toBeVisible();
  });

  test('should focus pane when clicking on number overlay', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create multiple splits
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Click on the second overlay
    const secondOverlay = await page.locator('.pane-navigator-overlay').nth(1);
    await secondOverlay.click();
    await page.waitForTimeout(500);

    // Check that the second pane is now active
    const secondPane = await page.locator('.editor-leaf').nth(1);
    await expect(secondPane).toHaveClass(/active/);

    // Check that overlays are gone
    const backdrop = await page.locator('.pane-navigator-backdrop');
    await expect(backdrop).not.toBeVisible();
  });

  test('should work with command palette', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Open command palette
    await page.keyboard.press('Control+Shift+p');
    await page.waitForTimeout(500);

    // Type to search for the navigate command
    await page.keyboard.type('Navigate to Pane');
    await page.waitForTimeout(300);

    // Select the command
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Check that pane navigation is activated
    const backdrop = await page.locator('.pane-navigator-backdrop');
    await expect(backdrop).toBeVisible();

    // Check for overlays
    const overlays = await page.locator('.pane-navigator-overlay');
    const overlayCount = await overlays.count();
    expect(overlayCount).toBe(2); // Should have 2 overlays for 2 panes

    // Cancel with ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(backdrop).not.toBeVisible();
  });

  test('should handle non-number keys gracefully', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Press a non-number key
    await page.keyboard.press('a');
    await page.waitForTimeout(200);

    // Navigation should still be active
    const backdrop = await page.locator('.pane-navigator-backdrop');
    await expect(backdrop).toBeVisible();

    // Press a number that doesn't correspond to any pane (e.g., 9 when we only have 2 panes)
    await page.keyboard.press('9');
    await page.waitForTimeout(200);

    // Navigation should still be active
    await expect(backdrop).toBeVisible();

    // Now press a valid number
    await page.keyboard.press('1');
    await page.waitForTimeout(200);

    // Navigation should be closed
    await expect(backdrop).not.toBeVisible();
  });

  test('should update overlay numbers when panes change', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Start with one pane, then split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Should have 2 overlays
    let overlays = await page.locator('.pane-navigator-overlay');
    expect(await overlays.count()).toBe(2);

    // Cancel navigation
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Add another split
    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(500);

    // Trigger pane navigation again
    await page.keyboard.press('Alt+p');
    await page.waitForTimeout(200);

    // Should now have 3 overlays
    overlays = await page.locator('.pane-navigator-overlay');
    expect(await overlays.count()).toBe(3);

    // Cancel
    await page.keyboard.press('Escape');
  });
});