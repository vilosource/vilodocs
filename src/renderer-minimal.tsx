import React from 'react';
import ReactDOM from 'react-dom/client';

// Minimal App with inline styles to test
const MinimalApp = () => {
  const [activeTab, setActiveTab] = React.useState('welcome');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e', color: '#ccc' }}>
      {/* Top Bar */}
      <div style={{ height: '35px', background: '#2d2d2d', borderBottom: '1px solid #3c3c3c', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <span style={{ fontSize: '14px' }}>vilodocs - Panes Demo</span>
      </div>
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity Bar */}
        <div style={{ width: '48px', background: '#333', borderRight: '1px solid #3c3c3c', padding: '10px 0' }}>
          <div style={{ textAlign: 'center', cursor: 'pointer', padding: '10px' }}>📁</div>
          <div style={{ textAlign: 'center', cursor: 'pointer', padding: '10px' }}>🔍</div>
          <div style={{ textAlign: 'center', cursor: 'pointer', padding: '10px' }}>🌿</div>
        </div>
        
        {/* Sidebar */}
        <div style={{ width: '240px', background: '#252525', borderRight: '1px solid #3c3c3c', padding: '10px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>EXPLORER</h3>
          <div style={{ fontSize: '12px' }}>
            <div style={{ padding: '5px' }}>📁 src/</div>
            <div style={{ padding: '5px', paddingLeft: '20px' }}>📄 main.ts</div>
            <div style={{ padding: '5px', paddingLeft: '20px' }}>📄 renderer.tsx</div>
          </div>
        </div>
        
        {/* Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tab Bar */}
          <div style={{ height: '35px', background: '#2d2d2d', borderBottom: '1px solid #3c3c3c', display: 'flex' }}>
            <div 
              style={{ 
                padding: '8px 20px', 
                background: activeTab === 'welcome' ? '#1e1e1e' : '#2d2d2d',
                borderRight: '1px solid #3c3c3c',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              onClick={() => setActiveTab('welcome')}
            >
              Welcome
            </div>
            <div 
              style={{ 
                padding: '8px 20px', 
                background: activeTab === 'readme' ? '#1e1e1e' : '#2d2d2d',
                borderRight: '1px solid #3c3c3c',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              onClick={() => setActiveTab('readme')}
            >
              README.md
            </div>
          </div>
          
          {/* Editor Content */}
          <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            {activeTab === 'welcome' ? (
              <div>
                <h1>Welcome to vilodocs!</h1>
                <p>VS Code-style panes are working!</p>
                <h3>Keyboard Shortcuts:</h3>
                <ul>
                  <li>Ctrl+\\ - Split horizontally</li>
                  <li>Ctrl+B - Toggle sidebar</li>
                  <li>Ctrl+J - Toggle panel</li>
                  <li>Ctrl+W - Close tab</li>
                </ul>
              </div>
            ) : (
              <div>
                <h1>README</h1>
                <p>This is a demo of the panes functionality.</p>
                <p>Click the tabs above to switch between them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div style={{ height: '22px', background: '#007acc', color: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '12px' }}>
        <span>🌿 main</span>
        <span style={{ marginLeft: '20px' }}>✓ 0 problems</span>
        <span style={{ marginLeft: 'auto' }}>UTF-8</span>
        <span style={{ marginLeft: '20px' }}>TypeScript React</span>
      </div>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>
  );
  console.log('Minimal panes UI rendered!');
} else {
  console.error('Root element not found!');
}

export {};