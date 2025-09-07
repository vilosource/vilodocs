import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { FileNode } from '../../common/ipc';
import { FileTreeNode } from './FileTreeNode';
import './FileTree.css';

interface FileTreeProps {
  nodes: FileNode[];
  expandedPaths: Set<string>;
  selectedPath: string | null;
  onToggleExpand: (path: string) => void | Promise<void>;
  onSelectPath: (path: string) => void;
  onOpenFile: (path: string) => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (path: string, newName: string) => void;
  onDelete?: (path: string) => void;
  onContextMenu?: (event: React.MouseEvent, path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onSelectPath,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onContextMenu,
}) => {
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((node: FileNode, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Select the node
    onSelectPath(node.path);
    
    // Open file on double click (handled separately in handleNodeDoubleClick)
  }, [onSelectPath]);

  const handleNodeDoubleClick = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      onOpenFile(node.path);
    }
  }, [onOpenFile]);

  const handleStartRename = useCallback((path: string) => {
    setRenamingPath(path);
  }, []);

  const handleCompleteRename = useCallback((path: string, newName: string) => {
    if (onRename && newName && newName !== path.split('/').pop()) {
      onRename(path, newName);
    }
    setRenamingPath(null);
  }, [onRename]);

  const handleCancelRename = useCallback(() => {
    setRenamingPath(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedPath) return;

    switch (event.key) {
      case 'F2':
        event.preventDefault();
        handleStartRename(selectedPath);
        break;
      
      case 'Delete':
        event.preventDefault();
        if (onDelete && window.confirm(`Delete ${selectedPath}?`)) {
          onDelete(selectedPath);
        }
        break;
      
      case 'Enter': {
        event.preventDefault();
        const selectedNode = findNodeByPath(nodes, selectedPath);
        if (selectedNode) {
          if (selectedNode.type === 'directory') {
            onToggleExpand(selectedPath);
          } else {
            onOpenFile(selectedPath);
          }
        }
        break;
      }
      
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        navigateTree(event.key === 'ArrowUp' ? 'up' : 'down');
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        if (expandedPaths.has(selectedPath)) {
          onToggleExpand(selectedPath);
        } else {
          // Navigate to parent
          const parentPath = selectedPath.substring(0, selectedPath.lastIndexOf('/'));
          if (parentPath) {
            onSelectPath(parentPath);
          }
        }
        break;
      
      case 'ArrowRight': {
        event.preventDefault();
        const node = findNodeByPath(nodes, selectedPath);
        if (node?.type === 'directory') {
          if (!expandedPaths.has(selectedPath)) {
            onToggleExpand(selectedPath);
          } else if (node.children && node.children.length > 0) {
            // Navigate to first child
            onSelectPath(node.children[0].path);
          }
        }
        break;
      }
    }
  }, [selectedPath, nodes, expandedPaths, onToggleExpand, onOpenFile, onSelectPath, onDelete]);

  const navigateTree = (direction: 'up' | 'down') => {
    const allVisiblePaths = getAllVisiblePaths(nodes, expandedPaths);
    const currentIndex = allVisiblePaths.indexOf(selectedPath!);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(allVisiblePaths.length - 1, currentIndex + 1);
    
    if (newIndex !== currentIndex) {
      onSelectPath(allVisiblePaths[newIndex]);
    }
  };

  return (
    <div 
      className="file-tree"
      ref={treeRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {nodes.map(node => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={0}
          isExpanded={expandedPaths.has(node.path)}
          isSelected={selectedPath === node.path}
          isRenaming={renamingPath === node.path}
          onClick={handleNodeClick}
          onDoubleClick={handleNodeDoubleClick}
          onToggleExpand={onToggleExpand}
          onStartRename={handleStartRename}
          onCompleteRename={handleCompleteRename}
          onCancelRename={handleCancelRename}
          onContextMenu={onContextMenu}
          expandedPaths={expandedPaths}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
};

// Helper functions
function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

function getAllVisiblePaths(nodes: FileNode[], expandedPaths: Set<string>): string[] {
  const paths: string[] = [];
  
  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      paths.push(node.path);
      if (node.type === 'directory' && expandedPaths.has(node.path) && node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(nodes);
  return paths;
}