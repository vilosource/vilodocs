export const Channels = {
  Ping: 'app:ping',
  SystemThemeChanged: 'app:theme-changed',
  OpenFile: 'fs:open',
  SaveFile: 'fs:save',
} as const;

export type Theme = 'light' | 'dark';

export type RendererApis = {
  ping(msg: string): Promise<string>;
  onThemeChanged(cb: (t: Theme) => void): () => void;
  openFile(): Promise<{ path: string; content: string } | null>;
  saveFile(data: { path?: string; content: string }): Promise<{ path: string } | null>;
};