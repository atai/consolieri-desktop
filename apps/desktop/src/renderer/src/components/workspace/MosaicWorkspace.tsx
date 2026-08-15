import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MosaicNode } from 'react-mosaic-component'
import type { SessionInfo } from '@shared/types'
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

export function MosaicWorkspace(): React.JSX.Element {
  const { workspace, sessions, persistWorkspace, addSession, updateSession, removeSession } =
    useSessionWorkspaceStore()
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [boundHostNameState, setBoundHostNameState] = useState<{
    id: string
    name: string | null
  } | null>(null)

  const layout = workspace.layout as MosaicNode<string> | null
  const canSave = isLocalOnlyLayout(workspace.panes)

  const boundHostId = useMemo(() => {
    const hostIds = new Set(
      workspace.panes.map((p) => p.connectRequest.hostId).filter((id): id is string => Boolean(id))
    )
    return hostIds.size === 1 ? [...hostIds][0]! : null
  }, [workspace.panes])

  const boundHostName =
    boundHostId && boundHostNameState?.id === boundHostId ? boundHostNameState.name : null

  useEffect(() => {
    if (!boundHostId) return
    let cancelled = false
    void window.consoleri.hosts.get(boundHostId).then((h) => {
      if (!cancelled) setBoundHostNameState({ id: boundHostId, name: h?.name ?? null })
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
  }, [workspace, sessions])

  const handleLayoutChange = useCallback(
    (next: MosaicNode<string> | null, options?: { debounce?: boolean }) => {
      persistWorkspace(next, workspace.panes, options)
    },
    [persistWorkspace, workspace.panes]
  )

  const handleSplitPane = async (paneId: string, direction: 'row' | 'column'): Promise<void> => {
    const result = await splitMosaicPane(layout, workspace.panes, paneId, direction)
    if (!result) return
    result.sessions.forEach((session) => addSession(session))
    persistWorkspace(result.layout, result.panes)
  }

  const handleConnectPane = async (paneId: string): Promise<void> => {
    const result = await reconnectMosaicPane(workspace.panes, paneId)
    if (!result) return
    updateSession(result.session.id, result.session)
    persistWorkspace(layout, result.panes)
  }

  const handleClosePane = (paneId: string): void => {
    const {
      layout: nextLayout,
      panes: nextPanes,
      closedSessionId
    } = closeMosaicPane(layout, workspace.panes, paneId)
    if (closedSessionId) {
      removeSession(closedSessionId)
    }
    persistWorkspace(nextLayout, nextPanes)
  }

  const handleSessionUpdated = (session: SessionInfo): void => {
    updateSession(session.id, session)
  }

  const handleSave = async (): Promise<void> => {
    if (!canSave) return
    if (boundHostId) {
      setSaving(true)
      try {
        await savePresetToHost(boundHostId, layout, workspace.panes)
      } finally {
        setSaving(false)
      }
      return
    }
    setShowSaveAs(true)
  }

  const handleSaveAs = async (name: string, tags: string[]): Promise<void> => {
    setSaving(true)
    try {
      const host = await createLocalProjectHost({
        name,
        tags,
        layout,
        panes: workspace.panes
      })
      setBoundHostNameState({ id: host.id, name: host.name })
      persistWorkspace(
        layout,
        workspace.panes.map((p) => ({
          ...p,
          connectRequest: {
            ...p.connectRequest,
            hostId: host.id,
            profileId: host.defaultProfileId ?? p.connectRequest.profileId,
            paneId: p.paneId
          }
        }))
      )
      setShowSaveAs(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {canSave && (
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
      <div className="min-h-0 flex-1">
        <SessionMosaic
          layout={layout}
          panes={workspace.panes}
          sessions={sessions}
          onLayoutChange={handleLayoutChange}
          onPanesChange={(panes) => persistWorkspace(layout, panes)}
          onSessionUpdated={handleSessionUpdated}
          onSessionRemoved={removeSession}
          onSplitPane={handleSplitPane}
          onConnectPane={handleConnectPane}
          onClosePane={handleClosePane}
        />
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
