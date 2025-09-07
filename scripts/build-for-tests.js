#!/usr/bin/env node

/**
 * Build script for E2E tests
 * This script builds the Electron app without launching it
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function build() {
  console.log('Building Electron app for E2E tests...');
  
  // Run electron-forge start but kill it as soon as the build completes
  const proc = spawn('npx', ['electron-forge', 'start', '--inspect-electron'], {
    stdio: 'pipe',
    env: { ...process.env, ELECTRON_DISABLE_SANDBOX: '1' }
  });

  let output = '';
  let buildComplete = false;

  let mainBuilt = false;
  let preloadBuilt = false;

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
    
    // Check if build is complete - need BOTH main and preload built
    if (text.includes('Built main process and preload bundles')) {
      buildComplete = true;
      console.log('\n✓ Build complete, terminating process...');
      setTimeout(() => proc.kill('SIGTERM'), 100);
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stderr.write(text);
    
    // Track individual builds
    if (text.includes('target built src/main.ts')) {
      mainBuilt = true;
    }
    if (text.includes('target built src/preload.ts')) {
      preloadBuilt = true;
    }
    
    // When both are built, we're done
    if (mainBuilt && preloadBuilt && !buildComplete) {
      buildComplete = true;
      console.log('\n✓ Both targets built, terminating process...');
      setTimeout(() => proc.kill('SIGTERM'), 100);
    }
  });

  return new Promise((resolve, reject) => {
    proc.on('exit', (code, signal) => {
      // Check if build files exist
      const mainPath = path.join(__dirname, '..', '.vite', 'build', 'main.js');
      const preloadPath = path.join(__dirname, '..', '.vite', 'build', 'preload.js');
      
      if (fs.existsSync(mainPath) && fs.existsSync(preloadPath)) {
        console.log('✓ Build files verified:');
        console.log(`  - ${mainPath}`);
        console.log(`  - ${preloadPath}`);
        resolve();
      } else {
        console.error('✗ Build failed - files not found');
        if (!fs.existsSync(mainPath)) console.error(`  Missing: ${mainPath}`);
        if (!fs.existsSync(preloadPath)) console.error(`  Missing: ${preloadPath}`);
        reject(new Error('Build files not created'));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!buildComplete) {
        console.error('✗ Build timeout - killing process');
        proc.kill('SIGKILL');
        reject(new Error('Build timeout'));
      }
    }, 30000);
  });
}

if (require.main === module) {
  build()
    .then(() => {
      console.log('✓ Build successful');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ Build failed:', err.message);
      process.exit(1);
    });
}

module.exports = { build };