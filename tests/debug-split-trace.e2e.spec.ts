import { test, expect } from '@playwright/test';

test('trace split command execution step by step', async ({ page }) => {
  // Listen for all console logs and errors
  const debugLogs: string[] = [];
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('🔍 STEP')) {
      debugLogs.push(`${msg.type()}: ${text}`);
      console.log(`${msg.type()}: ${text}`);
    } else if (msg.type() === 'error') {
      errors.push(text);
      console.log(`❌ Console Error: ${text}`);
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  // Go to the app
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Wait for app to load - try different selectors
  try {
    await page.waitForSelector('.app', { timeout: 5000 });
  } catch {
    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch {
      console.log('No specific selector found, proceeding anyway');
    }
  }
  
  console.log('=== APP LOADED - Starting split command test ===');
  
  // Check for any initial errors
  if (errors.length > 0) {
    console.log('=== INITIAL ERRORS DETECTED ===');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  // Clear previous logs for cleaner trace
  debugLogs.length = 0;
  
  // Step 1: Open command palette with Ctrl+Shift+P
  console.log('User action: Pressing Ctrl+Shift+P');
  await page.keyboard.press('Control+Shift+p');
  
  // Wait and check if command palette opened
  await page.waitForTimeout(1000);
  const paletteVisible = await page.locator('.command-palette-container').isVisible().catch(() => false);
  console.log('Command palette visible:', paletteVisible);
  
  if (paletteVisible) {
    // Step 2: Type "split editor right"
    console.log('User action: Typing "split editor right"');
    const input = page.locator('.command-palette-input');
    await input.fill('split editor right');
    await page.waitForTimeout(500);
    
    // Check if we have results
    const itemCount = await page.locator('.command-palette-item').count();
    console.log('Command palette items found:', itemCount);
    
    if (itemCount > 0) {
      // Step 3: Click the first item
      console.log('User action: Clicking first command');
      await page.locator('.command-palette-item').first().click();
    } else {
      console.log('No command items found, trying Enter key');
      await page.keyboard.press('Enter');
    }
  } else {
    console.log('❌ Command palette did not open!');
  }
  
  // Wait for any async operations
  await page.waitForTimeout(1000);
  
  console.log('=== EXECUTION TRACE ===');
  debugLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // Count how many times each step was executed
  const stepCounts: Record<string, number> = {};
  debugLogs.forEach(log => {
    const match = log.match(/🔍 (STEP \d+(?:\.\d+)?)/);
    if (match) {
      const step = match[1];
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    }
  });
  
  console.log('=== STEP EXECUTION COUNTS ===');
  Object.entries(stepCounts).forEach(([step, count]) => {
    console.log(`${step}: ${count} times`);
  });
  
  // The key question: how many times was STEP 6 (split command execute) called?
  const splitExecutionCount = stepCounts['STEP 6'] || 0;
  console.log(`\n🚨 SPLIT COMMAND EXECUTED ${splitExecutionCount} TIMES`);
  
  if (splitExecutionCount > 1) {
    console.log('❌ BUG CONFIRMED: Split command executed multiple times');
  } else if (splitExecutionCount === 1) {
    console.log('✅ GOOD: Split command executed only once');
  } else {
    console.log('❓ UNEXPECTED: Split command never executed');
  }
});