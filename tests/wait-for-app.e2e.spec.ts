import { test, expect } from './fixtures/electronTest';

test.describe('Wait for App Load', () => {
  test('should eventually load the app', async ({ page, electronApp }) => {
    const errors: string[] = [];
    
    // Capture any errors
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    
    console.log('Waiting for app to load...');
    
    // Try multiple times with increasing wait
    for (let i = 1; i <= 5; i++) {
      await page.waitForTimeout(i * 1000);
      
      const hasRoot = await page.evaluate(() => {
        return document.getElementById('root') !== null;
      });
      
      const hasShell = await page.evaluate(() => {
        return document.querySelector('.shell') !== null;
      });
      
      const bodyLength = await page.evaluate(() => {
        return document.body.innerHTML.length;
      });
      
      console.log(`Attempt ${i} (after ${i}s):`);
      console.log(`  - Has #root: ${hasRoot}`);
      console.log(`  - Has .shell: ${hasShell}`);
      console.log(`  - Body HTML length: ${bodyLength}`);
      
      if (hasShell) {
        console.log('✓ App loaded successfully!');
        break;
      }
      
      if (i === 5) {
        // On last attempt, get more debug info
        const url = page.url();
        console.log(`  - Page URL: ${url}`);
        
        const title = await page.title();
        console.log(`  - Page title: ${title}`);
        
        // Check if Vite dev server is responding
        const scripts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerHTML.substring(0, 50));
        });
        console.log(`  - Scripts loaded:`, scripts);
      }
    }
    
    // Report any errors
    if (errors.length > 0) {
      console.error('Errors detected:', errors);
      throw new Error('Page has errors');
    }
    
    // Final check
    const shell = await page.$('.shell');
    expect(shell).not.toBeNull();
  });
});