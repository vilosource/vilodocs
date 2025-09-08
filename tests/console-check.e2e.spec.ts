import { test, expect } from './fixtures/electronTest';

test.describe('Console Error Check', () => {
  test('should have no JavaScript errors', async ({ page, electronApp }) => {
    const errors: string[] = [];
    
    // Capture any page errors
    page.on('pageerror', (error) => {
      console.error('Page error detected:', error.message);
      errors.push(error.message);
    });
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error detected:', msg.text());
        errors.push(msg.text());
      }
    });
    
    // Wait for the page to load - give it more time
    await page.waitForTimeout(3000);
    
    // Try to find any element to confirm page loaded
    const body = await page.$('body');
    expect(body).not.toBeNull();
    
    // Get the page content to see what's there
    const content = await page.content();
    console.log('Page has content, length:', content.length);
    
    // Check if root element exists
    const root = await page.$('#root');
    if (!root) {
      console.error('Root element not found!');
      
      // Get body content to debug
      const bodyContent = await page.evaluate(() => document.body.innerHTML);
      console.log('Body HTML:', bodyContent.substring(0, 500));
    } else {
      console.log('Root element found');
      
      // Check if it has content
      const rootContent = await page.evaluate(() => {
        const el = document.getElementById('root');
        return el ? el.innerHTML.substring(0, 100) : 'no root';
      });
      console.log('Root content preview:', rootContent);
    }
    
    // Report errors
    if (errors.length > 0) {
      console.error('JavaScript errors found:');
      errors.forEach(err => console.error(' -', err));
      throw new Error(`Page has ${errors.length} JavaScript errors`);
    }
    
    console.log('✓ No JavaScript errors detected');
  });
});