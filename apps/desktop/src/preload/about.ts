import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type AboutWindowMode } from '../shared/types'

export interface AboutApi {
  getMeta: () => Promise<{ name: string; version: string; mode: AboutWindowMode }>
  onProgress: (cb: (payload: { label: string; detail?: string }) => void) => () => void
  close: () => void
}

function resolveMode(): AboutWindowMode {
  const params = new URLSearchParams(window.location.search)
  return params.get('mode') === 'about' ? 'about' : 'splash'
}

const aboutApi: AboutApi = {
  getMeta: () => ipcRenderer.invoke(IPC_CHANNELS.appAboutMeta, resolveMode()),
  onProgress: (cb) => {
    const listener = (_: unknown, payload: { label: string; detail?: string }): void => {
      cb(payload)
    }
    ipcRenderer.on(IPC_CHANNELS.appBootProgress, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.appBootProgress, listener)
  },
  close: () => {
    ipcRenderer.send(IPC_CHANNELS.appAboutClose)
  }
}

contextBridge.exposeInMainWorld('aboutApi', aboutApi)
