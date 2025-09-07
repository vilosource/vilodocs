import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ResizeGutter } from '../../src/components/shared/ResizeGutter';
import '@testing-library/jest-dom';

describe('ResizeGutter', () => {
  test('renders with correct orientation', () => {
    const { rerender } = render(
      <ResizeGutter 
        orientation="vertical"
        onResize={() => { /* no-op */ }}
      />
    );

    let gutter = screen.getByRole('separator');
    expect(gutter).toHaveAttribute('aria-orientation', 'vertical');
    expect(gutter).toHaveClass('resize-gutter-vertical');

    rerender(
      <ResizeGutter 
        orientation="horizontal"
        onResize={() => { /* no-op */ }}
      />
    );

    gutter = screen.getByRole('separator');
    expect(gutter).toHaveAttribute('aria-orientation', 'horizontal');
    expect(gutter).toHaveClass('resize-gutter-horizontal');
  });

  test('handles mouse drag for vertical orientation', () => {
    const handleResize = vi.fn();
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={handleResize}
      />
    );

    const gutter = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(gutter, { clientX: 100, clientY: 100 });
    
    // Move mouse
    fireEvent.mouseMove(document, { clientX: 150, clientY: 100 });
    
    expect(handleResize).toHaveBeenCalledWith(50);
    
    // End drag
    fireEvent.mouseUp(document);
  });

  test('handles mouse drag for horizontal orientation', () => {
    const handleResize = vi.fn();
    render(
      <ResizeGutter 
        orientation="horizontal"
        onResize={handleResize}
      />
    );

    const gutter = screen.getByRole('separator');
    
    // Start drag
    fireEvent.mouseDown(gutter, { clientX: 100, clientY: 100 });
    
    // Move mouse
    fireEvent.mouseMove(document, { clientX: 100, clientY: 150 });
    
    expect(handleResize).toHaveBeenCalledWith(50);
    
    // End drag
    fireEvent.mouseUp(document);
  });

  test('applies min and max constraints', () => {
    const handleResize = vi.fn();
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={handleResize}
        min={100}
        max={500}
      />
    );

    const gutter = screen.getByRole('separator');
    
    fireEvent.mouseDown(gutter, { clientX: 100, clientY: 100 });
    
    // Try to resize below minimum
    fireEvent.mouseMove(document, { clientX: 50, clientY: 100 });
    expect(handleResize).not.toHaveBeenCalledWith(expect.any(Number));
    
    // Try to resize above maximum
    fireEvent.mouseMove(document, { clientX: 700, clientY: 100 });
    expect(handleResize).not.toHaveBeenCalledWith(600);
    
    fireEvent.mouseUp(document);
  });

  test('double-click calls onDoubleClick', () => {
    const handleDoubleClick = vi.fn();
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={() => { /* no-op */ }}
        onDoubleClick={handleDoubleClick}
      />
    );

    const gutter = screen.getByRole('separator');
    fireEvent.doubleClick(gutter);
    
    expect(handleDoubleClick).toHaveBeenCalledTimes(1);
  });

  test('handles keyboard navigation', () => {
    const handleResize = vi.fn();
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={handleResize}
        step={10}
      />
    );

    const gutter = screen.getByRole('separator');
    
    // Test arrow keys for vertical orientation
    fireEvent.keyDown(gutter, { key: 'ArrowRight' });
    expect(handleResize).toHaveBeenCalledWith(10);
    
    fireEvent.keyDown(gutter, { key: 'ArrowLeft' });
    expect(handleResize).toHaveBeenCalledWith(-10);
  });

  test('is keyboard accessible', () => {
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={() => { /* no-op */ }}
      />
    );

    const gutter = screen.getByRole('separator');
    expect(gutter).toHaveAttribute('tabIndex', '0');
  });

  test('changes cursor during drag', () => {
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={() => { /* no-op */ }}
      />
    );

    const gutter = screen.getByRole('separator');
    
    fireEvent.mouseDown(gutter, { clientX: 100, clientY: 100 });
    expect(document.body.style.cursor).toBe('ew-resize');
    
    fireEvent.mouseUp(document);
    expect(document.body.style.cursor).toBe('');
  });

  test('prevents text selection during drag', () => {
    render(
      <ResizeGutter 
        orientation="vertical"
        onResize={() => { /* no-op */ }}
      />
    );

    const gutter = screen.getByRole('separator');
    
    fireEvent.mouseDown(gutter, { clientX: 100, clientY: 100 });
    expect(document.body.style.userSelect).toBe('none');
    
    fireEvent.mouseUp(document);
    expect(document.body.style.userSelect).toBe('');
  });
});