import { lazy, Suspense, useEffect, useState } from 'react'
import { isTerminalProtocol } from '@consoleri/core'
import type { LogEntry, PaneBinding, SessionInfo } from '@shared/types'
import { useAutoReconnect } from '../../hooks/useAutoReconnect'
import type { AutoReconnectHook } from '../../hooks/useAutoReconnect'
import { WindowBusyOverlay } from '../ui/WindowBusyOverlay'
import { Button } from '../ui/Button'

const TerminalPane = lazy(() =>
  import('../terminal/TerminalPane').then((m) => ({ default: m.TerminalPane }))
)
const RdpPane = lazy(() => import('../rdp/RdpPane').then((m) => ({ default: m.RdpPane })))
const VncPane = lazy(() => import('../vnc/VncPane').then((m) => ({ default: m.VncPane })))

export interface SessionViewProps {
  session: SessionInfo | undefined
  binding?: PaneBinding
  title?: string
  onReconnect: (sessionId: string) => void
  onConnect: () => void
}

// ── sub-components ─────────────────────────────────────────────────────────────

function DisconnectedPane({
  label,
  onConnect
}: {
  label: string
  onConnect: () => void
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-sm text-muted">
      <p className="text-fg-2">{label}</p>
      <Button variant="primary" onClick={onConnect}>
        Connect
      </Button>
    </div>
  )
}

function ErrorPane({
  session,
  ar,
  onConnect
}: {
  session: SessionInfo
  ar: AutoReconnectHook
  onConnect: () => void
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-sm text-danger">
      <p className="text-center">{session.error ?? 'Connection failed'}</p>

      <div className="flex gap-2">
        <Button onClick={() => window.consoleri.sessions.openLogWindow(session.id)}>
          View log
        </Button>
        <Button variant="primary" onClick={onConnect}>
          Connect
        </Button>
      </div>

      <div className="mt-1 w-full max-w-xs rounded border border-border text-xs">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-1.5 text-muted hover:bg-surface-raised"
          onClick={() => ar.setPanelOpen(!ar.panelOpen)}
        >
          <span>Auto-reconnect</span>
          <span className="text-muted">{ar.panelOpen ? '▲' : '▼'}</span>
        </button>

        {ar.panelOpen && (
          <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-2">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={ar.autoEnabled}
                  onChange={(e) => (e.target.checked ? ar.enable() : ar.disable())}
                  className="accent-blue-500"
                />
                Enable
              </label>
              <span className="text-muted">every</span>
              <input
                type="number"
                min={1}
                max={3600}
                value={ar.intervalSec}
                onChange={(e) => ar.setIntervalSec(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 rounded border border-border bg-bg px-1.5 py-0.5 text-center"
              />
              <span className="text-muted">s, stop after</span>
              <input
                type="number"
                min={0}
                value={ar.maxAttempts}
                onChange={(e) => ar.setMaxAttempts(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-14 rounded border border-border bg-bg px-1.5 py-0.5 text-center"
              />
              <span className="text-muted">tries (0=∞)</span>
            </div>

            <label className="flex cursor-pointer items-center gap-1.5 text-fg-2">
              <input
                type="checkbox"
                checked={ar.soundEnabled}
                onChange={(e) => ar.setSoundEnabled(e.target.checked)}
                className="accent-blue-500"
              />
              Sound on success
            </label>
          </div>
        )}

        {ar.autoEnabled && (
          <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-muted">
            <span>
              Reconnecting in {ar.countdown} s
              {ar.attemptsDone > 0 && (
                <span className="ml-1.5 text-muted">
                  · attempt {ar.attemptsDone}
                  {ar.maxAttempts > 0 ? `/${ar.maxAttempts}` : ''}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={ar.disable}
              className="ml-2 text-danger hover:text-danger"
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConnectingPane({
  session,
  autoEnabled,
  attemptsDone
}: {
  session: SessionInfo
  autoEnabled: boolean
  attemptsDone: number
}): React.JSX.Element {
  const [steps, setSteps] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void window.consoleri.sessions.getLog(session.id).then((entries: LogEntry[]) => {
      if (cancelled) return
      setSteps(entries.map((e) => e.message))
    })
    const unsub = window.consoleri.sessions.onLog((entry: LogEntry) => {
      if (entry.sessionId !== session.id) return
      setSteps((prev) => [...prev, entry.message])
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [session.id])

  const title = autoEnabled
    ? `Auto-reconnect attempt ${attemptsDone}…`
    : 'Connecting…'

  return (
    <WindowBusyOverlay
      title={title}
      steps={steps}
      action={
        <Button onClick={() => window.consoleri.sessions.openLogWindow(session.id)}>
          View log
        </Button>
      }
    />
  )
}

function ProtocolPaneFallback(): React.JSX.Element {
  return <WindowBusyOverlay title="Loading protocol UI…" />
}

// ── main component ─────────────────────────────────────────────────────────────

export function SessionView({
  session,
  binding,
  title,
  onReconnect,
  onConnect
}: SessionViewProps): React.JSX.Element {
  // Hook must live at this level so state survives error → connecting → error cycles
  const ar = useAutoReconnect(session, onConnect)
  const disconnectedLabel = binding?.title ?? title ?? 'Not connected'

  if (!session) {
    return <DisconnectedPane label={disconnectedLabel} onConnect={onConnect} />
  }

  if (session.status === 'connecting') {
    return (
      <ConnectingPane
        session={session}
        autoEnabled={ar.autoEnabled}
        attemptsDone={ar.attemptsDone}
      />
    )
  }

  if (session.status === 'error') {
    return <ErrorPane session={session} ar={ar} onConnect={onConnect} />
  }

  if (session.status === 'disconnected') {
    return <DisconnectedPane label={disconnectedLabel} onConnect={onConnect} />
  }

  if (session.protocol === 'rdp') {
    return (
      <Suspense fallback={<ProtocolPaneFallback />}>
        <RdpPane session={session} profileId={session.profileId} />
      </Suspense>
    )
  }
  if (session.protocol === 'vnc') {
    return (
      <Suspense fallback={<ProtocolPaneFallback />}>
        <VncPane session={session} />
      </Suspense>
    )
  }
  if (isTerminalProtocol(session.protocol)) {
    return (
      <Suspense fallback={<ProtocolPaneFallback />}>
        <TerminalPane
          sessionId={session.id}
          hostId={session.hostId}
          disconnected={false}
          onReconnect={() => onReconnect(session.id)}
        />
      </Suspense>
    )
  }

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Unknown protocol: {session.protocol}
    </div>
  )
}
