import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { CloudSyncSettingsUpdateSchema, CloudImportRecoveryKeySchema, Id } from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { cloudAuthService } from '../cloud/CloudAuthService'
import { cloudSyncCoordinator } from '../cloud/CloudSyncCoordinator'

export function registerCloudIpc(): void {
  ipcMain.handle(IPC_CHANNELS.cloudGetStatus, () => cloudSyncCoordinator.getStatus())

  ipcMain.handle(IPC_CHANNELS.cloudLogin, async () => {
    const result = await cloudAuthService.login()
    const status = await cloudSyncCoordinator.getStatus()
    return {
      status: { ...status, syncKeyCreated: result.syncKeyCreated },
      syncKeyCreated: result.syncKeyCreated
    }
  })

  ipcMain.handle(IPC_CHANNELS.cloudLogout, async () => {
    await cloudAuthService.logout()
    return cloudSyncCoordinator.getStatus()
  })

  ipcMain.handle(IPC_CHANNELS.cloudGetSettings, () => cloudSyncCoordinator.getSettings())

  ipcMain.handle(
    IPC_CHANNELS.cloudUpdateSettings,
    createHandler(CloudSyncSettingsUpdateSchema, (patch) =>
      Promise.resolve(cloudSyncCoordinator.updateSettings(patch))
    )
  )

  ipcMain.handle(IPC_CHANNELS.cloudBackupNow, () => cloudSyncCoordinator.backupNow())

  ipcMain.handle(IPC_CHANNELS.cloudListBackups, () => cloudSyncCoordinator.listBackups())

  ipcMain.handle(
    IPC_CHANNELS.cloudRestoreBackup,
    createHandler(Id, (id: string) => cloudSyncCoordinator.restoreBackup(id))
  )

  ipcMain.handle(
    IPC_CHANNELS.cloudDeleteBackup,
    createHandler(Id, (id: string) => cloudSyncCoordinator.deleteBackup(id))
  )

  ipcMain.handle(IPC_CHANNELS.cloudExportRecoveryKey, () =>
    cloudSyncCoordinator.exportRecoveryKey()
  )

  ipcMain.handle(
    IPC_CHANNELS.cloudImportRecoveryKey,
    createHandler(CloudImportRecoveryKeySchema, (key: string) =>
      cloudSyncCoordinator.importRecoveryKey(key)
    )
  )

  ipcMain.handle(IPC_CHANNELS.cloudClearSyncKey, () => cloudSyncCoordinator.clearSyncKey())
}
