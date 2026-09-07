import type { BrowserWindow } from 'electron'

/** Cap for child-window show: prefer first paint, but never leave the click hanging. */
export const CHILD_WINDOW_REVEAL_TIMEOUT_MS = 100

function bringForward(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

/**
 * Show a child BrowserWindow as soon as it paints, or after a short timeout.
 * Call after create (with `show: false`); safe to call before or after load*.
 */
export function revealWindow(
  win: BrowserWindow,
  timeoutMs = CHILD_WINDOW_REVEAL_TIMEOUT_MS
): void {
  if (win.isDestroyed()) return
  if (win.isVisible()) {
    bringForward(win)
    return
  }

  let settled = false
  const finish = (): void => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    win.removeListener('ready-to-show', onReady)
    bringForward(win)
  }

  const onReady = (): void => finish()
  const timer = setTimeout(finish, timeoutMs)
  win.once('ready-to-show', onReady)
}
