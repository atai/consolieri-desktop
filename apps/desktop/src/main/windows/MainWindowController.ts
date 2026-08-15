import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_NAME } from '../appBranding'
import { IPC_CHANNELS } from '../../shared/types'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'
import {
  closeSplashWindow,
  focusSplashWindow,
  isSplashOpen
} from './SplashWindowController'

const RENDERER_READY_FALLBACK_MS = 8000

export type MainWindowGetter = () => BrowserWindow | null

/**
 * Owns the primary application BrowserWindow lifecycle:
 * create, reveal, focus, and renderer-ready handshake.
 */
export class MainWindowController {
  private mainWindow: BrowserWindow | null = null
  private booting = false
  private onRendererReady: (() => void) | null = null
  private readonly onMainWindowCreated?: (win: BrowserWindow) => void

  constructor(options?: { onMainWindowCreated?: (win: BrowserWindow) => void }) {
    this.onMainWindowCreated = options?.onMainWindowCreated
  }

  getWindow: MainWindowGetter = () => this.mainWindow

  isAlive(): boolean {
    return this.mainWindow !== null && !this.mainWindow.isDestroyed()
  }

  isBooting(): boolean {
    return this.booting
  }

  setBooting(value: boolean): void {
    this.booting = value
  }

  signalRendererReady(): void {
    this.onRendererReady?.()
  }

  create(): void {
    this.mainWindow = createAppBrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      show: false,
      title: APP_NAME,
      preload: 'index'
    })

    attachWindowDiagnostics(this.mainWindow, {
      name: 'main-window',
      closeOnFailLoad: false,
      onFailLoad: () => this.signalRendererReady()
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
      if (!this.booting && !isSplashOpen()) {
        app.quit()
      }
    })

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    loadRendererEntry(this.mainWindow, 'index')
    this.onMainWindowCreated?.(this.mainWindow)
  }

  reveal(): void {
    if (!this.isAlive()) return
    this.mainWindow!.show()
    this.mainWindow!.focus()
  }

  showAndFocus(): void {
    if (this.isAlive()) {
      if (this.mainWindow!.isMinimized()) this.mainWindow!.restore()
      this.mainWindow!.show()
      this.mainWindow!.focus()
      return
    }

    if (this.booting || isSplashOpen()) {
      focusSplashWindow()
      return
    }

    this.create()
    this.reveal()
  }

  waitForRendererReady(): Promise<void> {
    return new Promise((resolve) => {
      let settled = false

      const finish = (): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this.onRendererReady = null
        ipcMain.removeListener(IPC_CHANNELS.appRendererReady, onIpcReady)
        resolve()
      }

      const onIpcReady = (): void => finish()
      this.onRendererReady = finish

      const timer = setTimeout(() => {
        console.warn('[main] Renderer ready timed out; continuing startup')
        finish()
      }, RENDERER_READY_FALLBACK_MS)

      ipcMain.on(IPC_CHANNELS.appRendererReady, onIpcReady)
    })
  }

  finishBootReveal(): void {
    this.reveal()
    if (this.isAlive() && this.mainWindow!.isVisible()) {
      closeSplashWindow()
    }
  }
}

export function configureElectronAppChrome(): void {
  electronApp.setAppUserModelId('com.consoleri.desktop')
}

export { optimizer as windowShortcutOptimizer }
