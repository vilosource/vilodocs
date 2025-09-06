import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StateProvider } from './state/StateProvider';
import './index.css';

// Create root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find root element');
}

const root = ReactDOM.createRoot(container);

// Render app with state provider
root.render(
  <React.StrictMode>
    <StateProvider>
      <App />
    </StateProvider>
  </React.StrictMode>
);