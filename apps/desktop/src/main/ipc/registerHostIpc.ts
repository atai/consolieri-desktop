import { ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import { normalizeHostInput } from '@consoleri/core'
import { IPC_CHANNELS } from '../../shared/types'
import type { HostFilter, ProfileInput } from '../../shared/types'
import {
  Id,
  OptionalId,
  HostFilterSchema,
  HostInputSchema,
  HostInputObjectSchema,
  HostSessionPresetInputSchema,
  ProfileInputSchema,
  CredentialRefSchema
} from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { withOperationalLogWindow } from './withOperationalLogWindow'
import { hostRepository } from '../hosts/HostRepository'
import { profileRepository } from '../hosts/ProfileRepository'
import { hostSessionPresetRepository } from '../hosts/HostSessionPresetRepository'
import { deleteHostShellHistory } from '../sessions/shellHistory'
import { hostImportExportService } from '../hosts/hostImportExportServiceInstance'
import { secretBackendService } from '../secrets/SecretBackendService'
import { scheduleCloudUpload } from '../cloud/CloudSyncCoordinator'

export function registerHostIpc(getWindow: () => BrowserWindow | null): void {
  // ── hosts ──────────────────────────────────────────────────────────────────

  ipcMain.handle(
    IPC_CHANNELS.hostsList,
    createHandler(HostFilterSchema, (filter: HostFilter) =>
      Promise.resolve(hostRepository.listHosts(filter))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.hostsGet,
    createHandler(Id, (id: string) => Promise.resolve(hostRepository.getHost(id)))
  )

  ipcMain.handle(
    IPC_CHANNELS.hostsCreate,
    createHandler(HostInputSchema, (input) => {
      const { normalized, errors } = normalizeHostInput(input)
      if (!normalized) {
        throw new Error(Object.values(errors)[0] ?? 'Invalid host')
      }
      const host = hostRepository.createHost(normalized)
      scheduleCloudUpload()
      return Promise.resolve(host)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.hostsUpdate,
    createHandler(
      z.tuple([Id, HostInputObjectSchema.partial()]),
      ([id, input]) => {
        const existing = hostRepository.getHost(id)
        if (!existing) throw new Error(`Host not found: ${id}`)
        const merged = {
          name: input.name ?? existing.name,
          hostname: input.hostname ?? existing.hostname,
          port: input.port ?? existing.port,
          osType: input.osType ?? existing.osType,
          kind: input.kind ?? existing.kind,
          tags: input.tags ?? existing.tags,
          groupId: input.groupId !== undefined ? input.groupId : existing.groupId,
          notes: input.notes ?? existing.notes,
          defaultProfileId:
            input.defaultProfileId !== undefined ? input.defaultProfileId : existing.defaultProfileId,
          uxProfileId: input.uxProfileId !== undefined ? input.uxProfileId : existing.uxProfileId,
          logVerbosity: input.logVerbosity ?? existing.logVerbosity,
          relatedHostIds: input.relatedHostIds ?? existing.relatedHostIds,
          gatewayHostId: input.gatewayHostId !== undefined ? input.gatewayHostId : existing.gatewayHostId,
          httpEndpoint: input.httpEndpoint !== undefined ? input.httpEndpoint : existing.httpEndpoint
        }
        const { normalized, errors } = normalizeHostInput(merged)
        if (!normalized) {
          throw new Error(Object.values(errors)[0] ?? 'Invalid host')
        }
        const host = hostRepository.updateHost(id, normalized)
        scheduleCloudUpload()
        return Promise.resolve(host)
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.hostsDelete,
    createHandler(Id, (id: string) => {
      hostSessionPresetRepository.delete(id)
      deleteHostShellHistory(id)
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

  ipcMain.handle(
    IPC_CHANNELS.groupsCreate,
    createHandler(
      z.tuple([z.string().min(1), z.string().nullable().optional()]),
      ([name, parentId]) => {
        const group = hostRepository.createGroup(name, parentId ?? null)
        scheduleCloudUpload()
        return Promise.resolve(group)
      }
    )
  )

  // ── profiles ───────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.profilesList, (_e, hostId?: string) => {
    return profileRepository.listProfiles(hostId)
  })

  ipcMain.handle(
    IPC_CHANNELS.profilesCreate,
    createHandler(ProfileInputSchema, async (input: ProfileInput) => {
      const profile = await withOperationalLogWindow(getWindow, () =>
        profileRepository.createProfile(input)
      )
      scheduleCloudUpload()
      return profile
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesUpdate,
    createHandler(
      z.tuple([Id, ProfileInputSchema.partial()]),
      async ([id, input]: [string, Partial<ProfileInput>]) => {
        const profile = await withOperationalLogWindow(getWindow, () =>
          profileRepository.updateProfile(id, input)
        )
        scheduleCloudUpload()
        return profile
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesDelete,
    createHandler(Id, (id: string) => {
      profileRepository.deleteProfile(id)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesLink,
    createHandler(z.tuple([Id, Id]), ([hostId, profileId]: [string, string]) => {
      profileRepository.linkHostProfile(hostId, profileId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesUnlink,
    createHandler(z.tuple([Id, Id]), ([hostId, profileId]: [string, string]) => {
      profileRepository.unlinkHostProfile(hostId, profileId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesListHosts,
    createHandler(Id, (profileId: string) =>
      Promise.resolve(profileRepository.listHostsForProfile(profileId))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.profilesDuplicate,
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

  ipcMain.handle(
    IPC_CHANNELS.credentialsStore,
    createHandler(
      z.tuple([CredentialRefSchema, z.string()]),
      async ([ref, secret]: [string, string]) => {
        await secretBackendService.store(ref, secret)
        scheduleCloudUpload()
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.credentialsDelete,
    createHandler(CredentialRefSchema, async (ref: string) => {
      await secretBackendService.delete(ref)
      scheduleCloudUpload()
    })
  )

  // ── host session presets ───────────────────────────────────────────────────

  ipcMain.handle(
    IPC_CHANNELS.hostPresetsGet,
    createHandler(Id, (hostId: string) => Promise.resolve(hostSessionPresetRepository.get(hostId)))
  )

  ipcMain.handle(
    IPC_CHANNELS.hostPresetsSave,
    createHandler(
      z.tuple([Id, HostSessionPresetInputSchema]),
      ([hostId, input]) => {
        const host = hostRepository.getHost(hostId)
        if (!host) throw new Error(`Host not found: ${hostId}`)
        const preset = hostSessionPresetRepository.save(hostId, {
          layout: input.layout ?? null,
          panes: input.panes
        })
        scheduleCloudUpload()
        return Promise.resolve(preset)
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.hostPresetsDelete,
    createHandler(Id, (hostId: string) => {
      hostSessionPresetRepository.delete(hostId)
      scheduleCloudUpload()
      return Promise.resolve()
    })
  )
}
