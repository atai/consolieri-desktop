import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { APP_NAME, appIconPath } from '../appBranding'
import { APP_VERSION } from '../../shared/appVersion'
import { CHROME_BG_HEX } from '../../shared/chromeHex'
import { IPC_CHANNELS, type AboutWindowMode } from '../../shared/types'

let aboutWindow: BrowserWindow | null = null
let currentMode: AboutWindowMode | null = null
let aboutIpcRegistered = false
let lastSplashProgress: { label: string; detail?: string } | null = null
let splashContentReady = false
let splashCloseAllowed = false

/** Meta/close handlers must exist before splash HTML invokes them. */
export function registerAboutWindowIpc(): void {
  if (aboutIpcRegistered) return
  aboutIpcRegistered = true

  ipcMain.handle(IPC_CHANNELS.appAboutMeta, (_e, mode: AboutWindowMode) => ({
    name: APP_NAME,
    version: APP_VERSION,
    mode
  }))

  ipcMain.on(IPC_CHANNELS.appAboutClose, () => {
    if (!isAlive(aboutWindow)) return
    if (currentMode === 'splash' && !splashCloseAllowed) return
    aboutWindow.close()
  })
}

function isAlive(win: BrowserWindow | null): win is BrowserWindow {
  return win !== null && !win.isDestroyed()
}

function sendSplashProgress(label: string, detail?: string): void {
  if (!isAlive(aboutWindow) || currentMode !== 'splash' || !splashContentReady) return
  aboutWindow.webContents.send(IPC_CHANNELS.appBootProgress, { label, detail })
}

function loadAboutContent(win: BrowserWindow, mode: AboutWindowMode): void {
  const query = `?mode=${mode}`
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/about-window/index.html${query}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/about-window/index.html'), {
      query: { mode }
    })
  }
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

function createAboutBrowserWindow(
  mode: AboutWindowMode,
  parent?: BrowserWindow | null
): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    maximizable: false,
    minimizable: mode === 'about',
    fullscreenable: false,
    frame: false,
    show: false,
    center: true,
    title: mode === 'splash' ? APP_NAME : `About ${APP_NAME}`,
    icon: appIconPath(),
    backgroundColor: CHROME_BG_HEX,
    parent: parent ?? undefined,
    modal: mode === 'about' && Boolean(parent),
    closable: true,
    // skipTaskbar on darwin makes the window transient and can hide it from
    // Mission Control / the screen. Only skip the Windows taskbar for splash.
    skipTaskbar: mode === 'splash' && process.platform === 'win32',
    webPreferences: {
      preload: join(__dirname, '../preload/about.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (mode === 'splash') {
    splashContentReady = false
    splashCloseAllowed = false
    win.on('close', (event) => {
      if (!splashCloseAllowed) event.preventDefault()
    })
    win.webContents.on('did-finish-load', () => {
      if (aboutWindow !== win || currentMode !== 'splash') return
      splashContentReady = true
      if (lastSplashProgress) {
        sendSplashProgress(lastSplashProgress.label, lastSplashProgress.detail)
      }
    })
  }

  win.on('closed', () => {
    if (aboutWindow === win) {
      aboutWindow = null
      currentMode = null
      splashContentReady = false
      splashCloseAllowed = false
    }
  })

  return win
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

export function openSplashWindow(): Promise<BrowserWindow> {
  registerAboutWindowIpc()
  lastSplashProgress = null

  if (isAlive(aboutWindow) && currentMode === 'splash') {
    bringWindowForward(aboutWindow)
    return Promise.resolve(aboutWindow)
  }

  if (isAlive(aboutWindow)) {
    splashCloseAllowed = true
    aboutWindow.destroy()
    aboutWindow = null
  }

  const win = createAboutBrowserWindow('splash')
  aboutWindow = win
  currentMode = 'splash'
  const shown = waitUntilShown(win)
  loadAboutContent(win, 'splash')
  return shown.then(() => win)
}

export function updateSplashProgress(label: string, detail?: string): void {
  lastSplashProgress = { label, detail }
  sendSplashProgress(label, detail)
}

export function closeSplashWindow(): void {
  if (!isAlive(aboutWindow) || currentMode !== 'splash') return
  splashCloseAllowed = true
  const win = aboutWindow
  aboutWindow = null
  currentMode = null
  splashContentReady = false
  lastSplashProgress = null
  win.destroy()
}

export function focusSplashWindow(): void {
  if (isAlive(aboutWindow) && currentMode === 'splash') {
    bringWindowForward(aboutWindow)
  }
}

export function isSplashOpen(): boolean {
  return isAlive(aboutWindow) && currentMode === 'splash'
}

export function openAboutWindow(parent?: BrowserWindow | null): BrowserWindow {
  registerAboutWindowIpc()

  if (isAlive(aboutWindow) && currentMode === 'about') {
    bringWindowForward(aboutWindow)
    return aboutWindow
  }

  if (isAlive(aboutWindow) && currentMode === 'splash') {
    // Boot splash owns the window; ignore About until boot finishes.
    bringWindowForward(aboutWindow)
    return aboutWindow
  }

  if (isAlive(aboutWindow)) {
    aboutWindow.close()
  }

  const win = createAboutBrowserWindow('about', parent)
  aboutWindow = win
  currentMode = 'about'
  const shown = waitUntilShown(win)
  loadAboutContent(win, 'about')

  void shown.then(() => {
    if (!win.isDestroyed()) win.focus()
  })

  return win
}

export function getAboutWindow(): BrowserWindow | null {
  return isAlive(aboutWindow) ? aboutWindow : null
}
