#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

// Detect if running in WSL
const isWSL = 'WSL_DISTRO_NAME' in process.env || /microsoft/i.test(os.release());

console.log('WSL Detection:', {
  WSL_DISTRO_NAME: process.env.WSL_DISTRO_NAME,
  osRelease: os.release(),
  isWSL: isWSL,
  WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY
});

// Build the command
let command = 'npx electron-forge start';

// If in WSL with Wayland, add the necessary flags
// The working command: npm start -- -- --enable-features=UseOzonePlatform --ozone-platform=wayland
// Since we're already past npm's --, we only need one --
if (isWSL && process.env.WAYLAND_DISPLAY) {
  console.log('WSL with Wayland detected, adding Ozone platform flags...');
  command += ' -- --enable-features=UseOzonePlatform --ozone-platform=wayland';
} else if (isWSL) {
  console.log('WSL detected but no WAYLAND_DISPLAY set');
} else {
  console.log('Not running in WSL');
}

console.log('Final command:', command);

// Run the command
try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}