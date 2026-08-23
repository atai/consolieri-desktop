import { ipcMain, type BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { appImportExportService } from '../settings/appImportExportServiceInstance'
import { backupService } from '../backup/backupServiceInstance'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'
import { openAboutWindow } from '../windows/AboutWindow'

export function registerAppIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.appExport, () => appImportExportService.exportAppBundle())

  ipcMain.handle(IPC_CHANNELS.appExportToFile, () => appImportExportService.exportAppToFile())

  ipcMain.handle(IPC_CHANNELS.appImportFromFile, async () => {
    await appImportExportService.importAppFromFile()
    scheduleCloudUpload()
  })

  ipcMain.handle(IPC_CHANNELS.appOpenAbout, () => {
    openAboutWindow(getWindow())
  })

  ipcMain.handle(IPC_CHANNELS.backupGetSettings, () => backupService.getSettings())

  ipcMain.handle(IPC_CHANNELS.backupUpdateSettings, (_e, patch: unknown) =>
    backupService.updateSettings(patch)
  )

  ipcMain.handle(IPC_CHANNELS.backupList, () => backupService.listBackups())

  ipcMain.handle(IPC_CHANNELS.backupCreateNow, () => backupService.createBackupNow())

  ipcMain.handle(IPC_CHANNELS.backupRestore, (_e, id: string) => {
    backupService.restoreBackup(id)
    scheduleCloudUpload()
  })

  ipcMain.handle(IPC_CHANNELS.backupDelete, (_e, id: string) => backupService.deleteBackup(id))

  ipcMain.handle(IPC_CHANNELS.backupOpenFolder, () => backupService.openBackupFolder())
}
