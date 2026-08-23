import { BrowserWindow, ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import { createHandler } from './createHandler'
import {
  disableControlApi,
  enableControlApi,
  getControlServerStatus,
  getLastIssuedControlToken,
  listControlClients,
  revokeControlClient,
  rotateControlToken,
  setClientAlwaysAllow
} from '../control/server'
import {
  registerControlConfirmIpc,
  setControlConfirmWindowGetter
} from '../control/confirm'
import { getWorkspaceWindowSnapshot } from '../windows/WorkspaceWindow'

export function registerControlIpc(getWindow: () => BrowserWindow | null): void {
  setControlConfirmWindowGetter(getWindow)
  registerControlConfirmIpc()

  ipcMain.handle(IPC_CHANNELS.controlGetStatus, () => getControlServerStatus())

  ipcMain.handle(IPC_CHANNELS.controlEnable, async () => {
    return enableControlApi()
  })

  ipcMain.handle(IPC_CHANNELS.controlDisable, async () => {
    await disableControlApi()
  })

  ipcMain.handle(IPC_CHANNELS.controlRotateToken, async () => {
    const token = await rotateControlToken()
    return { token }
  })

  ipcMain.handle(IPC_CHANNELS.controlGetLastToken, () => getLastIssuedControlToken())

  ipcMain.handle(IPC_CHANNELS.controlListClients, () => listControlClients())

  ipcMain.handle(
    IPC_CHANNELS.controlRevokeClient,
    createHandler(z.string().min(1), (clientId) => {
      return Promise.resolve({ ok: revokeControlClient(clientId) })
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.controlSetClientAlwaysAllow,
    createHandler(
      z.tuple([z.string().min(1), z.boolean()]),
      ([clientId, alwaysAllow]) => {
        return Promise.resolve(setClientAlwaysAllow(clientId, alwaysAllow))
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.controlGetWorkspaceWindow,
    createHandler(z.string().min(1), (windowId) => {
      return Promise.resolve(getWorkspaceWindowSnapshot(windowId))
    })
  )
}
