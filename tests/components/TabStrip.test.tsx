import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TabStrip, TabItem } from '../../src/components/shared/TabStrip';
import '@testing-library/jest-dom';

describe('TabStrip', () => {
  const mockTabs: TabItem[] = [
    { id: 'tab1', title: 'File 1', icon: '📄' },
    { id: 'tab2', title: 'File 2', icon: '📄', dirty: true },
    { id: 'tab3', title: 'File 3', closeable: false }
  ];

  test('renders all tabs', () => {
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={() => {}}
      />
    );

    expect(screen.getByText('File 1')).toBeInTheDocument();
    expect(screen.getByText('File 2')).toBeInTheDocument();
    expect(screen.getByText('File 3')).toBeInTheDocument();
  });

  test('marks active tab correctly', () => {
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab2"
        onTabClick={() => {}}
      />
    );

    const activeTab = screen.getByRole('tab', { name: /File 2/i });
    expect(activeTab).toHaveClass('active');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('shows dirty indicator for unsaved tabs', () => {
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={() => {}}
      />
    );

    const dirtyTab = screen.getByRole('tab', { name: /File 2/i });
    expect(dirtyTab.querySelector('.tab-dirty-indicator')).toBeInTheDocument();
  });

  test('calls onTabClick when tab is clicked', () => {
    const handleClick = vi.fn();
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('File 2'));
    expect(handleClick).toHaveBeenCalledWith('tab2');
  });

  test('shows close button for closeable tabs', () => {
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={() => {}}
        onTabClose={() => {}}
      />
    );

    const closeableTab = screen.getByRole('tab', { name: /File 1/i });
    const closeButton = closeableTab.querySelector('.tab-close');
    expect(closeButton).toBeInTheDocument();

    const nonCloseableTab = screen.getByRole('tab', { name: /File 3/i });
    expect(nonCloseableTab.querySelector('.tab-close')).not.toBeInTheDocument();
  });

  test('calls onTabClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={() => {}}
        onTabClose={handleClose}
      />
    );

    const closeableTab = screen.getByRole('tab', { name: /File 1/i });
    const closeButton = closeableTab.querySelector('.tab-close');
    
    fireEvent.click(closeButton!);
    expect(handleClose).toHaveBeenCalledWith('tab1', expect.any(Object));
  });

  test('prevents tab click when close button is clicked', () => {
    const handleClick = vi.fn();
    const handleClose = vi.fn();
    
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={handleClick}
        onTabClose={handleClose}
      />
    );

    const closeableTab = screen.getByRole('tab', { name: /File 1/i });
    const closeButton = closeableTab.querySelector('.tab-close');
    
    fireEvent.click(closeButton!);
    expect(handleClose).toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={handleClick}
      />
    );

    const firstTab = screen.getByRole('tab', { name: /File 1/i });
    
    // Test Enter key
    fireEvent.keyDown(firstTab, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith('tab1');
    
    // Test Space key
    fireEvent.keyDown(firstTab, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('supports drag and drop attributes', () => {
    render(
      <TabStrip 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabClick={() => {}}
        draggable
      />
    );

    const tab = screen.getByRole('tab', { name: /File 1/i });
    expect(tab).toHaveAttribute('draggable', 'true');
  });
});