import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionInfo } from '@shared/types'

// ── store stubs ───────────────────────────────────────────────────────────────
const {
  mockAddSession,
  mockWorkspaceGetState,
  mockPrefsGetState,
  mockOpenTab,
  mockActivateTab,
  mockFindTabByHost
} = vi.hoisted(() => ({
  mockAddSession: vi.fn(),
  mockWorkspaceGetState: vi.fn(),
  mockPrefsGetState: vi.fn(),
  mockOpenTab: vi.fn(),
  mockActivateTab: vi.fn(),
  mockFindTabByHost: vi.fn((): { id: string } | undefined => undefined)
}))

vi.mock('../stores/sessionWorkspaceStore', () => ({
  useSessionWorkspaceStore: { getState: mockWorkspaceGetState },
  flushWorkspacePersist: vi.fn()
}))

vi.mock('../stores/preferencesStore', () => ({
  usePreferencesStore: { getState: mockPrefsGetState }
}))

// ── TerminalPool stub ─────────────────────────────────────────────────────────
vi.mock('../terminal/TerminalPool', () => ({
  releaseTerminal: vi.fn()
}))

// ── window.consoleri mock helpers ─────────────────────────────────────────────
type MockConsoleri = {
  sessions: {
    open: ReturnType<typeof vi.fn>
    openLogWindow: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    reconnect: ReturnType<typeof vi.fn>
  }
  workspace: {
    save: ReturnType<typeof vi.fn>
  }
}

function makeMockConsoleri(sessionOverrides?: Partial<SessionInfo>): MockConsoleri {
  return {
    sessions: {
      open: vi.fn(),
      openLogWindow: vi.fn(),
      close: vi.fn(),
      reconnect: vi.fn()
    },
    workspace: {
      save: vi.fn().mockResolvedValue(undefined)
    },
    ...sessionOverrides
  }
}

function makeSessionInfo(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    id: 'sess-1',
    protocol: 'ssh',
    title: 'web01',
    status: 'connecting',
    hostId: null,
    profileId: null,
    ...overrides
  }
}

const mockRemoveSession = vi.fn()

function makeWorkspaceState(overrides: object = {}): {
  addSession: typeof mockAddSession
  tabs: unknown[]
  findTabByHost: typeof mockFindTabByHost
  activateTab: typeof mockActivateTab
  openTab: typeof mockOpenTab
  removeSession: typeof mockRemoveSession
} {
  return {
    addSession: mockAddSession,
    tabs: [],
    findTabByHost: mockFindTabByHost,
    activateTab: mockActivateTab,
    openTab: mockOpenTab,
    removeSession: mockRemoveSession,
    ...overrides
  }
}

function makePrefsState(overrides: object = {}): {
  settings: {
    autoOpenConnectionLog: boolean
    sessionOpenMode: string
    keybindings: object
    externalControl: { enabled: boolean }
  }
} {
  return {
    settings: {
      autoOpenConnectionLog: false,
      sessionOpenMode: 'workspace',
      keybindings: {},
      externalControl: { enabled: false }
    },
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFindTabByHost.mockReturnValue(undefined)
  mockWorkspaceGetState.mockReturnValue(makeWorkspaceState())
  mockPrefsGetState.mockReturnValue(makePrefsState())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── openSession ───────────────────────────────────────────────────────────────
import { openSession, openSessionAndAddToWorkspace } from './openSession'

function stubConsoleri(api: MockConsoleri): void {
  vi.stubGlobal('alert', vi.fn())
  Object.defineProperty(window, 'consoleri', { value: api, writable: true, configurable: true })
}

describe('openSession', () => {
  it('returns the session and calls addSession on success', async () => {
    const session = makeSessionInfo({ status: 'connecting' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    stubConsoleri(api)

    const result = await openSession({ protocol: 'ssh', hostId: 'h1' })
    expect(result).toEqual(session)
    expect(mockAddSession).toHaveBeenCalledWith(session)
  })

  it('returns null and shows alert when session status is error', async () => {
    const session = makeSessionInfo({ status: 'error', error: 'Auth failed' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    vi.stubGlobal('alert', vi.fn())
    stubConsoleri(api)

    const result = await openSession({ protocol: 'ssh' })
    expect(result).toBeNull()
    expect(mockAddSession).not.toHaveBeenCalled()
    expect(window.alert).toHaveBeenCalledWith('Auth failed')
  })

  it('opens log window on error when autoOpenConnectionLog is true', async () => {
    const session = makeSessionInfo({ status: 'error' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    mockPrefsGetState.mockReturnValue(
      makePrefsState({ settings: { autoOpenConnectionLog: true, sessionOpenMode: 'workspace' } })
    )
    stubConsoleri(api)

    await openSession({ protocol: 'ssh' })
    expect(api.sessions.openLogWindow).toHaveBeenCalledWith(session.id)
  })

  it('opens log window when connecting and autoOpenConnectionLog is true', async () => {
    const session = makeSessionInfo({ status: 'connecting' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    mockPrefsGetState.mockReturnValue(
      makePrefsState({ settings: { autoOpenConnectionLog: true, sessionOpenMode: 'workspace' } })
    )
    stubConsoleri(api)

    await openSession({ protocol: 'ssh' })
    expect(api.sessions.openLogWindow).toHaveBeenCalledWith(session.id)
  })

  it('opens a new tab for a host that has none', async () => {
    const session = makeSessionInfo({ status: 'connecting', title: 'web01' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    stubConsoleri(api)

    await openSessionAndAddToWorkspace({ protocol: 'ssh', hostId: 'h1' }, 'web01')

    expect(mockOpenTab).toHaveBeenCalledWith(
      expect.objectContaining({
        hostId: 'h1',
        title: 'web01',
        panes: [expect.objectContaining({ sessionId: 'sess-1' })]
      })
    )
    expect(mockActivateTab).not.toHaveBeenCalled()
  })

  it('activates the existing host tab instead of opening another session', async () => {
    const api = makeMockConsoleri()
    stubConsoleri(api)
    mockFindTabByHost.mockReturnValue({ id: 'tab-h1' })

    await openSessionAndAddToWorkspace({ protocol: 'ssh', hostId: 'h1' }, 'web01')

    expect(mockActivateTab).toHaveBeenCalledWith('tab-h1')
    expect(api.sessions.open).not.toHaveBeenCalled()
    expect(mockOpenTab).not.toHaveBeenCalled()
  })

  it('does NOT open log window when autoOpenConnectionLog is false', async () => {
    const session = makeSessionInfo({ status: 'connecting' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    stubConsoleri(api)

    await openSession({ protocol: 'ssh' })
    expect(api.sessions.openLogWindow).not.toHaveBeenCalled()
  })
})

// ── openMosaicSession (sessionMosaicOps) ──────────────────────────────────────
import { openMosaicSession } from './mosaic/sessionMosaicOps'

describe('openMosaicSession', () => {
  it('returns the session on success', async () => {
    const session = makeSessionInfo({ status: 'connecting' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    stubConsoleri(api)

    const result = await openMosaicSession({ protocol: 'ssh' })
    expect(result).toEqual(session)
  })

  it('returns null and shows alert on error status', async () => {
    const session = makeSessionInfo({ status: 'error', error: 'Connection refused' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    vi.stubGlobal('alert', vi.fn())
    stubConsoleri(api)

    const result = await openMosaicSession({ protocol: 'ssh' })
    expect(result).toBeNull()
    expect(window.alert).toHaveBeenCalledWith('Connection refused')
  })

  it('opens log window on error when autoOpenConnectionLog setting is true', async () => {
    const session = makeSessionInfo({ status: 'error' })
    const api = makeMockConsoleri()
    api.sessions.open.mockResolvedValue(session)
    mockPrefsGetState.mockReturnValue(
      makePrefsState({ settings: { autoOpenConnectionLog: true, sessionOpenMode: 'workspace' } })
    )
    vi.stubGlobal('alert', vi.fn())
    stubConsoleri(api)

    await openMosaicSession({ protocol: 'ssh' })
    expect(api.sessions.openLogWindow).toHaveBeenCalledWith(session.id)
  })
})
