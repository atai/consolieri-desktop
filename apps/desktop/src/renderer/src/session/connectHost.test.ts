import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Host } from '@shared/types'

const openHostWindow = vi.fn().mockResolvedValue(undefined)
const openSessionWindow = vi.fn().mockResolvedValue(undefined)
const openSession = vi.fn()

const { prefs, workspaceStore, openSessionAndAddToWorkspace, restoreHostPresetSessions } =
  vi.hoisted(() => ({
    prefs: { sessionOpenMode: 'window' },
    workspaceStore: {
      upsertSession: vi.fn(),
      openTab: vi.fn(),
      activateTab: vi.fn(),
      findTabByHost: vi.fn((): { id: string } | undefined => undefined)
    },
    openSessionAndAddToWorkspace: vi.fn(),
    restoreHostPresetSessions: vi.fn()
  }))

vi.mock('../stores/preferencesStore', () => ({
  usePreferencesStore: {
    getState: () => ({
      settings: { sessionOpenMode: prefs.sessionOpenMode, autoOpenConnectionLog: false }
    })
  }
}))

vi.mock('../stores/sessionWorkspaceStore', () => ({
  useSessionWorkspaceStore: {
    getState: () => workspaceStore
  }
}))

vi.mock('./openSession', () => ({
  openSession: (...args: unknown[]) => openSession(...args),
  openSessionAndAddToWorkspace: (...args: unknown[]) => openSessionAndAddToWorkspace(...args)
}))

vi.mock('./localProject', () => ({
  restoreHostPresetSessions: (...args: unknown[]) => restoreHostPresetSessions(...args)
}))

describe('connectHostInWindow', () => {
  beforeEach(() => {
    prefs.sessionOpenMode = 'window'
    openHostWindow.mockClear()
    openSessionWindow.mockClear()
    openSession.mockClear()
    ;(window as unknown as { consoleri: unknown }).consoleri = {
      sessions: { openHostWindow, openSessionWindow },
      profiles: { list: vi.fn().mockResolvedValue([]) },
      hostPresets: { get: vi.fn().mockResolvedValue(null) }
    }
  })

  it('opens the host window immediately without sessions.open', async () => {
    const { connectHostInWindow } = await import('./connectHost')
    const host: Host = {
      id: 'h1',
      name: 'box',
      hostname: '10.0.0.1',
      port: 22,
      kind: 'remote',
      osType: 'linux',
      tags: [],
      groupId: null,
      notes: '',
      defaultProfileId: null,
      uxProfileId: null,
      logVerbosity: 'info',
      relatedHostIds: [],
      gatewayHostId: null,
      httpEndpoint: null,
      homeDir: null,
      createdAt: '',
      updatedAt: ''
    }

    await connectHostInWindow(host, 'prof-1')

    expect(openHostWindow).toHaveBeenCalledWith('h1', 'prof-1')
    expect(openSession).not.toHaveBeenCalled()
    expect(openSessionWindow).not.toHaveBeenCalled()
  })
})

function host(homeDir: string | null): Host {
  return {
    id: 'h1',
    name: 'box',
    hostname: '10.0.0.1',
    port: 22,
    kind: 'remote',
    osType: 'linux',
    tags: [],
    groupId: null,
    notes: '',
    defaultProfileId: null,
    uxProfileId: null,
    logVerbosity: 'info',
    relatedHostIds: [],
    gatewayHostId: null,
    httpEndpoint: null,
    homeDir,
    createdAt: '',
    updatedAt: ''
  }
}

describe('resolveHostConnectRequest', () => {
  beforeEach(() => {
    ;(window as unknown as { consoleri: unknown }).consoleri = {
      profiles: { list: vi.fn().mockResolvedValue([]) }
    }
  })

  it('sets cwd from the host home folder for a new console', async () => {
    const { resolveHostConnectRequest } = await import('./connectHost')
    await expect(resolveHostConnectRequest(host('/srv/app'))).resolves.toEqual({
      hostId: 'h1',
      profileId: undefined,
      cwd: '/srv/app'
    })
  })

  it('omits cwd when the home folder is empty', async () => {
    const { resolveHostConnectRequest } = await import('./connectHost')
    await expect(resolveHostConnectRequest(host(null))).resolves.toEqual({
      hostId: 'h1',
      profileId: undefined
    })
    await expect(resolveHostConnectRequest(host('   '))).resolves.toEqual({
      hostId: 'h1',
      profileId: undefined
    })
  })
})

describe('connectHost workspace tabs', () => {
  beforeEach(() => {
    prefs.sessionOpenMode = 'workspace'
    workspaceStore.openTab.mockClear()
    workspaceStore.activateTab.mockClear()
    workspaceStore.upsertSession.mockClear()
    workspaceStore.findTabByHost.mockReset()
    workspaceStore.findTabByHost.mockReturnValue(undefined)
    openSessionAndAddToWorkspace.mockReset()
    restoreHostPresetSessions.mockReset()
  })

  function localHost(id: string, name: string): Host {
    return { ...host(null), id, name, kind: 'local', hostname: 'localhost', port: 0 }
  }

  it('opens one tab per saved connection and leaves the first tab in place', async () => {
    restoreHostPresetSessions.mockImplementation(async (target: Host) => ({
      layout: target.id,
      panes: [
        {
          paneId: target.id,
          sessionId: `s-${target.id}`,
          protocol: 'local_pty',
          title: target.name,
          connectRequest: { hostId: target.id }
        }
      ],
      sessions: []
    }))
    ;(window as unknown as { consoleri: unknown }).consoleri = {
      sessions: { openHostWindow, openSessionWindow },
      profiles: { list: vi.fn().mockResolvedValue([]) },
      hostPresets: {
        get: vi.fn().mockResolvedValue({ layout: null, panes: [{ paneId: 'preset' }] })
      }
    }
    const { connectHost } = await import('./connectHost')

    await connectHost(localHost('h1', 'alpha'))
    await connectHost(localHost('h2', 'beta'))

    expect(workspaceStore.openTab).toHaveBeenCalledTimes(2)
    expect(workspaceStore.openTab).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ hostId: 'h1', title: 'alpha' })
    )
    expect(workspaceStore.openTab).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ hostId: 'h2', title: 'beta' })
    )
    expect(workspaceStore.activateTab).not.toHaveBeenCalled()
  })

  it('activates the existing host tab instead of restoring the preset again', async () => {
    workspaceStore.findTabByHost.mockReturnValue({ id: 'tab-h1' })
    ;(window as unknown as { consoleri: unknown }).consoleri = {
      sessions: { openHostWindow, openSessionWindow },
      profiles: { list: vi.fn().mockResolvedValue([]) },
      hostPresets: {
        get: vi.fn().mockResolvedValue({ layout: null, panes: [{ paneId: 'preset' }] })
      }
    }
    const { connectHost } = await import('./connectHost')

    await connectHost(localHost('h1', 'alpha'))

    expect(workspaceStore.activateTab).toHaveBeenCalledWith('tab-h1')
    expect(restoreHostPresetSessions).not.toHaveBeenCalled()
    expect(workspaceStore.openTab).not.toHaveBeenCalled()
  })
})
