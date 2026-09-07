import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { CHILD_WINDOW_REVEAL_TIMEOUT_MS, revealWindow } from './revealWindow'

type FakeWindow = {
  destroyed: boolean
  visible: boolean
  minimized: boolean
  isDestroyed: () => boolean
  isVisible: () => boolean
  isMinimized: () => boolean
  restore: ReturnType<typeof vi.fn>
  show: ReturnType<typeof vi.fn>
  focus: ReturnType<typeof vi.fn>
  once: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  emit: (event: string) => void
}

function fakeWindow(options?: {
  visible?: boolean
  destroyed?: boolean
  minimized?: boolean
}): FakeWindow {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
  return {
    destroyed: options?.destroyed ?? false,
    visible: options?.visible ?? false,
    minimized: options?.minimized ?? false,
    isDestroyed: function isDestroyed() {
      return this.destroyed
    },
    isVisible: function isVisible() {
      return this.visible
    },
    isMinimized: function isMinimized() {
      return this.minimized
    },
    restore: vi.fn(function restore(this: { minimized: boolean }) {
      this.minimized = false
    }),
    show: vi.fn(function show(this: { visible: boolean }) {
      this.visible = true
    }),
    focus: vi.fn(),
    once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const list = handlers.get(event) ?? []
      list.push(handler)
      handlers.set(event, list)
    }),
    removeListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const list = handlers.get(event) ?? []
      handlers.set(
        event,
        list.filter((h) => h !== handler)
      )
    }),
    emit(event: string): void {
      for (const handler of [...(handlers.get(event) ?? [])]) {
        handler()
      }
    }
  }
}

describe('revealWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows immediately when already visible', () => {
    const win = fakeWindow({ visible: true })
    revealWindow(win as never)
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })

  it('shows on ready-to-show before timeout', () => {
    const win = fakeWindow()
    revealWindow(win as never)
    expect(win.show).not.toHaveBeenCalled()

    win.emit('ready-to-show')
    expect(win.show).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(CHILD_WINDOW_REVEAL_TIMEOUT_MS)
    expect(win.show).toHaveBeenCalledTimes(1)
  })

  it('force-shows after timeout when ready-to-show never fires', () => {
    const win = fakeWindow()
    revealWindow(win as never)

    vi.advanceTimersByTime(CHILD_WINDOW_REVEAL_TIMEOUT_MS - 1)
    expect(win.show).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(win.show).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledTimes(1)
  })

  it('no-ops when destroyed', () => {
    const win = fakeWindow({ destroyed: true })
    revealWindow(win as never)
    expect(win.show).not.toHaveBeenCalled()
    expect(win.once).not.toHaveBeenCalled()
  })
})
