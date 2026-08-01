import { ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import type { HostFilter, HostInput, ProfileInput } from '../../shared/types'
import {
  Id,
  OptionalId,
  HostFilterSchema,
  HostInputSchema,
  ProfileInputSchema,
  CredentialRefSchema
} from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { withOperationalLogWindow } from './withOperationalLogWindow'
import { hostRepository } from '../hosts/HostRepository'
import { profileRepository } from '../hosts/ProfileRepository'
import { hostImportExportService } from '../hosts/hostImportExportServiceInstance'
import { secretBackendService } from '../secrets/SecretBackendService'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerHostIpc(getWindow: () => BrowserWindow | null): void {
  // ── hosts ──────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.hostsList,
    createHandler(HostFilterSchema, (filter: HostFilter) =>
      Promise.resolve(hostRepository.listHosts(filter))
    )
  )

  ipcMain.handle(IPC_CHANNELS.hostsGet,
    createHandler(Id, (id: string) =>
      Promise.resolve(hostRepository.getHost(id))
    )
  )

  ipcMain.handle(IPC_CHANNELS.hostsCreate,
    createHandler(HostInputSchema, (input: HostInput) => {
      const host = hostRepository.createHost(input)
      scheduleCloudUpload()
      return Promise.resolve(host)
    })
  )

  ipcMain.handle(IPC_CHANNELS.hostsUpdate,
    createHandler(z.tuple([Id, HostInputSchema.partial()]), ([id, input]: [string, Partial<HostInput>]) => {
      const host = hostRepository.updateHost(id, input)
      scheduleCloudUpload()
      return Promise.resolve(host)
    })
  )

  ipcMain.handle(IPC_CHANNELS.hostsDelete,
    createHandler(Id, (id: string) => {
      hostRepository.deleteHost(id)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(IPC_CHANNELS.hostsImport, (_e, payload: unknown) => {
    const result = hostImportExportService.importHosts(payload)
    scheduleCloudUpload()
    return result
  })

  ipcMain.handle(IPC_CHANNELS.hostsImportFromFile, async () => {
    const result = await hostImportExportService.importHostsFromFile()
    if (result && !('canceled' in result)) scheduleCloudUpload()
    return result
  })

  ipcMain.handle(IPC_CHANNELS.hostsExport, () => {
    return hostImportExportService.exportHostsBundle()
  })

  ipcMain.handle(IPC_CHANNELS.hostsExportToFile, () => {
    return hostImportExportService.exportHostsToFile()
  })

  // ── groups ─────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.groupsList, () => hostRepository.listGroups())

  ipcMain.handle(IPC_CHANNELS.groupsCreate,
    createHandler(z.tuple([z.string().min(1), z.string().nullable().optional()]), ([name, parentId]) => {
      const group = hostRepository.createGroup(name, parentId ?? null)
      scheduleCloudUpload()
      return Promise.resolve(group)
    })
  )

  // ── profiles ───────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.profilesList, (_e, hostId?: string) => {
    return profileRepository.listProfiles(hostId)
  })

  ipcMain.handle(IPC_CHANNELS.profilesCreate,
    createHandler(ProfileInputSchema, async (input: ProfileInput) => {
      const profile = await withOperationalLogWindow(getWindow, () =>
        profileRepository.createProfile(input)
      )
      scheduleCloudUpload()
      return profile
    })
  )

  ipcMain.handle(IPC_CHANNELS.profilesUpdate,
    createHandler(z.tuple([Id, ProfileInputSchema.partial()]), async ([id, input]: [string, Partial<ProfileInput>]) => {
      const profile = await withOperationalLogWindow(getWindow, () =>
        profileRepository.updateProfile(id, input)
      )
      scheduleCloudUpload()
      return profile
    })
  )

  ipcMain.handle(IPC_CHANNELS.profilesDelete,
    createHandler(Id, (id: string) => {
      profileRepository.deleteProfile(id)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(IPC_CHANNELS.profilesLink,
    createHandler(z.tuple([Id, Id]), ([hostId, profileId]: [string, string]) => {
      profileRepository.linkHostProfile(hostId, profileId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(IPC_CHANNELS.profilesUnlink,
    createHandler(z.tuple([Id, Id]), ([hostId, profileId]: [string, string]) => {
      profileRepository.unlinkHostProfile(hostId, profileId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(IPC_CHANNELS.profilesListHosts,
    createHandler(Id, (profileId: string) =>
      Promise.resolve(profileRepository.listHostsForProfile(profileId))
    )
  )

  ipcMain.handle(IPC_CHANNELS.profilesDuplicate,
    createHandler(
      z.tuple([Id, OptionalId, z.string().optional()]),
      async ([sourceId, targetHostId, name]: [string, string | undefined, string | undefined]) => {
        const profile = await withOperationalLogWindow(getWindow, () =>
          profileRepository.duplicateProfile(sourceId, targetHostId, name)
        )
        scheduleCloudUpload()
        return profile
      }
    )
  )

  // ── credentials (security-gated) ──────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.credentialsStore,
    createHandler(
      z.tuple([CredentialRefSchema, z.string()]),
      async ([ref, secret]: [string, string]) => {
        await secretBackendService.store(ref, secret)
        scheduleCloudUpload()
      }
    )
  )

  ipcMain.handle(IPC_CHANNELS.credentialsDelete,
    createHandler(CredentialRefSchema, async (ref: string) => {
      await secretBackendService.delete(ref)
      scheduleCloudUpload()
    })
  )
}
