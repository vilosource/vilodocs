console.log('renderer-simple.tsx loading...');

// Test if we can even execute JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');
  
  const root = document.getElementById('root');
  if (root) {
    console.log('Found root element');
    root.innerHTML = `
      <div style="padding: 20px; background: #2d2d2d; color: white; height: 100vh; font-family: sans-serif;">
        <h1>Vilodocs Panes - Debug Mode</h1>
        <p>JavaScript is working!</p>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
        <button onclick="alert('Button works!')">Test Alert</button>
        <div id="react-status" style="margin-top: 20px; padding: 10px; background: #444;">
          Attempting to load React components...
        </div>
      </div>
    `;
    
    // Now try to load React
    loadReact();
  } else {
    console.error('Root element not found!');
    document.body.innerHTML = '<h1 style="color: red;">Error: No root element!</h1>';
  }
});

async function loadReact() {
  console.log('Attempting to load React...');
  
  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    console.log('React loaded successfully');
    
    const statusDiv = document.getElementById('react-status');
    if (statusDiv) {
      statusDiv.innerHTML = '✅ React loaded successfully!';
      statusDiv.style.background = 'green';
    }
    
    // Try to load the App component
    try {
      const { default: App } = await import('./renderer/App');
      console.log('App component loaded');
      
      const container = document.getElementById('root');
      if (container) {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(App));
        console.log('App rendered!');
      }
    } catch (appError) {
      console.error('Failed to load App component:', appError);
      if (statusDiv) {
        statusDiv.innerHTML = `❌ App component error: ${appError.message}`;
        statusDiv.style.background = 'red';
      }
    }
  } catch (error) {
    console.error('Failed to load React:', error);
    const statusDiv = document.getElementById('react-status');
    if (statusDiv) {
      statusDiv.innerHTML = `❌ React loading error: ${error.message}`;
      statusDiv.style.background = 'red';
    }
  }
}

export {};