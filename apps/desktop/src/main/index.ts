import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDataDir } from './paths'
import { APP_NAME, appIconPath } from './appBranding'
import { getDatabase, closeDatabase } from './db/database'
import { registerIpcHandlers } from './ipc/register'
import { sessionManager } from './compositionRoot'
import { backupService } from './backup/backupServiceInstance'
import { CHROME_BG_HEX } from '../shared/chromeHex'

// Must be called before app.whenReady() and before any call to app.getPath('userData').
// This redirects ALL Electron storage (SQLite, localStorage, IndexedDB, cookies)
// to our custom data directory so dev and packaged builds never share state.
app.setPath('userData', getDataDir())

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null
  const SHOW_FALLBACK_MS = 2500

  function isMainWindowAlive(): boolean {
    return mainWindow !== null && !mainWindow.isDestroyed()
  }

  function showAndFocusMainWindow(): void {
    if (!isMainWindowAlive()) {
      createWindow()
      return
    }

    if (mainWindow!.isMinimized()) mainWindow!.restore()
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

    let shown = false
    let showFallbackTimer: ReturnType<typeof setTimeout> | undefined

    const reveal = (): void => {
      if (shown || !isMainWindowAlive()) return
      shown = true
      if (showFallbackTimer !== undefined) clearTimeout(showFallbackTimer)
      mainWindow!.show()
      mainWindow!.focus()
    }

    showFallbackTimer = setTimeout(() => {
      if (!shown) {
        console.warn('[main] Window ready-to-show timed out; forcing show')
        reveal()
      }
    }, SHOW_FALLBACK_MS)

    mainWindow.on('ready-to-show', reveal)

    mainWindow.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription, validatedURL) => {
        console.error(
          `[main] Failed to load window content (${errorCode}): ${errorDescription} (${validatedURL})`
        )
        reveal()
      }
    )

    mainWindow.on('closed', () => {
      if (showFallbackTimer !== undefined) clearTimeout(showFallbackTimer)
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

  app.on('second-instance', () => {
    showAndFocusMainWindow()
  })

  app.whenReady().then(() => {
    try {
      electronApp.setAppUserModelId('com.consoleri.desktop')
      if (process.platform === 'darwin') {
        app.dock?.setIcon(appIconPath())
      }
      getDatabase()

      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      registerIpcHandlers(() => mainWindow)
      backupService.startScheduler()
    } catch (error) {
      console.error('[main] Startup initialization failed:', error)
    }

    createWindow()

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
