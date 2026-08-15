import type { BrowserWindow } from 'electron'

const hostWindows = new Map<string, BrowserWindow>()

export function getHostWindow(hostId: string): BrowserWindow | undefined {
  const win = hostWindows.get(hostId)
  if (!win || win.isDestroyed()) {
    hostWindows.delete(hostId)
    return undefined
  }
  return win
}

export function registerHostWindow(hostId: string, win: BrowserWindow): void {
  hostWindows.set(hostId, win)
}

export function unregisterHostWindow(hostId: string, win?: BrowserWindow): void {
  if (win && hostWindows.get(hostId) !== win) return
  hostWindows.delete(hostId)
}

/** Test helper */
export function _clearHostWindowsForTests(): void {
  hostWindows.clear()
}
