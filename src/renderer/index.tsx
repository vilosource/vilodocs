import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize state service (singleton will be created)
import './services/StateService';

// Create root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find root element');
}

const root = ReactDOM.createRoot(container);

// Render app without state provider wrapper
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);