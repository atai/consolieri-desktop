import { describe, expect, it, vi } from 'vitest'

vi.mock('./clients', () => ({
  isClientAlwaysAllow: vi.fn((name: string) => name === 'trusted'),
  markClientAlwaysAllow: vi.fn()
}))

import { shouldSkipConfirmation } from './confirm'
import type { ControlWindowRecipe } from '../../shared/types'

describe('control confirmation policy', () => {
  const base: ControlWindowRecipe = {
    title: 'Demo',
    panes: [{ title: 'API', cwd: '/tmp/api' }]
  }

  it('never skips when a pane has a command', () => {
    expect(
      shouldSkipConfirmation('trusted', {
        ...base,
        panes: [{ title: 'API', cwd: '/tmp/api', command: 'echo hi' }]
      })
    ).toBe(false)
  })

  it('skips for always-allow clients without commands', () => {
    expect(shouldSkipConfirmation('trusted', base)).toBe(true)
    expect(shouldSkipConfirmation('unknown-client', base)).toBe(false)
  })
})
