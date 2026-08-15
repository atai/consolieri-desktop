import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadURL = vi.fn()
const loadFile = vi.fn()
const fakeWin = { loadURL, loadFile }

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: true }
}))

describe('loadRendererEntry', () => {
  const env = process.env as Record<string, string | undefined>

  beforeEach(() => {
    loadURL.mockReset()
    loadFile.mockReset()
    env['ELECTRON_RENDERER_URL'] = 'http://localhost:5173'
  })

  afterEach(() => {
    vi.resetModules()
    delete env['ELECTRON_RENDERER_URL']
  })

  it('loads session-window with query in dev', async () => {
    const { loadRendererEntry } = await import('./loadRendererEntry')
    loadRendererEntry(fakeWin as never, 'session-window', { sessionId: 'abc' })
    expect(loadURL).toHaveBeenCalledWith(
      'http://localhost:5173/session-window/index.html?sessionId=abc'
    )
  })

  it('loads main index URL without extra path in dev', async () => {
    const { loadRendererEntry } = await import('./loadRendererEntry')
    loadRendererEntry(fakeWin as never, 'index')
    expect(loadURL).toHaveBeenCalledWith('http://localhost:5173')
  })
})
