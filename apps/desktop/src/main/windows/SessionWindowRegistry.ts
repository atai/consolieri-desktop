import type { BrowserWindow } from 'electron'

const registry = new Map<string, BrowserWindow>()

function isLiveWindow(win: BrowserWindow): boolean {
  return !win.isDestroyed()
}

export function registerSessionWindow(sessionId: string, win: BrowserWindow): void {
  registry.set(sessionId, win)
}

export function unregisterSessionWindow(sessionId: string): void {
  registry.delete(sessionId)
}

export function getRegisteredSessionWindow(sessionId: string): BrowserWindow | undefined {
  const win = registry.get(sessionId)
  if (win && isLiveWindow(win)) return win
  if (win) registry.delete(sessionId)
  return undefined
}

export function getSessionIdsForWindow(win: BrowserWindow): string[] {
  const ids: string[] = []
  for (const [sessionId, registeredWin] of registry) {
    if (registeredWin === win) ids.push(sessionId)
  }
  return ids
}

export function isRegisteredSessionWindow(win: BrowserWindow): boolean {
  return getSessionIdsForWindow(win).length > 0
}

export function unregisterAllForWindow(win: BrowserWindow): string[] {
  const removed: string[] = []
  for (const [sessionId, registeredWin] of registry) {
    if (registeredWin === win) {
      registry.delete(sessionId)
      removed.push(sessionId)
    }
  }
  return removed
}

export function clearSessionWindowRegistry(): void {
  registry.clear()
}
