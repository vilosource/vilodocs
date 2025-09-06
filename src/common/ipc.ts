export const Channels = {
  Ping: 'app:ping',
  SystemThemeChanged: 'app:theme-changed',
  OpenFile: 'fs:open',
  SaveFile: 'fs:save',
  // File system operations
  ReadDirectory: 'fs:read-dir',
  CreateFile: 'fs:create-file',
  CreateDirectory: 'fs:create-dir',
  DeletePath: 'fs:delete',
  RenamePath: 'fs:rename',
  GetFileStats: 'fs:stats',
  ReadFileContent: 'fs:read-file',
  WriteFileContent: 'fs:write-file',
  WatchPath: 'fs:watch',
  UnwatchPath: 'fs:unwatch',
  // Workspace operations
  OpenFolder: 'workspace:open-folder',
  OpenWorkspace: 'workspace:open-workspace',
  SaveWorkspace: 'workspace:save-workspace',
  GetRecentWorkspaces: 'workspace:get-recent',
  // File system events
  FileChanged: 'fs:file-changed',
  FileCreated: 'fs:file-created',
  FileDeleted: 'fs:file-deleted',
  FileRenamed: 'fs:file-renamed',
} as const;

export type Theme = 'light' | 'dark';

// File system types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

export interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  isFile: boolean;
  isDirectory: boolean;
}

export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string; // For rename events
}

export interface Workspace {
  type: 'single' | 'multi' | 'untitled';
  folders: WorkspaceFolder[];
  name?: string;
  path?: string; // Path to .vilodocs-workspace file
}

export interface WorkspaceFolder {
  id: string;
  path: string;
  name?: string;
}

export type RendererApis = {
  ping(msg: string): Promise<string>;
  onThemeChanged(cb: (t: Theme) => void): () => void;
  openFile(): Promise<{ path: string; content: string } | null>;
  saveFile(data: { path?: string; content: string }): Promise<{ path: string } | null>;
  
  // File system operations
  readDirectory(path: string): Promise<FileNode[]>;
  createFile(path: string, content?: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  deletePath(path: string): Promise<void>;
  renamePath(oldPath: string, newPath: string): Promise<void>;
  getFileStats(path: string): Promise<FileStats>;
  readFileContent(path: string): Promise<string>;
  writeFileContent(path: string, content: string): Promise<void>;
  
  // File watching
  watchPath(path: string): Promise<string>; // Returns watch ID
  unwatchPath(watchId: string): Promise<void>;
  onFileChange(cb: (event: FileChangeEvent) => void): () => void;
  
  // Workspace operations
  openFolder(): Promise<Workspace | null>;
  openWorkspace(): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<string | null>;
  getRecentWorkspaces(): Promise<string[]>;
};