import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { mergeKeybindings } from '@consoleri/core'
import type { PaneBinding, SessionInfo } from '@shared/types'
import { SessionMosaic } from './SessionMosaic'

vi.mock('../../components/session/SessionView', () => ({
  SessionView: ({ session }: { session?: SessionInfo }): React.JSX.Element => (
    <div data-testid="session-view">{session?.title ?? 'empty'}</div>
  )
}))

vi.mock('../../stores/preferencesStore', () => ({
  usePreferencesStore: (
    selector: (state: {
      settings: { keybindings: ReturnType<typeof mergeKeybindings> }
    }) => unknown
  ) =>
    selector({
      settings: {
        keybindings: mergeKeybindings()
      }
    })
}))

const paneId = 'pane-zsh'
const sessionId = 'session-zsh'

const panes: PaneBinding[] = [
  {
    paneId,
    sessionId,
    protocol: 'local_pty',
    title: 'zsh',
    connectRequest: { protocol: 'local_pty', title: 'zsh', localShell: 'zsh' }
  }
]

const sessions: SessionInfo[] = [
  {
    id: sessionId,
    hostId: null,
    profileId: null,
    protocol: 'local_pty',
    title: 'zsh',
    status: 'connected'
  }
]

const noop = vi.fn()

describe('SessionMosaic', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a single-pane session without infinite re-renders', () => {
    render(
      <SessionMosaic
        layout={paneId}
        panes={panes}
        sessions={sessions}
        onLayoutChange={noop}
        onPanesChange={noop}
        onSessionUpdated={noop}
        onSessionRemoved={noop}
        onSplitPane={noop}
        onConnectPane={noop}
        onClosePane={noop}
      />
    )

    expect(screen.getByTestId('session-view').textContent).toBe('zsh')
    expect(screen.getByTitle('Close pane')).toBeTruthy()
    expect(document.querySelector('[data-pane-id="pane-zsh"]')).toBeTruthy()
    expect(document.querySelector('.mosaic-window-toolbar')).toBeTruthy()
  })
})
