import React from 'react';
import ReactDOM from 'react-dom/client';

// Make IPC API available globally
declare global {
  interface Window {
    api: import('./common/ipc').RendererApis;
  }
}

// Simple test component
const TestApp = () => {
  return (
    <div style={{ padding: '20px', background: '#1e1e1e', color: '#fff', height: '100vh' }}>
      <h1>React is working!</h1>
      <p>If you see this, React is loading correctly.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (!container) {
  console.error('Failed to find root element');
  document.body.innerHTML = '<h1>No root element found!</h1>';
} else {
  console.log('Root element found, rendering React app...');
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  );
  console.log('React app rendered');
}

// Setup theme listener
try {
  window.api.onThemeChanged((theme) => {
    document.documentElement.dataset.theme = theme;
  });
} catch (e) {
  console.warn('Theme listener failed:', e);
}