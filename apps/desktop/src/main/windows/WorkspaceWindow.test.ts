import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../compositionRoot', () => ({
  sessionManager: {
    open: vi.fn((request: { title?: string; protocol?: string }) => ({
      id: `sess-${request.title ?? 'x'}`,
      protocol: request.protocol ?? 'local_pty',
      title: request.title ?? 'Terminal',
      status: 'connecting',
      hostId: null,
      profileId: null
    })),
    closeSessionsForWindow: vi.fn()
  }
}))

vi.mock('./SessionWindowRegistry', () => ({
  registerSessionWindow: vi.fn(),
  unregisterAllForWindow: vi.fn()
}))

vi.mock('../appBranding', () => ({
  APP_NAME: 'Consoleri',
  appIconPath: () => undefined
}))

vi.mock('../windowTitles', () => ({
  joinWindowTitle: (a: string, b: string) => `${a} — ${b}`,
  pinBrowserWindowTitle: vi.fn()
}))

vi.mock('./attachWindowDiagnostics', () => ({
  attachWindowDiagnostics: vi.fn()
}))

vi.mock('./loadRendererEntry', () => ({
  loadRendererEntry: vi.fn()
}))

const destroyFns: Array<() => void> = []

vi.mock('electron', () => {
  class FakeBrowserWindow {
    destroyed = false
    listeners: Record<string, Array<() => void>> = {}
    constructor() {
      destroyFns.push(() => {
        this.destroyed = true
      })
    }
    isDestroyed(): boolean {
      return this.destroyed
    }
    isMinimized(): boolean {
      return false
    }
    restore(): void {
      /* noop */
    }
    show(): void {
      /* noop */
    }
    focus(): void {
      /* noop */
    }
    setTitle(): void {
      /* noop */
    }
    close(): void {
      this.destroyed = true
      for (const fn of this.listeners.closed ?? []) fn()
    }
    destroy(): void {
      this.destroyed = true
    }
    removeAllListeners(): void {
      /* noop */
    }
    on(event: string, fn: () => void): void {
      this.listeners[event] = this.listeners[event] ?? []
      this.listeners[event].push(fn)
    }
    once(event: string, fn: () => void): void {
      this.on(event, fn)
    }
    loadURL(): void {
      /* noop */
    }
    loadFile(): void {
      /* noop */
    }
  }
  return { BrowserWindow: FakeBrowserWindow }
})

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false }
}))

describe('WorkspaceWindow key reuse', () => {
  beforeEach(async () => {
    const mod = await import('./WorkspaceWindow')
    mod._clearWorkspaceWindowsForTests()
  })

  afterEach(async () => {
    const mod = await import('./WorkspaceWindow')
    mod._clearWorkspaceWindowsForTests()
  })

  it('reuses an existing window for the same key', async () => {
    const {
      openWorkspaceWindowFromRecipe,
      listWorkspaceWindows,
      findWorkspaceWindowByKey
    } = await import('./WorkspaceWindow')

    const first = openWorkspaceWindowFromRecipe({
      key: 'dev-manager:app',
      title: 'App',
      panes: [
        { title: 'API', cwd: '/tmp/api' },
        { title: 'Web', cwd: '/tmp/web' }
      ]
    })
    expect(first.paneCount).toBe(2)
    expect(listWorkspaceWindows()).toHaveLength(1)

    const second = openWorkspaceWindowFromRecipe({
      key: 'dev-manager:app',
      title: 'App again',
      panes: [{ title: 'Other', cwd: '/tmp/other' }]
    })
    expect(second.id).toBe(first.id)
    expect(listWorkspaceWindows()).toHaveLength(1)
    expect(findWorkspaceWindowByKey('dev-manager:app')?.id).toBe(first.id)
  })

  it('opens a new window when key differs', async () => {
    const { openWorkspaceWindowFromRecipe, listWorkspaceWindows } = await import(
      './WorkspaceWindow'
    )

    openWorkspaceWindowFromRecipe({
      key: 'a',
      title: 'A',
      panes: [{ title: '1', cwd: '/tmp/a' }]
    })
    openWorkspaceWindowFromRecipe({
      key: 'b',
      title: 'B',
      panes: [{ title: '2', cwd: '/tmp/b' }]
    })
    expect(listWorkspaceWindows()).toHaveLength(2)
  })
})
