import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './renderer/App';
import './renderer/index.css';

// Make IPC API available globally
declare global {
  interface Window {
    api: import('./common/ipc').RendererApis;
  }
}

// Initialize React app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find root element');
}

const root = ReactDOM.createRoot(container);

// Render the panes app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Setup theme listener
window.api.onThemeChanged((theme) => {
  document.documentElement.dataset.theme = theme;
});