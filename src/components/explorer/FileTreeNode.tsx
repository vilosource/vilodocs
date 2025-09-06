import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileNode } from '../../common/ipc';
import './FileTreeNode.css';

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isRenaming: boolean;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  onClick: (node: FileNode, event: React.MouseEvent) => void;
  onDoubleClick: (node: FileNode) => void;
  onToggleExpand: (path: string) => void;
  onStartRename: (path: string) => void;
  onCompleteRename: (path: string, newName: string) => void;
  onCancelRename: () => void;
  onContextMenu?: (event: React.MouseEvent, path: string) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  isRenaming,
  expandedPaths,
  selectedPath,
  onClick,
  onDoubleClick,
  onToggleExpand,
  onStartRename,
  onCompleteRename,
  onCancelRename,
  onContextMenu,
}) => {
  const [editingName, setEditingName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClick(node, event);
  }, [node, onClick]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDoubleClick(node);
  }, [node, onDoubleClick]);

  const handleExpandClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExpand(node.path);
  }, [node.path, onToggleExpand]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onClick(node, event); // Select the node
    if (onContextMenu) {
      onContextMenu(event, node.path);
    }
  }, [node, onClick, onContextMenu]);

  const handleRenameSubmit = useCallback(() => {
    if (editingName && editingName !== node.name) {
      onCompleteRename(node.path, editingName);
    } else {
      onCancelRename();
    }
  }, [node.path, node.name, editingName, onCompleteRename, onCancelRename]);

  const handleRenameKeyDown = useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      handleRenameSubmit();
    } else if (event.key === 'Escape') {
      setEditingName(node.name);
      onCancelRename();
    }
  }, [node.name, handleRenameSubmit, onCancelRename]);

  const handleRenameBlur = useCallback(() => {
    handleRenameSubmit();
  }, [handleRenameSubmit]);

  const getIcon = () => {
    if (node.type === 'directory') {
      return isExpanded ? '📂' : '📁';
    }
    
    // File icons based on extension
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return '📘';
      case 'js':
      case 'jsx':
        return '📙';
      case 'css':
      case 'scss':
      case 'less':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'html':
        return '🌐';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return '🖼️';
      default:
        return '📄';
    }
  };

  return (
    <>
      <div
        className={`file-tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'directory' && (
          <span 
            className={`tree-arrow ${isExpanded ? 'expanded' : ''}`}
            onClick={handleExpandClick}
          >
            ▶
          </span>
        )}
        <span className="tree-icon">{getIcon()}</span>
        {isRenaming ? (
          <input
            ref={inputRef}
            className="tree-rename-input"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="tree-label">{node.name}</span>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="tree-children">
          {node.children.map(child => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              isExpanded={expandedPaths.has(child.path)}
              isSelected={selectedPath === child.path}
              isRenaming={false}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onClick={onClick}
              onDoubleClick={onDoubleClick}
              onToggleExpand={onToggleExpand}
              onStartRename={onStartRename}
              onCompleteRename={onCompleteRename}
              onCancelRename={onCancelRename}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </>
  );
};