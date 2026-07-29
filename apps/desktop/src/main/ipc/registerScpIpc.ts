import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import type { ScpRecentEntry, ScpTransferRequest } from '../../shared/types'
import { Id, ScpRecentEntrySchema, ScpTransferRequestSchema } from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { scpTransferService } from '../sessions/ScpTransferService'
import { appPreferencesRepository } from '../preferences/AppPreferencesRepository'

export function registerScpIpc(): void {
  ipcMain.handle(IPC_CHANNELS.scpPickFile, () => scpTransferService.pickLocalFile())

  ipcMain.handle(IPC_CHANNELS.scpPickDir, () => scpTransferService.pickLocalDir())

  ipcMain.handle(
    IPC_CHANNELS.scpTransfer,
    createHandler(ScpTransferRequestSchema, (request: ScpTransferRequest) =>
      scpTransferService.transfer(request)
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.scpGetRecent,
    createHandler(Id, (profileId: string) =>
      Promise.resolve(appPreferencesRepository.getScpRecent(profileId))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.scpSetRecent,
    createHandler(
      z.tuple([Id, ScpRecentEntrySchema]),
      ([profileId, entry]: [string, ScpRecentEntry]) => {
        appPreferencesRepository.setScpRecent(profileId, entry)
        return Promise.resolve()
      }
    )
  )
}
