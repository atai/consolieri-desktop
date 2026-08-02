import { ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { IPC_CHANNELS } from '../../shared/types'
import type { DeployKeyRequest } from '../../shared/types'
import { Id, DeployKeyRequestSchema } from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { sshKeyService } from '../keys/SshKeyService'
import { sshKeyDeployer } from '../keys/SshKeyDeployer'
import { openLogWindow, registerLogContext } from '../windows/LogWindow'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerKeysIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.keysList, () => sshKeyService.listKeys())

  ipcMain.handle(IPC_CHANNELS.keysAdd, (_e, path: string, label?: string) => {
    const key = sshKeyService.addCustomKey(path, label)
    scheduleCloudUpload()
    return key
  })

  ipcMain.handle(
    IPC_CHANNELS.keysRemove,
    createHandler(Id, (id: string) => {
      sshKeyService.removeCustomKey(id)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(IPC_CHANNELS.keysPickFile, () => sshKeyService.pickKeyFile())

  ipcMain.handle(
    IPC_CHANNELS.keysAssign,
    createHandler(
      z.tuple([Id, z.string().min(1)]),
      async ([profileId, keyPath]: [string, string]) => {
        await sshKeyService.assignToProfile(profileId, keyPath)
        scheduleCloudUpload()
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.keysDeploy,
    createHandler(DeployKeyRequestSchema, async (request: DeployKeyRequest) => {
      const logId = request.logId ?? nanoid()
      registerLogContext(logId, {
        kind: 'deploy',
        hostId: request.hostId,
        profileId: request.profileId
      })
      if (request.openLog) {
        openLogWindow(logId, getWindow(), {
          kind: 'deploy',
          hostId: request.hostId,
          profileId: request.profileId
        })
      }
      const result = await sshKeyDeployer.deploy({ ...request, logId })
      return { ...result, logId }
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.keysStorePassphrase,
    createHandler(
      z.tuple([z.string().min(1), z.string()]),
      async ([keyPath, passphrase]: [string, string]) => {
        await sshKeyService.storePassphrase(keyPath, passphrase)
        scheduleCloudUpload()
      }
    )
  )

  ipcMain.handle(IPC_CHANNELS.keysAssignableHosts, () => sshKeyService.listAssignableHosts())
}
