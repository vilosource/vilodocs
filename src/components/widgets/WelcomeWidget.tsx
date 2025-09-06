import React from 'react';
import './WelcomeWidget.css';

export const WelcomeWidget: React.FC = () => {
  return (
    <div className="welcome-widget">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>
            <span className="welcome-logo">📝</span>
            Welcome to vilodocs
          </h1>
          <p className="welcome-subtitle">
            A modern code editor with VS Code-style panes and workspace support
          </p>
        </div>

        <div className="welcome-sections">
          <div className="welcome-section">
            <h2>🚀 Quick Start</h2>
            <div className="welcome-actions">
              <button 
                className="welcome-button primary"
                onClick={() => window.api?.openFolder?.()}
              >
                📁 Open Folder
              </button>
              <button 
                className="welcome-button"
                onClick={() => window.api?.openWorkspace?.()}
              >
                🗂️ Open Workspace
              </button>
            </div>
          </div>

          <div className="welcome-section">
            <h2>⌨️ Keyboard Shortcuts</h2>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl+K Ctrl+O</kbd>
                <span>Open Folder</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+\\</kbd>
                <span>Split Editor Horizontally</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+Alt+\\</kbd>
                <span>Split Editor Vertically</span>
              </div>
              <div className="shortcut-item">
                <kbd>F6</kbd>
                <span>Navigate Between Panes</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+B</kbd>
                <span>Toggle Sidebar</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+J</kbd>
                <span>Toggle Panel</span>
              </div>
            </div>
          </div>

          <div className="welcome-section">
            <h2>✨ Features</h2>
            <ul className="feature-list">
              <li>VS Code-style split panes and tabs</li>
              <li>File explorer with multi-root workspace support</li>
              <li>Drag & drop tab reordering</li>
              <li>Keyboard navigation and shortcuts</li>
              <li>Layout persistence</li>
              <li>Command palette</li>
            </ul>
          </div>
        </div>

        <div className="welcome-footer">
          <p>
            Start by opening a folder or workspace to begin editing your files.
          </p>
        </div>
      </div>
    </div>
  );
};