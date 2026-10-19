import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { MosaicNode } from 'react-mosaic-component'
import type { PaneBinding, SessionInfo, WorkspaceState, WorkspaceTab } from '@shared/types'
import { releaseTerminal } from '../terminal/TerminalPool'

const LAYOUT_SAVE_DEBOUNCE_MS = 300
let layoutSaveTimer: ReturnType<typeof setTimeout> | null = null

export interface OpenWorkspaceTabInput {
  hostId: string | null
  title: string
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
}

interface SessionWorkspaceState {
  sessions: SessionInfo[]
  tabs: WorkspaceTab[]
  activeTabId: string | null
  addSession: (session: SessionInfo) => void
  upsertSession: (session: SessionInfo) => void
  updateSession: (id: string, patch: Partial<SessionInfo>) => void
  removeSession: (id: string) => void
  setWorkspace: (ws: WorkspaceState) => void
  findTabByHost: (hostId: string) => WorkspaceTab | undefined
  openTab: (input: OpenWorkspaceTabInput) => string
  activateTab: (tabId: string) => void
  updateTab: (tabId: string, patch: Partial<Omit<WorkspaceTab, 'id'>>) => void
  persistTab: (
    tabId: string,
    layout: MosaicNode<string> | null,
    panes: PaneBinding[],
    options?: { debounce?: boolean }
  ) => void
  /** Drops a tab whose sessions were already closed. */
  removeTab: (tabId: string) => void
  /** Closes every session in the tab, then drops it. */
  closeTab: (tabId: string) => void
}

function workspaceSnapshot(tabs: WorkspaceTab[], activeTabId: string | null): WorkspaceState {
  return { tabs, activeTabId }
}

function cancelScheduledSave(): void {
  if (layoutSaveTimer) {
    clearTimeout(layoutSaveTimer)
    layoutSaveTimer = null
  }
}

function saveWorkspace(state: WorkspaceState, debounce = false): void {
  if (debounce) {
    cancelScheduledSave()
    layoutSaveTimer = setTimeout(() => {
      layoutSaveTimer = null
      void window.consoleri.workspace.save(state)
    }, LAYOUT_SAVE_DEBOUNCE_MS)
    return
  }
  cancelScheduledSave()
  void window.consoleri.workspace.save(state)
}

function nextActiveTabId(
  tabs: WorkspaceTab[],
  closedId: string,
  activeTabId: string | null
): string | null {
  if (activeTabId !== closedId) return activeTabId
  const index = tabs.findIndex((tab) => tab.id === closedId)
  const remaining = tabs.filter((tab) => tab.id !== closedId)
  return remaining[index]?.id ?? remaining[index - 1]?.id ?? null
}

function closeTabSessions(tab: WorkspaceTab): string[] {
  const sessionIds: string[] = []
  for (const pane of tab.panes) {
    if (pane.connectRequest.hostId) {
      void window.consoleri.shellHistory.deletePane(pane.connectRequest.hostId, pane.paneId)
    }
    if (!pane.sessionId) continue
    sessionIds.push(pane.sessionId)
    window.consoleri.sessions.close(pane.sessionId)
    releaseTerminal(pane.sessionId)
  }
  return sessionIds
}

export const useSessionWorkspaceStore = create<SessionWorkspaceState>((set, get) => ({
  sessions: [],
  tabs: [],
  activeTabId: null,
  addSession: (session) => set({ sessions: [...get().sessions, session] }),
  upsertSession: (session) =>
    set({
      sessions: get().sessions.some((s) => s.id === session.id)
        ? get().sessions.map((s) => (s.id === session.id ? session : s))
        : [...get().sessions, session]
    }),
  updateSession: (id, patch) =>
    set({ sessions: get().sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
  removeSession: (id) => set({ sessions: get().sessions.filter((s) => s.id !== id) }),
  setWorkspace: (workspace) => set({ tabs: workspace.tabs, activeTabId: workspace.activeTabId }),
  findTabByHost: (hostId) => get().tabs.find((tab) => tab.hostId === hostId),
  openTab: (input) => {
    const tab: WorkspaceTab = {
      id: nanoid(),
      hostId: input.hostId,
      title: input.title,
      layout: input.layout,
      panes: input.panes
    }
    const tabs = [...get().tabs, tab]
    set({ tabs, activeTabId: tab.id })
    saveWorkspace(workspaceSnapshot(tabs, tab.id))
    return tab.id
  },
  activateTab: (tabId) => {
    if (!get().tabs.some((tab) => tab.id === tabId)) {
      throw new Error(`Unknown workspace tab ${tabId}`)
    }
    if (get().activeTabId === tabId) return
    set({ activeTabId: tabId })
    saveWorkspace(workspaceSnapshot(get().tabs, tabId))
  },
  updateTab: (tabId, patch) => {
    if (!get().tabs.some((tab) => tab.id === tabId)) {
      throw new Error(`Unknown workspace tab ${tabId}`)
    }
    const tabs = get().tabs.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab))
    set({ tabs })
    saveWorkspace(workspaceSnapshot(tabs, get().activeTabId))
  },
  persistTab: (tabId, layout, panes, options) => {
    if (!get().tabs.some((tab) => tab.id === tabId)) {
      throw new Error(`Unknown workspace tab ${tabId}`)
    }
    const tabs = get().tabs.map((tab) => (tab.id === tabId ? { ...tab, layout, panes } : tab))
    set({ tabs })
    saveWorkspace(workspaceSnapshot(tabs, get().activeTabId), options?.debounce)
  },
  removeTab: (tabId) => {
    const { tabs, activeTabId } = get()
    if (!tabs.some((tab) => tab.id === tabId)) {
      throw new Error(`Unknown workspace tab ${tabId}`)
    }
    const nextActive = nextActiveTabId(tabs, tabId, activeTabId)
    const nextTabs = tabs.filter((tab) => tab.id !== tabId)
    set({ tabs: nextTabs, activeTabId: nextActive })
    saveWorkspace(workspaceSnapshot(nextTabs, nextActive))
  },
  closeTab: (tabId) => {
    const tab = get().tabs.find((item) => item.id === tabId)
    if (!tab) throw new Error(`Unknown workspace tab ${tabId}`)
    const sessionIds = new Set(closeTabSessions(tab))
    set({ sessions: get().sessions.filter((session) => !sessionIds.has(session.id)) })
    get().removeTab(tabId)
  }
}))

export function flushWorkspacePersist(): void {
  cancelScheduledSave()
  const { tabs, activeTabId } = useSessionWorkspaceStore.getState()
  void window.consoleri.workspace.save(workspaceSnapshot(tabs, activeTabId))
}
