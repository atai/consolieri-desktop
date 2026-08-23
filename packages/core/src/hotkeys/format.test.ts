import { describe, expect, it } from 'vitest'
import { formatAccelerator } from './format'

describe('formatAccelerator', () => {
  it('formats Ctrl+Shift+M on win32', () => {
    expect(formatAccelerator({ mod: true, shift: true, key: 'm' }, 'win32')).toBe('Ctrl+Shift+M')
  })

  it('formats ⌘⇧M on darwin', () => {
    expect(formatAccelerator({ mod: true, shift: true, key: 'm' }, 'darwin')).toBe('⌘⇧M')
  })

  it('formats Alt+Ctrl without mod flag', () => {
    expect(formatAccelerator({ ctrl: true, alt: true, key: 'k' }, 'linux')).toBe('Ctrl+Alt+K')
  })
})
