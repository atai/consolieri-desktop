import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import type { MosaicNode } from 'react-mosaic-component'
import type { PaneBinding, SessionInfo } from '@shared/types'
import { SessionMosaic } from '../src/session/mosaic/SessionMosaic'
import {
  closeMosaicPane,
  reconnectMosaicPane,
  splitMosaicPane
} from '../src/session/mosaic/sessionMosaicOps'
import { applySessionStatusUpdate } from '../src/session/applySessionStatus'
import { useUxProfileStore } from '../src/stores/uxProfileStore'
import { usePreferencesStore } from '../src/stores/preferencesStore'
import { releaseTerminal } from '../src/terminal/TerminalPool'

function getWindowIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get('windowId') ?? ''
}

export function WorkspaceWindowApp(): React.JSX.Element {
  const windowId = getWindowIdFromUrl()
  const refreshUxProfiles = useUxProfileStore((s) => s.refresh)
  const refreshPreferences = usePreferencesStore((s) => s.refresh)
  const [layout, setLayout] = useState<MosaicNode<string> | null>(null)
  const [panes, setPanes] = useState<PaneBinding[]>([])
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [initError, setInitError] = useState<string | null>(null)
  const getSessions = useEffectEvent(() => sessions)

  const upsertSession = useCallback((session: SessionInfo): void => {
    setSessions((prev) => {
      const index = prev.findIndex((s) => s.id === session.id)
      if (index === -1) return [...prev, session]
      return prev.map((s) => (s.id === session.id ? session : s))
    })
  }, [])

  useEffect(() => {
    void refreshUxProfiles()
    void refreshPreferences()
  }, [refreshUxProfiles, refreshPreferences])

  useEffect(() => {
    if (!windowId) return

    const init = async (): Promise<void> => {
      try {
        const snapshot = await window.consoleri.control.getWorkspaceWindow(windowId)
        if (!snapshot) {
          setInitError('Window not found')
          return
        }
        setLayout(snapshot.layout as MosaicNode<string> | null)
        setPanes(snapshot.panes)
        setSessions(snapshot.sessions)
        if (snapshot.title) {
          document.title = snapshot.title
        }
      } catch (error) {
        console.error('[workspace-window] Failed to initialize:', error)
        setInitError(error instanceof Error ? error.message : String(error))
      }
    }

    void init()
  }, [windowId])

  useEffect(() => {
    if (!windowId) return

    const unsubStatus = window.consoleri.sessions.onStatus(({ id, status, error }) => {
      void applySessionStatusUpdate(
        id,
        status as SessionInfo['status'],
        error,
        () => getSessions(),
        upsertSession
      )
    })

    const unsubExit = window.consoleri.sessions.onExit(({ id }) => {
      releaseTerminal(id)
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'disconnected' } : s)))
    })

    return () => {
      unsubStatus()
      unsubExit()
    }
  }, [windowId, upsertSession])

  const handleSplitPane = async (paneId: string, direction: 'row' | 'column'): Promise<void> => {
    const result = await splitMosaicPane(layout, panes, paneId, direction)
    if (!result) return
    setLayout(result.layout)
    setPanes(result.panes)
    setSessions((prev) => [...prev, ...result.sessions])
  }

  const handleConnectPane = async (paneId: string): Promise<void> => {
    const result = await reconnectMosaicPane(panes, paneId)
    if (!result) return
    setPanes(result.panes)
    upsertSession(result.session)
  }

  const handleClosePane = (paneId: string): void => {
    const { layout: nextLayout, panes: nextPanes } = closeMosaicPane(layout, panes, paneId)
    setLayout(nextLayout)
    setPanes(nextPanes)
    setSessions((prev) => {
      const closedIds = new Set(
        panes.filter((p) => p.paneId === paneId && p.sessionId).map((p) => p.sessionId!)
      )
      return prev.filter((s) => !closedIds.has(s.id))
    })

    if (nextPanes.length === 0) {
      window.close()
    }
  }

  if (!windowId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">No window</div>
    )
  }

  if (initError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">{initError}</div>
    )
  }

  if (!layout) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SessionMosaic
        layout={layout}
        panes={panes}
        sessions={sessions}
        onLayoutChange={(next) => setLayout(next)}
        onPanesChange={setPanes}
        onSessionUpdated={upsertSession}
        onSessionRemoved={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
        onSplitPane={handleSplitPane}
        onConnectPane={handleConnectPane}
        onClosePane={handleClosePane}
        emptyLayoutView={
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No sessions
          </div>
        }
      />
    </div>
  )
}
