import { useCallback, useEffect, useState } from 'react'
import type { MosaicNode } from 'react-mosaic-component'
import type { PaneBinding, SessionInfo } from '@shared/types'
import { flushWorkspacePersist, useSessionWorkspaceStore } from '../../stores/sessionWorkspaceStore'
import { SessionMosaic } from '../../session/mosaic/SessionMosaic'
import {
  closeMosaicPane,
  reconnectMosaicPane,
  splitMosaicPane
} from '../../session/mosaic/sessionMosaicOps'
import { serializeAll } from '../../terminal/TerminalPool'
import {
  createLocalProjectHost,
  isLocalOnlyLayout,
  savePresetToHost
} from '../../session/localProject'
import { SaveLocalProjectDialog } from '../hosts/SaveLocalProjectDialog'
import { WorkspaceTabBar } from './WorkspaceTabBar'

export function MosaicWorkspace(): React.JSX.Element {
  const {
    tabs,
    activeTabId,
    sessions,
    persistTab,
    updateTab,
    removeTab,
    closeTab,
    activateTab,
    addSession,
    updateSession,
    removeSession
  } = useSessionWorkspaceStore()
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saveTabId, setSaveTabId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [boundHostNameState, setBoundHostNameState] = useState<{
    id: string
    name: string | null
  } | null>(null)

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null
  const canSave = activeTab ? isLocalOnlyLayout(activeTab.panes) : false
  const boundHostId = activeTab?.hostId ?? null
  const boundHostName =
    boundHostId && boundHostNameState?.id === boundHostId ? boundHostNameState.name : null

  useEffect(() => {
    if (!boundHostId) return
    let cancelled = false
    void window.consoleri.hosts.get(boundHostId).then((host) => {
      if (!cancelled) setBoundHostNameState({ id: boundHostId, name: host?.name ?? null })
    })
    return () => {
      cancelled = true
    }
  }, [boundHostId])

  useEffect(() => {
    const saveOnExit = (): void => {
      const scrollbacks = serializeAll()
      for (const { sessionId, data } of scrollbacks) {
        const session = sessions.find((s) => s.id === sessionId)
        if (!session) continue
        window.consoleri.sessions.snapshot({
          id: sessionId,
          hostId: session.hostId,
          profileId: session.profileId,
          protocol: session.protocol,
          title: session.title,
          cwd: null,
          cols: 80,
          rows: 24,
          scrollbackSerialized: data
        })
      }
      flushWorkspacePersist()
    }
    window.addEventListener('beforeunload', saveOnExit)
    return () => window.removeEventListener('beforeunload', saveOnExit)
  }, [sessions])

  const handleLayoutChange = useCallback(
    (tabId: string, panes: PaneBinding[]) =>
      (next: MosaicNode<string> | null, options?: { debounce?: boolean }) => {
        persistTab(tabId, next, panes, options)
      },
    [persistTab]
  )

  const handleSplitPane = async (
    tabId: string,
    paneId: string,
    direction: 'row' | 'column'
  ): Promise<void> => {
    const tab = useSessionWorkspaceStore.getState().tabs.find((item) => item.id === tabId)
    if (!tab) return
    const result = await splitMosaicPane(
      tab.layout as MosaicNode<string> | null,
      tab.panes,
      paneId,
      direction
    )
    if (!result) return
    result.sessions.forEach((session) => addSession(session))
    persistTab(tabId, result.layout, result.panes)
  }

  const handleConnectPane = async (tabId: string, paneId: string): Promise<void> => {
    const tab = useSessionWorkspaceStore.getState().tabs.find((item) => item.id === tabId)
    if (!tab) return
    const result = await reconnectMosaicPane(tab.panes, paneId)
    if (!result) return
    updateSession(result.session.id, result.session)
    persistTab(tabId, tab.layout as MosaicNode<string> | null, result.panes)
  }

  const handleClosePane = (tabId: string, paneId: string): void => {
    const tab = useSessionWorkspaceStore.getState().tabs.find((item) => item.id === tabId)
    if (!tab) return
    const {
      layout: nextLayout,
      panes: nextPanes,
      closedSessionId
    } = closeMosaicPane(tab.layout as MosaicNode<string> | null, tab.panes, paneId)
    if (closedSessionId) removeSession(closedSessionId)
    if (nextPanes.length === 0) {
      removeTab(tabId)
      return
    }
    persistTab(tabId, nextLayout, nextPanes)
  }

  const handleSessionUpdated = (session: SessionInfo): void => {
    updateSession(session.id, session)
  }

  const handleSave = async (): Promise<void> => {
    const tab = useSessionWorkspaceStore
      .getState()
      .tabs.find((item) => item.id === useSessionWorkspaceStore.getState().activeTabId)
    if (!tab || !isLocalOnlyLayout(tab.panes)) return
    if (tab.hostId) {
      setSaving(true)
      try {
        await savePresetToHost(tab.hostId, tab.layout as MosaicNode<string> | null, tab.panes)
      } finally {
        setSaving(false)
      }
      return
    }
    setSaveTabId(tab.id)
    setShowSaveAs(true)
  }

  const handleSaveAs = async (name: string, tags: string[]): Promise<void> => {
    const tab = useSessionWorkspaceStore.getState().tabs.find((item) => item.id === saveTabId)
    if (!tab) return
    const layout = tab.layout as MosaicNode<string> | null
    setSaving(true)
    try {
      const host = await createLocalProjectHost({
        name,
        tags,
        layout,
        panes: tab.panes
      })
      setBoundHostNameState({ id: host.id, name: host.name })
      updateTab(tab.id, {
        hostId: host.id,
        title: host.name,
        panes: tab.panes.map((pane) => ({
          ...pane,
          connectRequest: {
            ...pane.connectRequest,
            hostId: host.id,
            profileId: host.defaultProfileId ?? pane.connectRequest.profileId,
            paneId: pane.paneId
          }
        }))
      })
      setShowSaveAs(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        sessions={sessions}
        onActivate={activateTab}
        onClose={closeTab}
      />
      {canSave && activeTab && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-2 py-1">
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            {boundHostName ? `Project: ${boundHostName}` : 'Local sessions'}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded border border-border px-2 py-0.5 text-xs text-fg hover:bg-surface-raised disabled:opacity-50"
          >
            {boundHostId ? 'Save' : 'Save as host…'}
          </button>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        {tabs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <p className="text-lg">No active sessions</p>
            <p className="text-sm">Select a host from the sidebar or open a local shell</p>
          </div>
        ) : (
          tabs.map((tab) => {
            const selected = tab.id === activeTabId
            const layout = tab.layout as MosaicNode<string> | null
            return (
              <div
                key={tab.id}
                className={selected ? 'absolute inset-0' : 'hidden'}
                hidden={!selected}
              >
                <SessionMosaic
                  active={selected}
                  layout={layout}
                  panes={tab.panes}
                  sessions={sessions}
                  onLayoutChange={handleLayoutChange(tab.id, tab.panes)}
                  onPanesChange={(panes) => persistTab(tab.id, layout, panes)}
                  onSessionUpdated={handleSessionUpdated}
                  onSessionRemoved={removeSession}
                  onSplitPane={(paneId, direction) => handleSplitPane(tab.id, paneId, direction)}
                  onConnectPane={(paneId) => handleConnectPane(tab.id, paneId)}
                  onClosePane={(paneId) => handleClosePane(tab.id, paneId)}
                />
              </div>
            )
          })
        )}
      </div>
      {showSaveAs && (
        <SaveLocalProjectDialog
          onCancel={() => setShowSaveAs(false)}
          onSave={(name, tags) => void handleSaveAs(name, tags)}
          saving={saving}
        />
      )}
    </div>
  )
}
