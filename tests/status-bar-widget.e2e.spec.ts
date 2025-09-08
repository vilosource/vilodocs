import { test, expect } from './fixtures/electronTest';
import path from 'path';
import fs from 'fs';

test.describe('Status Bar Widget Integration', () => {
  test('should display widget information in status bar and not in widget headers', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a temporary test file
    const testDir = path.join(__dirname, 'temp');
    const testFile = path.join(testDir, 'test-document.md');
    const testContent = `# Test Document

This is a test markdown document with some content.
It has multiple lines to test word count.
We want to verify that the status bar shows the correct information.

## Section Two

More content here to make the document longer.
This helps us test reading time calculations.`;

    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, testContent);

    // Open the test file
    await page.keyboard.press('Control+o');
    await page.waitForTimeout(500);
    
    // Type the file path (mock file dialog)
    await page.keyboard.type(testFile);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify that widget headers don't exist
    const editorHeader = await page.locator('.editor-header').count();
    const markdownHeader = await page.locator('.markdown-header').count();
    
    expect(editorHeader).toBe(0);
    expect(markdownHeader).toBe(0);

    // Check status bar exists and is visible
    const statusBar = await page.locator('.status-bar');
    await expect(statusBar).toBeVisible();

    // For markdown viewer, check that status bar shows file info
    const statusBarText = await statusBar.textContent();
    
    // Should show filename
    expect(statusBarText).toContain('test-document.md');
    
    // Should show word count (approximate, the test content has ~40 words)
    expect(statusBarText).toMatch(/\d+\s+words/);
    
    // Should show reading time
    expect(statusBarText).toMatch(/\d+\s+min\s+read/);
    
    // Should show language
    expect(statusBarText).toContain('Markdown');

    // Clean up test file
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir, { recursive: true });
  });

  test('should update status bar when switching between text editor and markdown viewer', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a test markdown file
    const testDir = path.join(__dirname, 'temp');
    const testFile = path.join(testDir, 'switch-test.md');
    const testContent = '# Switching Test\n\nContent for testing view switching.';

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, testContent);

    // Open the test file
    await page.keyboard.press('Control+o');
    await page.waitForTimeout(500);
    await page.keyboard.type(testFile);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Initially should be in markdown viewer
    let statusBar = await page.locator('.status-bar');
    let statusText = await statusBar.textContent();
    
    // Check for markdown-specific status items
    expect(statusText).toContain('words');
    expect(statusText).toContain('min read');
    
    // Check for Edit button in status bar
    const editButton = await page.locator('.status-bar-item:has-text("Edit")');
    await expect(editButton).toBeVisible();
    
    // Click Edit to switch to text editor
    await editButton.click();
    await page.waitForTimeout(500);

    // Status bar should now show text editor info
    statusText = await statusBar.textContent();
    
    // Should show line and column position
    expect(statusText).toMatch(/Ln\s+\d+,\s+Col\s+\d+/);
    
    // Should NOT show word count and reading time in editor mode
    expect(statusText).not.toContain('words');
    expect(statusText).not.toContain('min read');
    
    // Should show Preview button for markdown files
    const previewButton = await page.locator('.status-bar-item:has-text("Preview")');
    await expect(previewButton).toBeVisible();

    // Clean up
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir, { recursive: true });
  });

  test('should show dirty indicator in status bar when file is modified', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a new file (Ctrl+N)
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(500);

    // Should be in text editor for new file
    const editor = await page.locator('.text-editor');
    await expect(editor).toBeVisible();

    // Type some content
    await page.keyboard.type('Test content');
    await page.waitForTimeout(300);

    // Check status bar for dirty indicator
    const statusBar = await page.locator('.status-bar');
    const dirtyIndicator = await statusBar.locator('.dirty-indicator');
    
    // Should show dirty indicator (bullet character)
    await expect(dirtyIndicator).toBeVisible();
    await expect(dirtyIndicator).toHaveText('●');
  });

  test('should update cursor position in status bar as user types', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a new file
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(500);

    // Initially should show Ln 1, Col 1
    const statusBar = await page.locator('.status-bar');
    let statusText = await statusBar.textContent();
    expect(statusText).toContain('Ln 1, Col 1');

    // Type some text
    await page.keyboard.type('Hello');
    await page.waitForTimeout(300);
    
    // Should now show Ln 1, Col 6 (after "Hello")
    statusText = await statusBar.textContent();
    expect(statusText).toContain('Ln 1, Col 6');

    // Press Enter to go to new line
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Should show Ln 2, Col 1
    statusText = await statusBar.textContent();
    expect(statusText).toContain('Ln 2, Col 1');

    // Type more text
    await page.keyboard.type('World');
    await page.waitForTimeout(300);
    
    // Should show Ln 2, Col 6
    statusText = await statusBar.textContent();
    expect(statusText).toContain('Ln 2, Col 6');
  });

  test('should show TOC toggle button in status bar for markdown viewer', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a markdown file with headers
    const testDir = path.join(__dirname, 'temp');
    const testFile = path.join(testDir, 'toc-test.md');
    const testContent = `# Main Title

## Section 1
Content here.

## Section 2
More content.

### Subsection 2.1
Detailed content.`;

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, testContent);

    // Open the test file
    await page.keyboard.press('Control+o');
    await page.waitForTimeout(500);
    await page.keyboard.type(testFile);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Look for TOC button in status bar
    const tocButton = await page.locator('.status-bar-item:has-text("TOC")');
    await expect(tocButton).toBeVisible();

    // Initially TOC should not be visible
    let tocPanel = await page.locator('.markdown-toc');
    await expect(tocPanel).not.toBeVisible();

    // Click TOC button
    await tocButton.click();
    await page.waitForTimeout(500);

    // TOC panel should now be visible
    tocPanel = await page.locator('.markdown-toc');
    await expect(tocPanel).toBeVisible();

    // Verify TOC contains the headers
    const tocContent = await tocPanel.textContent();
    expect(tocContent).toContain('Main Title');
    expect(tocContent).toContain('Section 1');
    expect(tocContent).toContain('Section 2');
    expect(tocContent).toContain('Subsection 2.1');

    // Click TOC button again to hide
    await tocButton.click();
    await page.waitForTimeout(500);

    // TOC should be hidden again
    await expect(tocPanel).not.toBeVisible();

    // Clean up
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir, { recursive: true });
  });

  test('should clear widget-specific status when no widget is active', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.shell', { timeout: 10000 });

    // Create a new file to have an active widget
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(500);

    // Type some content
    await page.keyboard.type('Test');
    await page.waitForTimeout(300);

    // Status bar should show editor info
    let statusBar = await page.locator('.status-bar');
    let statusText = await statusBar.textContent();
    expect(statusText).toMatch(/Ln\s+\d+,\s+Col\s+\d+/);

    // Close the file (this should clear the widget status)
    await page.keyboard.press('Control+w');
    await page.waitForTimeout(500);

    // Status bar should now show default "Ready" state
    statusText = await statusBar.textContent();
    expect(statusText).toContain('Ready');
    
    // Should not show cursor position anymore
    expect(statusText).not.toMatch(/Ln\s+\d+,\s+Col\s+\d+/);
  });
});