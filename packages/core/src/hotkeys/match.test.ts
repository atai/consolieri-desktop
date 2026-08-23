import { describe, expect, it } from 'vitest'
import { mergeKeybindings, DEFAULT_KEYBINDINGS } from './defaults'
import {
  acceleratorFromKeyboardEvent,
  conflictsWithClipboard,
  matchAccelerator
} from './match'

describe('mergeKeybindings', () => {
  it('returns defaults when partial is missing', () => {
    expect(mergeKeybindings()).toEqual(DEFAULT_KEYBINDINGS)
    expect(mergeKeybindings(null)).toEqual(DEFAULT_KEYBINDINGS)
    expect(mergeKeybindings({})).toEqual(DEFAULT_KEYBINDINGS)
  })

  it('overrides a single binding and keeps others', () => {
    const merged = mergeKeybindings({
      toggleMaximizePane: { ctrl: true, key: 'f11' }
    })
    expect(merged.toggleMaximizePane).toEqual({ ctrl: true, key: 'f11' })
  })
})

describe('matchAccelerator', () => {
  const base = { key: 'm', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }

  it('matches mod+shift+m as Ctrl on win32', () => {
    expect(
      matchAccelerator(
        { ...base, key: 'm', ctrlKey: true, shiftKey: true },
        { mod: true, shift: true, key: 'm' },
        'win32'
      )
    ).toBe(true)
  })

  it('matches mod+shift+m as Meta on darwin', () => {
    expect(
      matchAccelerator(
        { ...base, key: 'M', metaKey: true, shiftKey: true },
        { mod: true, shift: true, key: 'm' },
        'darwin'
      )
    ).toBe(true)
  })

  it('rejects wrong modifier platform', () => {
    expect(
      matchAccelerator(
        { ...base, key: 'm', metaKey: true, shiftKey: true },
        { mod: true, shift: true, key: 'm' },
        'linux'
      )
    ).toBe(false)
  })

  it('rejects missing shift', () => {
    expect(
      matchAccelerator(
        { ...base, key: 'm', ctrlKey: true },
        { mod: true, shift: true, key: 'm' },
        'win32'
      )
    ).toBe(false)
  })
})

describe('conflictsWithClipboard', () => {
  it('flags Mod+Shift+C/V', () => {
    expect(conflictsWithClipboard({ mod: true, shift: true, key: 'c' })).toBe(true)
    expect(conflictsWithClipboard({ mod: true, shift: true, key: 'v' })).toBe(true)
  })

  it('allows default maximize binding', () => {
    expect(conflictsWithClipboard({ mod: true, shift: true, key: 'm' })).toBe(false)
  })
})

describe('acceleratorFromKeyboardEvent', () => {
  it('returns null for bare letter', () => {
    expect(
      acceleratorFromKeyboardEvent({
        key: 'm',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false
      })
    ).toBeNull()
  })

  it('captures mod+shift+m on darwin as mod', () => {
    expect(
      acceleratorFromKeyboardEvent(
        { key: 'm', ctrlKey: false, metaKey: true, altKey: false, shiftKey: true },
        'darwin'
      )
    ).toEqual({ key: 'm', mod: true, shift: true })
  })
})
