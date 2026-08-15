import type { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export type RendererEntryName =
  | 'index'
  | 'session-window'
  | 'workspace-window'
  | 'about-window'
  | 'log-window'
  | 'report-window'

/**
 * Load a renderer HTML entry in both dev (Vite URL) and production (file).
 */
export function loadRendererEntry(
  win: BrowserWindow,
  entry: RendererEntryName,
  query: Record<string, string> = {}
): void {
  const params = new URLSearchParams(query)
  const qs = params.toString()
  const querySuffix = qs ? `?${qs}` : ''

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const base =
      entry === 'index'
        ? process.env['ELECTRON_RENDERER_URL']
        : `${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`
    win.loadURL(`${base}${querySuffix}`)
    return
  }

  const file =
    entry === 'index'
      ? join(__dirname, '../renderer/index.html')
      : join(__dirname, `../renderer/${entry}/index.html`)
  win.loadFile(file, Object.keys(query).length > 0 ? { query } : undefined)
}
