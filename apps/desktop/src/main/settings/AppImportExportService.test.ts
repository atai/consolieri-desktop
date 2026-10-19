import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VaultSettings } from '@consoleri/core'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/test-consoleri'
  },
  dialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn()
  }
}))

vi.mock('../ux/UxProfileRepository', () => ({
  uxProfileRepository: {
    list: vi.fn(() => [])
  }
}))

import { resetDatabaseForTest, setDatabaseForTest } from '../db/database'
import { HostRepository } from '../hosts/HostRepository'
import { HostImportExportService } from '../hosts/HostImportExportService'
import type { ProfileRepository } from '../hosts/ProfileRepository'
import { WorkspaceRepository } from '../hosts/WorkspaceRepository'
import { AppPreferencesRepository } from '../preferences/AppPreferencesRepository'
import { AppImportExportService } from './AppImportExportService'

const profileRepo = {
  listProfiles: () => [],
  listAllProfileLinks: () => []
} as unknown as ProfileRepository

const vaultSettings: VaultSettings = {
  enabled: false,
  address: '',
  namespace: '',
  defaultKvMount: 'secret',
  secretPathPrefix: 'consoleri',
  defaultBackend: 'local',
  auth: { method: 'token', hasToken: false },
  tlsSkipVerify: false
}

describe('AppImportExportService workspace tabs', () => {
  let workspaceRepo: WorkspaceRepository
  let service: AppImportExportService

  beforeEach(() => {
    setDatabaseForTest(':memory:')
    const hostRepo = new HostRepository()
    workspaceRepo = new WorkspaceRepository()
    service = new AppImportExportService(
      new AppPreferencesRepository(),
      { getSettings: () => vaultSettings } as never,
      { getActiveId: () => null, list: () => [] } as never,
      new HostImportExportService(hostRepo, profileRepo),
      { list: () => [] } as never,
      workspaceRepo,
      { listAllEncrypted: () => [], replaceAll: vi.fn() } as never
    )
  })

  afterEach(() => {
    resetDatabaseForTest()
  })

  it('exports workspace tabs and restores them on import', () => {
    workspaceRepo.saveWorkspace(
      {
        activeTabId: 'tab-1',
        tabs: [
          {
            id: 'tab-1',
            hostId: 'h1',
            title: 'web01',
            layout: { type: 'leaf', id: 'pane-1' },
            panes: [
              {
                paneId: 'pane-1',
                sessionId: null,
                protocol: 'ssh',
                title: 'web01',
                connectRequest: { hostId: 'h1', profileId: 'p1', protocol: 'ssh', title: 'web01' }
              }
            ]
          }
        ]
      },
      'Work'
    )

    const doc = service.exportAppBundle()
    expect(doc.workspace?.name).toBe('Work')
    expect(doc.workspace?.activeTabId).toBe('tab-1')
    expect(doc.workspace?.tabs[0]?.panes[0]?.connectRequest).toMatchObject({
      hostId: 'h1',
      profileId: 'p1',
      protocol: 'ssh'
    })

    workspaceRepo.saveWorkspace({ tabs: [], activeTabId: null }, 'Empty')
    service.importAppBundleReplace(doc)

    const loaded = workspaceRepo.loadWorkspace()
    expect(loaded.activeTabId).toBe('tab-1')
    expect(loaded.tabs).toHaveLength(1)
    expect(loaded.tabs[0]?.title).toBe('web01')
    expect(loaded.tabs[0]?.hostId).toBe('h1')
    expect(loaded.tabs[0]?.panes[0]?.connectRequest).toMatchObject({
      hostId: 'h1',
      profileId: 'p1'
    })
    expect(workspaceRepo.getActiveWorkspace().name).toBe('Work')
  })
})
