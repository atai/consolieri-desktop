import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from 'react'
import {
  Mosaic,
  MosaicWindow,
  getLeaves,
  type MosaicNode,
  type MosaicPath
} from 'react-mosaic-component'
import { formatAccelerator, matchAccelerator, mergeKeybindings } from '@consoleri/core'
import type { PaneBinding, SessionInfo } from '@shared/types'
import { SessionView } from '../../components/session/SessionView'
import {
  closeToolbarButton,
  connectToolbarButton,
  logToolbarButton,
  maximizeToolbarButton,
  splitToolbarMenu
} from '../../components/workspace/mosaicToolbarButtons'
import { usePreferencesStore } from '../../stores/preferencesStore'

function paneTitle(
  session: SessionInfo | undefined,
  binding: PaneBinding | undefined,
  paneId: string
): string {
  const base = binding?.title ?? session?.title ?? paneId
  if (!session) return base
  if (session.status === 'connecting') return `${base} — Connecting…`
  if (session.status === 'error') return `${base} — Error`
  return base
}

function needsConnect(session: SessionInfo | undefined, binding: PaneBinding | undefined): boolean {
  if (!binding?.connectRequest) return false
  if (!binding.sessionId || !session) return true
  return session.status === 'error' || session.status === 'disconnected'
}

export interface SessionMosaicProps {
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
  sessions: SessionInfo[]
  onLayoutChange: (layout: MosaicNode<string> | null, options?: { debounce?: boolean }) => void
  onPanesChange: (panes: PaneBinding[]) => void
  onSessionUpdated: (session: SessionInfo) => void
  onSessionRemoved: (sessionId: string) => void
  onSplitPane: (paneId: string, direction: 'row' | 'column') => void | Promise<void>
  onConnectPane: (paneId: string) => void | Promise<void>
  onClosePane: (paneId: string) => void
  zeroStateView?: ReactElement
  emptyLayoutView?: ReactNode
}

export function SessionMosaic({
  layout,
  panes,
  sessions,
  onLayoutChange,
  onSessionUpdated,
  onSplitPane,
  onConnectPane,
  onClosePane,
  zeroStateView,
  emptyLayoutView
}: SessionMosaicProps): React.JSX.Element {
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null)
  const focusedPaneIdRef = useRef<string | null>(null)
  const mosaicRef = useRef<HTMLDivElement>(null)
  const leafCount = getLeaves(layout).length
  const canMaximize = leafCount > 1
  const keybindings = usePreferencesStore((s) => mergeKeybindings(s.settings.keybindings))
  const maximizeAccel = keybindings.toggleMaximizePane
  const maximizeHint = formatAccelerator(maximizeAccel)

  const getSession = useCallback(
    (paneId: string) => {
      const binding = panes.find((p) => p.paneId === paneId)
      if (!binding?.sessionId) return undefined
      return sessions.find((s) => s.id === binding.sessionId)
    },
    [panes, sessions]
  )

  const toggleMaximize = useCallback(
    (paneId: string) => {
      if (!canMaximize && maximizedPaneId === null) return
      setMaximizedPaneId((current) => (current === paneId ? null : paneId))
    },
    [canMaximize, maximizedPaneId]
  )

  // Drop maximize when layout shrinks to a single pane or the pane disappears.
  useEffect(() => {
    if (!maximizedPaneId) return
    if (leafCount <= 1 || !panes.some((p) => p.paneId === maximizedPaneId)) {
      setMaximizedPaneId(null)
    }
  }, [leafCount, maximizedPaneId, panes])

  // Track focused pane for hotkey targeting.
  useEffect(() => {
    const root = mosaicRef.current
    if (!root) return

    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null
      const pane = target?.closest?.('[data-pane-id]') as HTMLElement | null
      const paneId = pane?.dataset.paneId
      if (paneId) focusedPaneIdRef.current = paneId
    }

    root.addEventListener('focusin', onFocusIn)
    return () => root.removeEventListener('focusin', onFocusIn)
  }, [layout])

  // Double-click title bar to maximize/restore (ignore toolbar controls).
  useEffect(() => {
    const root = mosaicRef.current
    if (!root) return

    const onDblClick = (event: MouseEvent): void => {
      const target = event.target as Element | null
      if (!target?.closest?.('.mosaic-window-toolbar')) return
      if (target.closest('.mosaic-window-controls')) return
      const pane = target.closest('[data-pane-id]') as HTMLElement | null
      const paneId = pane?.dataset.paneId
      if (!paneId) return
      if (!canMaximize && maximizedPaneId !== paneId) return
      toggleMaximize(paneId)
    }

    root.addEventListener('dblclick', onDblClick)
    return () => root.removeEventListener('dblclick', onDblClick)
  }, [canMaximize, maximizedPaneId, toggleMaximize])

  // Capture-phase hotkey so it works while xterm has focus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!matchAccelerator(event, maximizeAccel)) return

      if (maximizedPaneId) {
        event.preventDefault()
        event.stopPropagation()
        setMaximizedPaneId(null)
        return
      }

      if (!canMaximize) return
      const targetId = focusedPaneIdRef.current
      if (!targetId || !panes.some((p) => p.paneId === targetId)) return

      event.preventDefault()
      event.stopPropagation()
      setMaximizedPaneId(targetId)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [canMaximize, maximizeAccel, maximizedPaneId, panes])

  const handleReconnect = async (sessionId: string): Promise<void> => {
    const updated = await window.consoleri.sessions.reconnect(sessionId)
    if (updated) onSessionUpdated(updated)
  }

  const openLog = (sessionId: string): void => {
    void window.consoleri.sessions.openLogWindow(sessionId)
  }

  const handleSplitPane = (paneId: string, direction: 'row' | 'column'): void => {
    setMaximizedPaneId(null)
    void onSplitPane(paneId, direction)
  }

  const handleClosePane = (paneId: string): void => {
    if (maximizedPaneId === paneId) setMaximizedPaneId(null)
    onClosePane(paneId)
  }

  const renderTile = (paneId: string, path: MosaicPath): React.JSX.Element => {
    const binding = panes.find((p) => p.paneId === paneId)
    const session = getSession(paneId)
    const title = paneTitle(session, binding, paneId)
    const showLog = session?.status === 'connecting' || session?.status === 'error'
    const splitDisabled = session?.status === 'connecting'
    const showConnect = needsConnect(session, binding)
    const isMaximized = maximizedPaneId === paneId

    const toolbarControls = [
      ...(!splitDisabled
        ? [
            splitToolbarMenu(
              () => handleSplitPane(paneId, 'row'),
              () => handleSplitPane(paneId, 'column')
            )
          ]
        : []),
      ...(canMaximize
        ? [maximizeToolbarButton(isMaximized, () => toggleMaximize(paneId), maximizeHint)]
        : []),
      ...(showConnect ? [connectToolbarButton(() => void onConnectPane(paneId))] : []),
      ...(showLog && binding?.sessionId
        ? [logToolbarButton(() => openLog(binding.sessionId!))]
        : []),
      closeToolbarButton(() => handleClosePane(paneId))
    ]

    return (
      <div
        className={`consoleri-pane h-full${isMaximized ? ' is-maximized' : ''}`}
        data-pane-id={paneId}
      >
        <MosaicWindow<string>
          path={path}
          title={title}
          toolbarControls={toolbarControls}
          draggable={!maximizedPaneId}
        >
          {binding ? (
            <SessionView
              session={session}
              binding={binding}
              onReconnect={handleReconnect}
              onConnect={() => void onConnectPane(paneId)}
            />
          ) : (
            <div className="p-4 text-sm text-muted">Empty pane</div>
          )}
        </MosaicWindow>
      </div>
    )
  }

  if (!layout) {
    return (
      <>
        {emptyLayoutView ?? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <p className="text-lg">No active sessions</p>
            <p className="text-sm">Select a host from the sidebar or open a local shell</p>
          </div>
        )}
      </>
    )
  }

  const mosaicClass = [
    'consoleri-mosaic mosaic-blueprint-theme bp5-dark h-full',
    maximizedPaneId ? 'consoleri-mosaic--maximized' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={mosaicRef} className="h-full min-h-0">
      <Mosaic<string>
        className={mosaicClass}
        value={layout}
        onChange={(next) => onLayoutChange(next, { debounce: true })}
        renderTile={renderTile}
        zeroStateView={
          zeroStateView ?? (
            <div className="flex h-full items-center justify-center text-muted">
              Connect to a host to begin
            </div>
          )
        }
      />
    </div>
  )
}
