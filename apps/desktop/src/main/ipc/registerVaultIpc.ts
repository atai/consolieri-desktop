import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { VaultSettingsUpdate } from '../../shared/types'
import { VaultSettingsUpdateSchema } from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { vaultSettingsRepository } from '../vault/VaultSettingsRepository'
import { startVaultOidcLogin, logoutVaultOidc } from '../vault/VaultOidcLogin'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerVaultIpc(): void {
  ipcMain.handle(IPC_CHANNELS.vaultGetSettings, () => {
    return vaultSettingsRepository.getSettings()
  })

  ipcMain.handle(
    IPC_CHANNELS.vaultUpdateSettings,
    createHandler(VaultSettingsUpdateSchema, async (patch: VaultSettingsUpdate) => {
      const next = await vaultSettingsRepository.updateSettings(patch)
      scheduleCloudUpload()
      return next
    })
  )

  ipcMain.handle(IPC_CHANNELS.vaultTestConnection, () => {
    return vaultSettingsRepository.testConnection()
  })

  ipcMain.handle(IPC_CHANNELS.vaultStatus, () => {
    return vaultSettingsRepository.getStatus()
  })

  ipcMain.handle(IPC_CHANNELS.vaultLogin, () => {
    return startVaultOidcLogin()
  })

  ipcMain.handle(IPC_CHANNELS.vaultLogout, () => {
    return logoutVaultOidc()
  })
}
