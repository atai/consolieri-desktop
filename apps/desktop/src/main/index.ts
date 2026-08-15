import { app } from 'electron'
import { getDataDir } from './paths'
import { appIconPath } from './appBranding'
import { getDatabase, closeDatabase } from './db/database'
import { registerIpcHandlers } from './ipc/register'
import { sessionManager } from './compositionRoot'
import { backupService } from './backup/backupServiceInstance'
import { runBootSequence } from './boot/bootSequence'
import {
  MainWindowController,
  configureElectronAppChrome,
  windowShortcutOptimizer
} from './windows/MainWindowController'
import {
  openSplashWindow,
  updateSplashProgress,
  registerSplashAndAboutIpc
} from './windows/SplashWindowController'

// Must be called before app.whenReady() and before any call to app.getPath('userData').
app.setPath('userData', getDataDir())

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  const mainWindow = new MainWindowController({
    onMainWindowCreated: (win) => {
      sessionManager.setWindow(win)
    }
  })

  app.on('second-instance', () => {
    mainWindow.showAndFocus()
  })

  app.whenReady().then(async () => {
    mainWindow.setBooting(true)

    try {
      configureElectronAppChrome()
      if (process.platform === 'darwin') {
        try {
          app.dock?.setIcon(appIconPath())
        } catch (iconError) {
          console.error('[main] Failed to set dock icon:', iconError)
        }
      }

      app.on('browser-window-created', (_, window) => {
        windowShortcutOptimizer.watchWindowShortcuts(window)
      })

      registerSplashAndAboutIpc()
      await openSplashWindow()

      await runBootSequence({
        onProgress: updateSplashProgress,
        openDatabase: () => {
          getDatabase()
        },
        startServices: () => {
          registerIpcHandlers(mainWindow.getWindow)
          backupService.startScheduler()
          void import('./control/server').then(({ syncControlServerWithSettings }) =>
            syncControlServerWithSettings()
          )
        },
        createMainWindow: () => {
          mainWindow.create()
        },
        waitUntilReady: () => mainWindow.waitForRendererReady()
      })
    } catch (error) {
      console.error('[main] Startup initialization failed:', error)
      if (!mainWindow.isAlive()) {
        try {
          mainWindow.create()
        } catch (createError) {
          console.error('[main] Failed to create main window after boot error:', createError)
        }
      }
    } finally {
      try {
        mainWindow.finishBootReveal()
      } finally {
        mainWindow.setBooting(false)
      }
    }

    app.on('activate', () => {
      mainWindow.showAndFocus()
    })
  })

  app.on('before-quit', () => {
    backupService.stopScheduler()
    void import('./control/server').then(({ stopControlServer }) => stopControlServer())
    sessionManager.closeAll()
    closeDatabase()
  })

  app.on('window-all-closed', () => {
    if (mainWindow.isBooting()) return
    app.quit()
  })
}
