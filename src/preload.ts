import { contextBridge, ipcRenderer } from 'electron';
import { Channels, type RendererApis, type Theme } from './common/ipc';

const api: RendererApis = {
  ping: (msg) => ipcRenderer.invoke(Channels.Ping, msg),

  onThemeChanged: (cb) => {
    const listener = (_e: unknown, t: Theme) => cb(t);
    ipcRenderer.on(Channels.SystemThemeChanged, listener);
    return () => ipcRenderer.removeListener(Channels.SystemThemeChanged, listener);
  },

  openFile: () => ipcRenderer.invoke(Channels.OpenFile),
  saveFile: (data) => ipcRenderer.invoke(Channels.SaveFile, data),
};

contextBridge.exposeInMainWorld('api', api);