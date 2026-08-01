import { ipcMain, clipboard } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import { createHandler } from './createHandler'
import { appPreferencesRepository } from '../preferences/AppPreferencesRepository'
import type { AppSettings, HostListViewSettings, MapViewSettings } from '../../shared/types'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerPreferencesIpc(): void {
  // ── clipboard ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.clipboardReadText, () => clipboard.readText())

  ipcMain.handle(IPC_CHANNELS.clipboardWriteText,
    createHandler(z.string(), (text: string) => {
      clipboard.writeText(text)
      return Promise.resolve()
    })
  )

  // ── preferences ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.preferencesGetHostListView, () => {
    return appPreferencesRepository.getHostListView()
  })

  ipcMain.handle(
    IPC_CHANNELS.preferencesSetHostListView,
    (_e, patch: Partial<HostListViewSettings>) => {
      const next = appPreferencesRepository.setHostListView(patch)
      scheduleCloudUpload()
      return next
    }
  )

  ipcMain.handle(IPC_CHANNELS.preferencesGetMapView, () => {
    return appPreferencesRepository.getMapView()
  })

  ipcMain.handle(IPC_CHANNELS.preferencesSetMapView, (_e, patch: Partial<MapViewSettings>) => {
    const next = appPreferencesRepository.setMapView(patch)
    scheduleCloudUpload()
    return next
  })

  ipcMain.handle(IPC_CHANNELS.preferencesGetAppSettings, () => {
    return appPreferencesRepository.getAppSettings()
  })

  ipcMain.handle(
    IPC_CHANNELS.preferencesSetAppSettings,
    createHandler(
      z.object({
        autoOpenConnectionLog: z.boolean().optional(),
        sessionOpenMode: z.enum(['workspace', 'window']).optional()
      }),
      (patch) => {
        const next = appPreferencesRepository.setAppSettings(patch as Partial<AppSettings>)
        scheduleCloudUpload()
        return Promise.resolve(next)
      }
    )
  )
}
