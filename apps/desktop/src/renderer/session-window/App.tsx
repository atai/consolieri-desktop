import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import type { MosaicNode } from 'react-mosaic-component'
import { nanoid } from 'nanoid'
import type { OpenSessionRequest, PaneBinding, SessionInfo } from '@shared/types'
import { SessionMosaic } from '../src/session/mosaic/SessionMosaic'
import {
  closeMosaicPane,
  openMosaicSession,
  reconnectMosaicPane,
  splitMosaicPane
} from '../src/session/mosaic/sessionMosaicOps'
import { applySessionStatusUpdate } from '../src/session/applySessionStatus'
import { resolveHostConnectRequest } from '../src/session/connectHost'
import { useUxProfileStore } from '../src/stores/uxProfileStore'
import { usePreferencesStore } from '../src/stores/preferencesStore'
import { releaseTerminal } from '../src/terminal/TerminalPool'
import {
  createLocalProjectHost,
  isLocalOnlyLayout,
  restoreHostPresetSessions,
  savePresetToHost
} from '../src/session/localProject'
import { SaveLocalProjectDialog } from '../src/components/hosts/SaveLocalProjectDialog'
import { WindowBusyOverlay } from '../src/components/ui/WindowBusyOverlay'
import { Button } from '../src/components/ui/Button'

function getQueryParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? ''
}

export function SessionWindowApp(): React.JSX.Element {
  const sessionId = getQueryParam('sessionId')
  const hostId = getQueryParam('hostId')
  const profileId = getQueryParam('profileId') || undefined
  const refreshUxProfiles = useUxProfileStore((s) => s.refresh)
  const refreshPreferences = usePreferencesStore((s) => s.refresh)
  const [layout, setLayout] = useState<MosaicNode<string> | null>(null)
  const [panes, setPanes] = useState<PaneBinding[]>([])
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [boundHostId, setBoundHostId] = useState<string | null>(hostId || null)
  const [boundHostName, setBoundHostName] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [initSteps, setInitSteps] = useState<string[]>(['Opening window…'])
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saving, setSaving] = useState(false)
  const getSessions = useEffectEvent(() => sessions)

  const pushStep = useCallback((step: string): void => {
    setInitSteps((prev) => [...prev, step])
  }, [])

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
    if (hostId) {
      const initHost = async (): Promise<void> => {
        try {
          pushStep('Loading host…')
          const host = await window.consoleri.hosts.get(hostId)
          if (!host) {
            setInitError('Host not found')
            return
          }
          setBoundHostId(host.id)
          setBoundHostName(host.name)
          pushStep(`Host: ${host.name}`)

          const preset = await window.consoleri.hostPresets.get(host.id)
          if (preset && preset.panes.length > 0) {
            pushStep(`Restoring ${preset.panes.length} pane(s)…`)
            const restored = await restoreHostPresetSessions(host, preset)
            setPanes(restored.panes)
            setLayout(restored.layout)
            setSessions(restored.sessions)
            pushStep('Ready')
            return
          }

          pushStep('Starting session…')
          const request = await resolveHostConnectRequest(host, profileId)
          const session = await openMosaicSession(request)
          if (!session) {
            setInitError('Failed to open session')
            return
          }
          const paneId = nanoid()
          const binding: PaneBinding = {
            paneId,
            sessionId: session.id,
            protocol: session.protocol,
            title: session.title,
            connectRequest: { ...request, paneId }
          }
          setPanes([binding])
          setLayout(paneId)
          setSessions([session])
          pushStep('Connecting…')
        } catch (error) {
          console.error('[session-window] Failed to initialize host window:', error)
          setInitError(error instanceof Error ? error.message : String(error))
        }
      }
      void initHost()
      return
    }

    if (!sessionId) return

    const init = async (): Promise<void> => {
      try {
        pushStep('Loading session…')
        const listed = await window.consoleri.sessions.list()
        const session = listed.find((s) => s.id === sessionId)
        if (!session) {
          setInitError('Session not found')
          return
        }

        const connectRequest =
          (await window.consoleri.sessions.getConnectRequest(sessionId)) ??
          ({
            hostId: session.hostId ?? undefined,
            profileId: session.profileId ?? undefined,
            protocol: session.protocol,
            title: session.title
          } satisfies OpenSessionRequest)

        if (connectRequest.hostId) {
          setBoundHostId(connectRequest.hostId)
          const host = await window.consoleri.hosts.get(connectRequest.hostId)
          if (host) setBoundHostName(host.name)
        }

        const paneId = nanoid()
        const binding: PaneBinding = {
          paneId,
          sessionId: session.id,
          protocol: session.protocol,
          title: session.title,
          connectRequest: { ...connectRequest, paneId }
        }

        setPanes([binding])
        setLayout(paneId)
        setSessions([session])
        pushStep('Ready')
      } catch (error) {
        console.error('[session-window] Failed to initialize session window:', error)
        setInitError(error instanceof Error ? error.message : String(error))
      }
    }

    void init()
  }, [sessionId, hostId, profileId, pushStep])

  useEffect(() => {
    if (!sessionId && !hostId) return

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
  }, [sessionId, hostId, upsertSession])

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
    const binding = panes.find((p) => p.paneId === paneId)
    if (binding?.connectRequest.hostId) {
      void window.consoleri.shellHistory.deletePane(binding.connectRequest.hostId, paneId)
    }
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

  const canSave = isLocalOnlyLayout(panes)

  const handleSave = async (): Promise<void> => {
    if (!canSave) return
    if (boundHostId) {
      setSaving(true)
      try {
        await savePresetToHost(boundHostId, layout, panes)
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
      const host = await createLocalProjectHost({ name, tags, layout, panes })
      setBoundHostId(host.id)
      setBoundHostName(host.name)
      setPanes((prev) =>
        prev.map((p) => ({
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

  if (!sessionId && !hostId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">No session</div>
    )
  }

  if (initError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">{initError}</div>
    )
  }

  if (!layout) {
    return <WindowBusyOverlay title="Preparing session…" steps={initSteps} />
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {canSave && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-2 py-1">
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            {boundHostName ? `Project: ${boundHostName}` : 'Unsaved local session'}
          </span>
          <Button disabled={saving} onClick={() => void handleSave()}>
            {boundHostId ? 'Save' : 'Save as host…'}
          </Button>
          {boundHostId && (
            <Button disabled={saving} onClick={() => setShowSaveAs(true)}>
              Save as…
            </Button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1">
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
              No session
            </div>
          }
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
