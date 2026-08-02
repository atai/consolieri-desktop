import { isTerminalProtocol } from '@consoleri/core'
import type { PaneBinding, SessionInfo } from '@shared/types'
import { TerminalPane } from '../terminal/TerminalPane'
import { RdpPane } from '../rdp/RdpPane'
import { VncPane } from '../vnc/VncPane'
import { useAutoReconnect } from '../../hooks/useAutoReconnect'
import type { AutoReconnectHook } from '../../hooks/useAutoReconnect'

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
      <button
        type="button"
        onClick={onConnect}
        className="rounded bg-accent px-4 py-1.5 text-xs text-accent-on hover:bg-accent-hover"
      >
        Connect
      </button>
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
        <button
          type="button"
          onClick={() => window.consoleri.sessions.openLogWindow(session.id)}
          className="rounded border border-border px-3 py-1 text-xs text-fg-2 hover:bg-surface-raised"
        >
          View log
        </button>
        <button
          type="button"
          onClick={onConnect}
          className="rounded bg-accent px-3 py-1 text-xs text-accent-on hover:bg-accent-hover"
        >
          Connect
        </button>
      </div>

      {/* Auto-reconnect panel */}
      <div className="mt-1 w-full max-w-xs rounded border border-border text-xs">
        {/* Collapsible header */}
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
            {/* Enable + interval + max attempts */}
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

            {/* Sound on success */}
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

        {/* Countdown status bar — visible when auto-reconnect is active */}
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
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
        <span className="animate-pulse">
          {ar.autoEnabled ? `Auto-reconnect attempt ${ar.attemptsDone}…` : 'Connecting…'}
        </span>
        <button
          type="button"
          onClick={() => window.consoleri.sessions.openLogWindow(session.id)}
          className="rounded border border-border px-3 py-1 text-xs text-fg-2 hover:bg-surface-raised"
        >
          View log
        </button>
      </div>
    )
  }

  if (session.status === 'error') {
    return <ErrorPane session={session} ar={ar} onConnect={onConnect} />
  }

  if (session.status === 'disconnected') {
    return <DisconnectedPane label={disconnectedLabel} onConnect={onConnect} />
  }

  if (session.protocol === 'rdp') {
    return <RdpPane session={session} profileId={session.profileId} />
  }
  if (session.protocol === 'vnc') {
    return <VncPane session={session} />
  }
  if (isTerminalProtocol(session.protocol)) {
    return (
      <TerminalPane
        sessionId={session.id}
        hostId={session.hostId}
        disconnected={false}
        onReconnect={() => onReconnect(session.id)}
      />
    )
  }

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Unknown protocol: {session.protocol}
    </div>
  )
}
