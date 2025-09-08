import { test, expect } from './fixtures/electronTest';

test.describe('Debug Test', () => {
  test('check for console errors', async ({ page, electronApp }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
        errors.push(msg.text());
      }
    });

    // Try to wait for any element
    try {
      await page.waitForSelector('body', { timeout: 5000 });
      console.log('Body element found');
      
      // Get page content
      const content = await page.content();
      console.log('Page content length:', content.length);
      
      // Check if there's any visible content
      const bodyText = await page.locator('body').textContent();
      console.log('Body text:', bodyText?.substring(0, 200));
      
    } catch (e) {
      console.error('Failed to find body:', e);
    }

    // Check for .shell specifically
    try {
      await page.waitForSelector('.shell', { timeout: 5000 });
      console.log('Shell found!');
    } catch (e) {
      console.error('Shell not found');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png' });
      console.log('Screenshot saved to debug-screenshot.png');
    }

    // Report any errors found
    if (errors.length > 0) {
      console.error('Errors found:', errors);
      throw new Error(`Page has errors: ${errors.join(', ')}`);
    }
  });
});