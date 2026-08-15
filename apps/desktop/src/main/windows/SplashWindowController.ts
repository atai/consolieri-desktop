import { app, BrowserWindow, ipcMain } from 'electron'
import { APP_NAME } from '../appBranding'
import { APP_VERSION } from '../../shared/appVersion'
import { IPC_CHANNELS, type AboutWindowMode } from '../../shared/types'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'

let splashWindow: BrowserWindow | null = null
let lastSplashProgress: { label: string; detail?: string } | null = null
let splashContentReady = false
let splashCloseAllowed = false
let splashIpcRegistered = false

function isAlive(win: BrowserWindow | null): win is BrowserWindow {
  return win !== null && !win.isDestroyed()
}

function sendSplashProgress(label: string, detail?: string): void {
  if (!isAlive(splashWindow) || !splashContentReady) return
  splashWindow.webContents.send(IPC_CHANNELS.appBootProgress, { label, detail })
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

/** Register splash/about shared meta IPC once at boot. */
export function registerSplashAndAboutIpc(): void {
  if (splashIpcRegistered) return
  splashIpcRegistered = true

  ipcMain.handle(IPC_CHANNELS.appAboutMeta, (_e, mode: AboutWindowMode) => ({
    name: APP_NAME,
    version: APP_VERSION,
    mode
  }))
}

export function openSplashWindow(): Promise<BrowserWindow> {
  lastSplashProgress = null

  if (isAlive(splashWindow)) {
    bringWindowForward(splashWindow)
    return Promise.resolve(splashWindow)
  }

  splashContentReady = false
  splashCloseAllowed = false

  const win = createAppBrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    frame: false,
    show: false,
    center: true,
    title: APP_NAME,
    skipTaskbar: process.platform === 'win32',
    preload: 'about'
  })
  attachWindowDiagnostics(win, { name: 'splash-window', closeOnFailLoad: false })

  win.on('close', (event) => {
    if (!splashCloseAllowed) event.preventDefault()
  })
  win.webContents.on('did-finish-load', () => {
    if (splashWindow !== win) return
    splashContentReady = true
    if (lastSplashProgress) {
      sendSplashProgress(lastSplashProgress.label, lastSplashProgress.detail)
    }
  })
  win.on('closed', () => {
    if (splashWindow === win) {
      splashWindow = null
      splashContentReady = false
      splashCloseAllowed = false
    }
  })

  splashWindow = win
  const shown = waitUntilShown(win)
  loadRendererEntry(win, 'about-window', { mode: 'splash' })
  return shown.then(() => win)
}

export function updateSplashProgress(label: string, detail?: string): void {
  lastSplashProgress = { label, detail }
  sendSplashProgress(label, detail)
}

export function closeSplashWindow(): void {
  if (!isAlive(splashWindow)) return
  splashCloseAllowed = true
  const win = splashWindow
  splashWindow = null
  splashContentReady = false
  lastSplashProgress = null
  win.destroy()
}

export function focusSplashWindow(): void {
  if (isAlive(splashWindow)) {
    bringWindowForward(splashWindow)
  }
}

export function isSplashOpen(): boolean {
  return isAlive(splashWindow)
}

export function getSplashWindow(): BrowserWindow | null {
  return isAlive(splashWindow) ? splashWindow : null
}
