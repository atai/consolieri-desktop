import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Host } from '@shared/types'

const openHostWindow = vi.fn().mockResolvedValue(undefined)
const openSessionWindow = vi.fn().mockResolvedValue(undefined)
const openSession = vi.fn()

vi.mock('../stores/preferencesStore', () => ({
  usePreferencesStore: {
    getState: () => ({
      settings: { sessionOpenMode: 'window', autoOpenConnectionLog: false }
    })
  }
}))

vi.mock('../stores/sessionWorkspaceStore', () => ({
  useSessionWorkspaceStore: {
    getState: () => ({
      upsertSession: vi.fn(),
      persistWorkspace: vi.fn(),
      addSession: vi.fn()
    })
  }
}))

vi.mock('./openSession', () => ({
  openSession: (...args: unknown[]) => openSession(...args),
  openSessionAndAddToWorkspace: vi.fn()
}))

vi.mock('./localProject', () => ({
  restoreHostPresetSessions: vi.fn()
}))

describe('connectHostInWindow', () => {
  beforeEach(() => {
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
