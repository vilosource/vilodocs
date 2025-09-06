import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DockOverlay } from '../../src/components/dnd/DockOverlay';
import '@testing-library/jest-dom';

describe('DockOverlay', () => {
  test('renders nothing when not visible', () => {
    const { container } = render(
      <DockOverlay 
        visible={false}
        position="center"
        bounds={{ x: 0, y: 0, width: 100, height: 100 }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders overlay when visible', () => {
    render(
      <DockOverlay 
        visible={true}
        position="center"
        bounds={{ x: 100, y: 100, width: 200, height: 200 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toBeInTheDocument();
  });

  test('applies correct position styles', () => {
    render(
      <DockOverlay 
        visible={true}
        position="center"
        bounds={{ x: 100, y: 100, width: 200, height: 200 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveStyle({
      left: '100px',
      top: '100px',
      width: '200px',
      height: '200px'
    });
  });

  test('renders correct overlay for center position', () => {
    render(
      <DockOverlay 
        visible={true}
        position="center"
        bounds={{ x: 0, y: 0, width: 100, height: 100 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveClass('dock-overlay-center');
  });

  test('renders correct overlay for left position', () => {
    render(
      <DockOverlay 
        visible={true}
        position="left"
        bounds={{ x: 0, y: 0, width: 100, height: 100 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveClass('dock-overlay-left');
    
    // Should show half width for left split
    expect(overlay).toHaveStyle({ width: '50px' });
  });

  test('renders correct overlay for right position', () => {
    render(
      <DockOverlay 
        visible={true}
        position="right"
        bounds={{ x: 100, y: 0, width: 100, height: 100 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveClass('dock-overlay-right');
    
    // Should be positioned at right half
    expect(overlay).toHaveStyle({ 
      left: '150px',
      width: '50px' 
    });
  });

  test('renders correct overlay for top position', () => {
    render(
      <DockOverlay 
        visible={true}
        position="top"
        bounds={{ x: 0, y: 0, width: 100, height: 100 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveClass('dock-overlay-top');
    
    // Should show half height for top split
    expect(overlay).toHaveStyle({ height: '50px' });
  });

  test('renders correct overlay for bottom position', () => {
    render(
      <DockOverlay 
        visible={true}
        position="bottom"
        bounds={{ x: 0, y: 100, width: 100, height: 100 }}
      />
    );

    const overlay = screen.getByTestId('dock-overlay');
    expect(overlay).toHaveClass('dock-overlay-bottom');
    
    // Should be positioned at bottom half
    expect(overlay).toHaveStyle({ 
      top: '150px',
      height: '50px' 
    });
  });
});