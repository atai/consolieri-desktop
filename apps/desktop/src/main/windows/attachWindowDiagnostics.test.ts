import { describe, expect, it, vi } from 'vitest'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'

describe('attachWindowDiagnostics', () => {
  it('logs and closes on main-frame load failure', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>()
    const win = {
      isDestroyed: () => false,
      close: vi.fn(),
      on: vi.fn(),
      webContents: {
        on: (event: string, handler: (...args: unknown[]) => void) => {
          handlers.set(event, handler)
        }
      }
    }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onFailLoad = vi.fn()

    attachWindowDiagnostics(win as never, { name: 'session-window', onFailLoad })

    handlers.get('did-fail-load')?.(
      {},
      -6,
      'ERR_FILE_NOT_FOUND',
      'file:///missing.html',
      true
    )

    expect(errorSpy).toHaveBeenCalled()
    expect(onFailLoad).toHaveBeenCalledWith({
      errorCode: -6,
      errorDescription: 'ERR_FILE_NOT_FOUND',
      validatedURL: 'file:///missing.html'
    })
    expect(win.close).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('ignores aborted navigations', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>()
    const win = {
      isDestroyed: () => false,
      close: vi.fn(),
      on: vi.fn(),
      webContents: {
        on: (event: string, handler: (...args: unknown[]) => void) => {
          handlers.set(event, handler)
        }
      }
    }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    attachWindowDiagnostics(win as never, { name: 'session-window' })
    handlers.get('did-fail-load')?.({}, -3, 'ABORTED', 'http://x', true)

    expect(win.close).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
