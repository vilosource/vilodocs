import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EditorGrid } from '../../src/components/editor/EditorGrid';
import { EditorGridState } from '../../src/state/layoutReducer';
import '@testing-library/jest-dom';

describe('EditorGrid', () => {
  const mockDispatch = vi.fn();
  
  const singleLeafState: EditorGridState = {
    root: {
      id: 'root',
      type: 'leaf',
      tabs: [
        { id: 'tab1', title: 'File 1', widget: { type: 'text-editor', props: {} } },
        { id: 'tab2', title: 'File 2', widget: { type: 'text-editor', props: {} } }
      ],
      activeTabId: 'tab1'
    },
    activeLeafId: 'root',
    leafMap: new Map(),
    focusHistory: ['root']
  };

  const splitState: EditorGridState = {
    root: {
      id: 'split1',
      type: 'split',
      dir: 'row',
      sizes: [50, 50],
      children: [
        {
          id: 'leaf1',
          type: 'leaf',
          tabs: [{ id: 'tab1', title: 'File 1', widget: { type: 'text-editor', props: {} } }],
          activeTabId: 'tab1'
        },
        {
          id: 'leaf2',
          type: 'leaf',
          tabs: [{ id: 'tab2', title: 'File 2', widget: { type: 'text-editor', props: {} } }],
          activeTabId: 'tab2'
        }
      ]
    },
    activeLeafId: 'leaf1',
    leafMap: new Map(),
    focusHistory: ['leaf1']
  };

  test('renders single leaf with tabs', () => {
    render(
      <EditorGrid 
        state={singleLeafState}
        dispatch={mockDispatch}
      />
    );

    // Check tab titles exist
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent('File 1');
    expect(tabs[1]).toHaveTextContent('File 2');
  });

  test('renders split layout', () => {
    render(
      <EditorGrid 
        state={splitState}
        dispatch={mockDispatch}
      />
    );

    // Check both tabs are rendered
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent('File 1');
    expect(tabs[1]).toHaveTextContent('File 2');
    
    // Should have a split container
    const splitContainer = document.querySelector('.editor-split');
    expect(splitContainer).toBeInTheDocument();
  });

  test('marks active leaf', () => {
    render(
      <EditorGrid 
        state={splitState}
        dispatch={mockDispatch}
      />
    );

    const leaves = document.querySelectorAll('.editor-leaf');
    const activeLeaf = document.querySelector('.editor-leaf.active');
    
    expect(leaves).toHaveLength(2);
    expect(activeLeaf).toBeInTheDocument();
  });

  test('dispatches ACTIVATE_TAB when tab is clicked', () => {
    render(
      <EditorGrid 
        state={singleLeafState}
        dispatch={mockDispatch}
      />
    );

    fireEvent.click(screen.getByText('File 2'));
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ACTIVATE_TAB',
      payload: { tabId: 'tab2' }
    });
  });

  test('dispatches CLOSE_TAB when close button is clicked', () => {
    render(
      <EditorGrid 
        state={singleLeafState}
        dispatch={mockDispatch}
      />
    );

    const tabs = screen.getAllByRole('tab');
    const closeButton = tabs[0].querySelector('.tab-close');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLOSE_TAB',
        payload: { tabId: 'tab1' }
      });
    }
  });

  test('dispatches SPLIT_LEAF on split command', () => {
    render(
      <EditorGrid 
        state={singleLeafState}
        dispatch={mockDispatch}
      />
    );

    // Simulate keyboard shortcut
    fireEvent.keyDown(document, { 
      key: '\\', 
      ctrlKey: true 
    });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SPLIT_LEAF',
      payload: expect.objectContaining({
        leafId: 'root',
        direction: 'horizontal'
      })
    });
  });

  test('renders empty state when no tabs', () => {
    const emptyState: EditorGridState = {
      root: {
        id: 'root',
        type: 'leaf',
        tabs: [],
        activeTabId: undefined
      },
      activeLeafId: 'root',
      leafMap: new Map(),
      focusHistory: []
    };

    render(
      <EditorGrid 
        state={emptyState}
        dispatch={mockDispatch}
      />
    );

    expect(screen.getByText(/Welcome|Empty|No files open/i)).toBeInTheDocument();
  });

  test('handles nested splits', () => {
    const nestedSplitState: EditorGridState = {
      root: {
        id: 'split1',
        type: 'split',
        dir: 'row',
        sizes: [50, 50],
        children: [
          {
            id: 'split2',
            type: 'split',
            dir: 'col',
            sizes: [60, 40],
            children: [
              {
                id: 'leaf1',
                type: 'leaf',
                tabs: [{ id: 'tab1', title: 'File 1', widget: { type: 'text-editor', props: {} } }],
                activeTabId: 'tab1'
              },
              {
                id: 'leaf2',
                type: 'leaf',
                tabs: [{ id: 'tab2', title: 'File 2', widget: { type: 'text-editor', props: {} } }],
                activeTabId: 'tab2'
              }
            ]
          },
          {
            id: 'leaf3',
            type: 'leaf',
            tabs: [{ id: 'tab3', title: 'File 3', widget: { type: 'text-editor', props: {} } }],
            activeTabId: 'tab3'
          }
        ]
      },
      activeLeafId: 'leaf1',
      leafMap: new Map(),
      focusHistory: ['leaf1']
    };

    render(
      <EditorGrid 
        state={nestedSplitState}
        dispatch={mockDispatch}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('File 1');
    expect(tabs[1]).toHaveTextContent('File 2');
    expect(tabs[2]).toHaveTextContent('File 3');
    
    const splits = document.querySelectorAll('.editor-split');
    expect(splits.length).toBeGreaterThanOrEqual(2);
  });

  test('dispatches RESIZE_SPLIT when gutter is dragged', () => {
    const { container } = render(
      <EditorGrid 
        state={splitState}
        dispatch={mockDispatch}
      />
    );

    const gutter = container.querySelector('.split-gutter');
    
    if (gutter) {
      fireEvent.mouseDown(gutter, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 150 });
      fireEvent.mouseUp(document);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RESIZE_SPLIT',
        payload: expect.objectContaining({
          splitId: 'split1'
        })
      });
    }
  });
});