import { PaletteItem } from '../../components/commandPalette/CommandPalette';

export interface CommandPaletteProvider {
  id: string;
  name: string;
  getItems: (query: string) => PaletteItem[] | Promise<PaletteItem[]>;
  priority?: number;
}

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  extension?: string;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
  workspaceId?: string;
}