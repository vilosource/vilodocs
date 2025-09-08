const fs = require('fs');
const path = require('path');

// Test workspace file
const workspaceData = {
  version: 1,
  name: 'Test Multi-Root Workspace',
  folders: [
    { path: './src', name: 'Source Code' },
    { path: './tests', name: 'Tests' },
    { path: './docs', name: 'Documentation' }
  ]
};

// Check workspace type logic from fileSystemHandlers.ts line 298
const folders = workspaceData.folders;
const type = folders.length > 1 ? 'multi' : 'single';

console.log('Workspace data:', JSON.stringify(workspaceData, null, 2));
console.log('Number of folders:', folders.length);
console.log('Workspace type:', type);
console.log('Is multi-root?', type === 'multi');

// Test the actual workspace object structure
const workspace = {
  type: type,
  folders: folders.map(f => ({
    id: Math.random().toString(36).substr(2, 9),
    path: f.path,
    name: f.name
  })),
  name: workspaceData.name
};

console.log('\nFinal workspace object:', JSON.stringify(workspace, null, 2));