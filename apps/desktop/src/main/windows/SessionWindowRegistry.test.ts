import { afterEach, describe, expect, it } from 'vitest'
import type { BrowserWindow } from 'electron'
import {
  clearSessionWindowRegistry,
  getRegisteredSessionWindow,
  getSessionIdsForWindow,
  isRegisteredSessionWindow,
  registerSessionWindow,
  unregisterAllForWindow,
  unregisterSessionWindow
} from './SessionWindowRegistry'

function makeWindow(id: string): BrowserWindow {
  return { id, isDestroyed: () => false } as unknown as BrowserWindow
}

afterEach(() => {
  clearSessionWindowRegistry()
})

describe('SessionWindowRegistry', () => {
  it('maps multiple session ids to the same window', () => {
    const win = makeWindow('win-1')
    registerSessionWindow('sess-a', win)
    registerSessionWindow('sess-b', win)

    expect(getRegisteredSessionWindow('sess-a')).toBe(win)
    expect(getRegisteredSessionWindow('sess-b')).toBe(win)
    expect(getSessionIdsForWindow(win).sort()).toEqual(['sess-a', 'sess-b'])
    expect(isRegisteredSessionWindow(win)).toBe(true)
  })

  it('unregisters one session without removing siblings', () => {
    const win = makeWindow('win-1')
    registerSessionWindow('sess-a', win)
    registerSessionWindow('sess-b', win)

    unregisterSessionWindow('sess-a')

    expect(getRegisteredSessionWindow('sess-a')).toBeUndefined()
    expect(getRegisteredSessionWindow('sess-b')).toBe(win)
    expect(getSessionIdsForWindow(win)).toEqual(['sess-b'])
  })

  it('unregisters all sessions for a window', () => {
    const win = makeWindow('win-1')
    registerSessionWindow('sess-a', win)
    registerSessionWindow('sess-b', win)

    const removed = unregisterAllForWindow(win)

    expect(removed.sort()).toEqual(['sess-a', 'sess-b'])
    expect(getSessionIdsForWindow(win)).toEqual([])
    expect(isRegisteredSessionWindow(win)).toBe(false)
  })
})
