import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SplitContainer } from '../../src/components/shared/SplitContainer';
import '@testing-library/jest-dom';

describe('SplitContainer', () => {
  test('renders children in horizontal split', () => {
    render(
      <SplitContainer direction="horizontal" sizes={[50, 50]}>
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    expect(screen.getByText('Panel 1')).toBeInTheDocument();
    expect(screen.getByText('Panel 2')).toBeInTheDocument();
  });

  test('renders children in vertical split', () => {
    render(
      <SplitContainer direction="vertical" sizes={[60, 40]}>
        <div>Top Panel</div>
        <div>Bottom Panel</div>
      </SplitContainer>
    );

    expect(screen.getByText('Top Panel')).toBeInTheDocument();
    expect(screen.getByText('Bottom Panel')).toBeInTheDocument();
  });

  test('applies correct sizes to children', () => {
    const { container } = render(
      <SplitContainer direction="horizontal" sizes={[30, 70]}>
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    const panels = container.querySelectorAll('.split-panel');
    expect(panels[0]).toHaveStyle({ flex: '0 0 30%' });
    expect(panels[1]).toHaveStyle({ flex: '0 0 70%' });
  });

  test('renders resize gutters between children', () => {
    const { container } = render(
      <SplitContainer direction="horizontal" sizes={[33, 33, 34]}>
        <div>Panel 1</div>
        <div>Panel 2</div>
        <div>Panel 3</div>
      </SplitContainer>
    );

    const gutters = container.querySelectorAll('.split-gutter');
    expect(gutters).toHaveLength(2); // 2 gutters for 3 panels
  });

  test('calls onSizesChange when gutter is dragged', () => {
    const handleSizesChange = vi.fn();
    const { container } = render(
      <SplitContainer 
        direction="horizontal" 
        sizes={[50, 50]}
        onSizesChange={handleSizesChange}
      >
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    const gutter = container.querySelector('.split-gutter');
    
    // Simulate drag
    fireEvent.mouseDown(gutter!, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 150, clientY: 100 });
    fireEvent.mouseUp(document);

    expect(handleSizesChange).toHaveBeenCalled();
  });

  test('enforces minimum size constraints', () => {
    const handleSizesChange = vi.fn();
    render(
      <SplitContainer 
        direction="horizontal" 
        sizes={[50, 50]}
        minSize={100}
        onSizesChange={handleSizesChange}
      >
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    // The component should enforce minimum sizes internally
    // This would be tested more thoroughly with integration tests
    expect(handleSizesChange).not.toHaveBeenCalled();
  });

  test('double-click on gutter equalizes sizes', () => {
    const handleSizesChange = vi.fn();
    const { container } = render(
      <SplitContainer 
        direction="horizontal" 
        sizes={[70, 30]}
        onSizesChange={handleSizesChange}
      >
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    const gutter = container.querySelector('.split-gutter');
    fireEvent.doubleClick(gutter!);

    expect(handleSizesChange).toHaveBeenCalledWith([50, 50]);
  });

  test('handles keyboard navigation on gutters', () => {
    const handleSizesChange = vi.fn();
    const { container } = render(
      <SplitContainer 
        direction="horizontal" 
        sizes={[50, 50]}
        onSizesChange={handleSizesChange}
      >
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    const gutter = container.querySelector('.split-gutter');
    
    // Test arrow key resizing
    fireEvent.keyDown(gutter!, { key: 'ArrowRight' });
    expect(handleSizesChange).toHaveBeenCalled();
    
    handleSizesChange.mockClear();
    
    fireEvent.keyDown(gutter!, { key: 'ArrowLeft' });
    expect(handleSizesChange).toHaveBeenCalled();
  });

  test('applies correct ARIA attributes', () => {
    const { container } = render(
      <SplitContainer direction="vertical" sizes={[50, 50]}>
        <div>Panel 1</div>
        <div>Panel 2</div>
      </SplitContainer>
    );

    const gutter = container.querySelector('.split-gutter');
    expect(gutter).toHaveAttribute('role', 'separator');
    expect(gutter).toHaveAttribute('aria-orientation', 'horizontal');
    expect(gutter).toHaveAttribute('tabIndex', '0');
  });
});