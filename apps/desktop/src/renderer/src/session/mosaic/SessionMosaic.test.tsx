import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
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
    selector: (state: { settings: { keybindings: ReturnType<typeof mergeKeybindings> } }) => unknown
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

  it('ignores the maximize hotkey while the mosaic is inactive', () => {
    render(splitMosaic({ active: false }))
    focusPane()
    act(() => pressMaximize())
    expect(document.querySelector('.is-maximized')).toBeNull()
  })

  it('maximizes the focused pane when the mosaic is active', () => {
    render(splitMosaic({ active: true }))
    focusPane()
    act(() => pressMaximize())
    expect(document.querySelector('[data-pane-id="pane-zsh"].is-maximized')).toBeTruthy()
  })
})

function splitMosaic({ active }: { active: boolean }): React.JSX.Element {
  const secondPane: PaneBinding = {
    ...panes[0],
    paneId: 'pane-bash',
    sessionId: 'session-bash',
    title: 'bash'
  }
  const secondSession: SessionInfo = { ...sessions[0], id: 'session-bash', title: 'bash' }
  return (
    <SessionMosaic
      active={active}
      layout={{ type: 'split', direction: 'row', children: [paneId, 'pane-bash'] }}
      panes={[...panes, secondPane]}
      sessions={[...sessions, secondSession]}
      onLayoutChange={noop}
      onPanesChange={noop}
      onSessionUpdated={noop}
      onSessionRemoved={noop}
      onSplitPane={noop}
      onConnectPane={noop}
      onClosePane={noop}
    />
  )
}

function focusPane(): void {
  document
    .querySelector('[data-pane-id="pane-zsh"]')
    ?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
}

function pressMaximize(): void {
  const darwin = process.platform === 'darwin'
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'm',
      metaKey: darwin,
      ctrlKey: !darwin,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    })
  )
}
