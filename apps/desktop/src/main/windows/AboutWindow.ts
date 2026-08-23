import { app, BrowserWindow, ipcMain } from 'electron'
import { APP_NAME } from '../appBranding'
import { IPC_CHANNELS } from '../../shared/types'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'
import { focusSplashWindow, getSplashWindow, isSplashOpen } from './SplashWindowController'

let aboutWindow: BrowserWindow | null = null
let aboutCloseRegistered = false

function isAlive(win: BrowserWindow | null): win is BrowserWindow {
  return win !== null && !win.isDestroyed()
}

function bringWindowForward(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  if (process.platform === 'darwin') {
    app.focus({ steal: true })
    win.moveTop()
  }
  win.focus()
}

function waitUntilShown(win: BrowserWindow, timeoutMs = 2000): Promise<void> {
  if (win.isDestroyed()) return Promise.resolve()
  if (win.isVisible()) {
    bringWindowForward(win)
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      win.removeListener('ready-to-show', onReady)
      if (!win.isDestroyed()) bringWindowForward(win)
      resolve()
    }

    const onReady = (): void => finish()
    const timer = setTimeout(finish, timeoutMs)
    win.once('ready-to-show', onReady)
  })
}

function ensureAboutCloseHandler(): void {
  if (aboutCloseRegistered) return
  aboutCloseRegistered = true
  ipcMain.on(IPC_CHANNELS.appAboutClose, () => {
    if (isSplashOpen()) return
    if (!isAlive(aboutWindow)) return
    aboutWindow.close()
  })
}

export function openAboutWindow(parent?: BrowserWindow | null): BrowserWindow {
  ensureAboutCloseHandler()

  if (isSplashOpen()) {
    focusSplashWindow()
    return getSplashWindow()!
  }

  if (isAlive(aboutWindow)) {
    bringWindowForward(aboutWindow)
    return aboutWindow
  }

  const win = createAppBrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    maximizable: false,
    minimizable: true,
    fullscreenable: false,
    frame: false,
    show: false,
    center: true,
    title: `About ${APP_NAME}`,
    parent: parent ?? undefined,
    modal: Boolean(parent),
    preload: 'about'
  })
  attachWindowDiagnostics(win, { name: 'about-window', closeOnFailLoad: false })

  win.on('closed', () => {
    if (aboutWindow === win) aboutWindow = null
  })

  aboutWindow = win
  const shown = waitUntilShown(win)
  loadRendererEntry(win, 'about-window', { mode: 'about' })

  void shown.then(() => {
    if (!win.isDestroyed()) win.focus()
  })

  return win
}

export function getAboutWindow(): BrowserWindow | null {
  return isAlive(aboutWindow) ? aboutWindow : null
}

export function getAboutMode(): 'about' | null {
  return isAlive(aboutWindow) ? 'about' : null
}
