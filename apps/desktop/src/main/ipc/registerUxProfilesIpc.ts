import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import type { UxProfileInput } from '../../shared/types'
import { Id, UxProfileInputSchema } from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { uxProfileRepository } from '../ux/UxProfileRepository'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerUxProfilesIpc(): void {
  ipcMain.handle(IPC_CHANNELS.uxProfilesList, (_e, hostId?: string) => {
    return uxProfileRepository.list(hostId)
  })

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesGet,
    createHandler(Id, (id: string) => Promise.resolve(uxProfileRepository.get(id)))
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesCreate,
    createHandler(UxProfileInputSchema, (input) => {
      const profile = uxProfileRepository.create(input as unknown as UxProfileInput)
      scheduleCloudUpload()
      return Promise.resolve(profile)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesUpdate,
    createHandler(z.tuple([Id, UxProfileInputSchema.partial()]), ([id, input]) => {
      const profile = uxProfileRepository.update(id, input as unknown as Partial<UxProfileInput>)
      scheduleCloudUpload()
      return Promise.resolve(profile)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesDelete,
    createHandler(Id, (id: string) => {
      uxProfileRepository.delete(id)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesDuplicate,
    createHandler(
      z.tuple([Id, z.string().optional()]),
      ([sourceId, name]: [string, string | undefined]) => {
        const profile = uxProfileRepository.duplicate(sourceId, name)
        scheduleCloudUpload()
        return Promise.resolve(profile)
      }
    )
  )

  ipcMain.handle(IPC_CHANNELS.uxProfilesGetActive, () => {
    return uxProfileRepository.getActive()
  })

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesSetActive,
    createHandler(Id, (id: string) => {
      const profile = uxProfileRepository.setActive(id)
      scheduleCloudUpload()
      return Promise.resolve(profile)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesListHosts,
    createHandler(Id, (profileId: string) =>
      Promise.resolve(uxProfileRepository.listHosts(profileId))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesLinkHost,
    createHandler(z.tuple([Id, Id]), ([hostId, profileId]: [string, string]) => {
      uxProfileRepository.linkHost(hostId, profileId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.uxProfilesUnlinkHost,
    createHandler(Id, (hostId: string) => {
      uxProfileRepository.unlinkHost(hostId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )
}
