import { describe, expect, it } from 'vitest'
import {
  _clearReportWindowsForTests,
  getReportWindow,
  registerReportWindow
} from './ReportWindowRegistry'

describe('ReportWindowRegistry', () => {
  it('registers and clears destroyed windows', () => {
    _clearReportWindowsForTests()
    const win = {
      isDestroyed: () => false,
      on: (_event: string, _handler: () => void) => undefined
    }
    registerReportWindow('r1', win as never)
    expect(getReportWindow('r1')).toBe(win)

    const dead = {
      isDestroyed: () => true,
      on: () => undefined
    }
    registerReportWindow('r2', dead as never)
    expect(getReportWindow('r2')).toBeUndefined()
    _clearReportWindowsForTests()
  })
})
