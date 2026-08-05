import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDataDir } from './paths'
import { APP_NAME, appIconPath } from './appBranding'
import { getDatabase, closeDatabase } from './db/database'
import { registerIpcHandlers } from './ipc/register'
import { sessionManager } from './compositionRoot'
import { backupService } from './backup/backupServiceInstance'
import { CHROME_BG_HEX } from '../shared/chromeHex'
import { IPC_CHANNELS } from '../shared/types'
import { runBootSequence } from './boot/bootSequence'
import {
  closeSplashWindow,
  focusSplashWindow,
  isSplashOpen,
  openSplashWindow,
  updateSplashProgress
} from './windows/AboutWindow'

// Must be called before app.whenReady() and before any call to app.getPath('userData').
// This redirects ALL Electron storage (SQLite, localStorage, IndexedDB, cookies)
// to our custom data directory so dev and packaged builds never share state.
app.setPath('userData', getDataDir())

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null
  let booting = false
  let onRendererReady: (() => void) | null = null
  const RENDERER_READY_FALLBACK_MS = 8000

  function isMainWindowAlive(): boolean {
    return mainWindow !== null && !mainWindow.isDestroyed()
  }

  function signalRendererReady(): void {
    onRendererReady?.()
  }

  function showAndFocusMainWindow(): void {
    if (booting || isSplashOpen()) {
      focusSplashWindow()
      return
    }

    if (!isMainWindowAlive()) {
      createWindow()
      revealMainWindow()
      return
    }

    if (mainWindow!.isMinimized()) mainWindow!.restore()
    mainWindow!.show()
    mainWindow!.focus()
  }

  function revealMainWindow(): void {
    if (!isMainWindowAlive()) return
    mainWindow!.show()
    mainWindow!.focus()
  }

  function createWindow(): void {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      title: APP_NAME,
      icon: appIconPath(),
      backgroundColor: CHROME_BG_HEX,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    mainWindow.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription, validatedURL) => {
        console.error(
          `[main] Failed to load window content (${errorCode}): ${errorDescription} (${validatedURL})`
        )
        signalRendererReady()
      }
    )

    mainWindow.on('closed', () => {
      mainWindow = null
      app.quit()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    sessionManager.setWindow(mainWindow)
  }

  function waitForRendererReady(): Promise<void> {
    return new Promise((resolve) => {
      let settled = false

      const finish = (): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        onRendererReady = null
        ipcMain.removeListener(IPC_CHANNELS.appRendererReady, onIpcReady)
        resolve()
      }

      const onIpcReady = (): void => finish()
      onRendererReady = finish

      const timer = setTimeout(() => {
        console.warn('[main] Renderer ready timed out; continuing startup')
        finish()
      }, RENDERER_READY_FALLBACK_MS)

      ipcMain.on(IPC_CHANNELS.appRendererReady, onIpcReady)
    })
  }

  app.on('second-instance', () => {
    showAndFocusMainWindow()
  })

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.consoleri.desktop')
    if (process.platform === 'darwin') {
      app.dock?.setIcon(appIconPath())
    }

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    booting = true

    try {
      await openSplashWindow()

      await runBootSequence({
        onProgress: updateSplashProgress,
        openDatabase: () => {
          getDatabase()
        },
        startServices: () => {
          registerIpcHandlers(() => mainWindow)
          backupService.startScheduler()
        },
        createMainWindow: () => {
          createWindow()
        },
        waitUntilReady: waitForRendererReady
      })
    } catch (error) {
      console.error('[main] Startup initialization failed:', error)
      if (!isMainWindowAlive()) {
        try {
          createWindow()
        } catch (createError) {
          console.error('[main] Failed to create main window after boot error:', createError)
        }
      }
    } finally {
      booting = false
      revealMainWindow()
      closeSplashWindow()
    }

    app.on('activate', () => {
      showAndFocusMainWindow()
    })
  })

  app.on('before-quit', () => {
    backupService.stopScheduler()
    sessionManager.closeAll()
    closeDatabase()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
