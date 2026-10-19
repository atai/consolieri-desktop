import type { MosaicNode } from 'react-mosaic-component'
import { nanoid } from 'nanoid'
import { insertPaneIntoLayout, splitPaneInLayout } from '@consoleri/core'
import type { MosaicNode as CoreMosaicNode } from '@consoleri/core'
import type { OpenSessionRequest, PaneBinding, SessionInfo, WorkspaceTab } from '@shared/types'
import { useSessionWorkspaceStore } from '../stores/sessionWorkspaceStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { getConsoleriApi } from '../api'
import { releaseTerminal } from '../terminal/TerminalPool'

export async function openSession(request: OpenSessionRequest): Promise<SessionInfo | null> {
  const api = getConsoleriApi()
  const { addSession } = useSessionWorkspaceStore.getState()
  const { settings } = usePreferencesStore.getState()
  const session = await api.sessions.open(request)

  if (session.status === 'error') {
    alert(session.error ?? 'Connection failed')
    if (settings.autoOpenConnectionLog) {
      void api.sessions.openLogWindow(session.id)
    }
    return null
  }

  addSession(session)

  if (settings.autoOpenConnectionLog && session.status === 'connecting') {
    void api.sessions.openLogWindow(session.id)
  }

  return session
}

function createBinding(session: SessionInfo, connectRequest: OpenSessionRequest): PaneBinding {
  return {
    paneId: nanoid(),
    sessionId: session.id,
    protocol: session.protocol,
    title: session.title,
    connectRequest
  }
}

function requireTab(tabId: string): WorkspaceTab {
  const tab = useSessionWorkspaceStore.getState().tabs.find((item) => item.id === tabId)
  if (!tab) throw new Error(`Unknown workspace tab ${tabId}`)
  return tab
}

export async function addSessionToWorkspace(
  tabId: string,
  session: SessionInfo,
  connectRequest: OpenSessionRequest
): Promise<void> {
  const binding = createBinding(session, connectRequest)
  const tab = requireTab(tabId)
  const { persistTab } = useSessionWorkspaceStore.getState()
  const panes = [...tab.panes, binding]
  const currentLayout = tab.layout as MosaicNode<string> | null
  const nextLayout = insertPaneIntoLayout(
    currentLayout as CoreMosaicNode<string> | null,
    binding.paneId
  ) as MosaicNode<string>
  persistTab(tabId, nextLayout, panes)
}

export async function splitPaneInWorkspace(
  tabId: string,
  sourcePaneId: string,
  direction: 'row' | 'column'
): Promise<void> {
  const tab = requireTab(tabId)
  const { persistTab } = useSessionWorkspaceStore.getState()
  const sourceBinding = tab.panes.find((p) => p.paneId === sourcePaneId)
  if (!sourceBinding) return

  const session = await openSession({ ...sourceBinding.connectRequest })
  if (!session) return

  const newBinding = createBinding(session, { ...sourceBinding.connectRequest })
  const layout = tab.layout as MosaicNode<string> | null
  if (!layout) return

  const nextLayout = splitPaneInLayout(
    layout as CoreMosaicNode<string>,
    sourcePaneId,
    newBinding.paneId,
    direction
  ) as MosaicNode<string> | null
  if (!nextLayout) return

  persistTab(tabId, nextLayout, [...tab.panes, newBinding])
}

export async function connectPane(tabId: string, paneId: string): Promise<void> {
  const tab = requireTab(tabId)
  const { persistTab, removeSession } = useSessionWorkspaceStore.getState()
  const binding = tab.panes.find((p) => p.paneId === paneId)
  if (!binding) return

  const session = await openSession({ ...binding.connectRequest })
  if (!session) return

  if (binding.sessionId) {
    getConsoleriApi().sessions.close(binding.sessionId)
    releaseTerminal(binding.sessionId)
    removeSession(binding.sessionId)
  }

  const panes = tab.panes.map((p) =>
    p.paneId === paneId
      ? { ...p, sessionId: session.id, title: session.title, protocol: session.protocol }
      : p
  )
  persistTab(tabId, tab.layout as MosaicNode<string> | null, panes)
}

export async function openSessionAndAddToWorkspace(
  request: OpenSessionRequest,
  title?: string
): Promise<void> {
  const store = useSessionWorkspaceStore.getState()
  if (request.hostId) {
    const existing = store.findTabByHost(request.hostId)
    if (existing) {
      store.activateTab(existing.id)
      return
    }
  }

  const session = await openSession(request)
  if (!session) return
  const binding = createBinding(session, request)
  store.openTab({
    hostId: request.hostId ?? null,
    title: title ?? request.title ?? session.title,
    layout: binding.paneId,
    panes: [binding]
  })
}
