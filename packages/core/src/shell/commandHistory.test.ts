import { describe, expect, it } from 'vitest'
import {
  clampCommandHistoryLimit,
  DEFAULT_COMMAND_HISTORY_LIMIT,
  MAX_COMMAND_HISTORY_LIMIT,
  shellHistorySeed,
  tailShellHistory
} from './commandHistory'

describe('clampCommandHistoryLimit', () => {
  it('uses the default when the value is missing', () => {
    expect(clampCommandHistoryLimit(undefined)).toBe(DEFAULT_COMMAND_HISTORY_LIMIT)
  })

  it('keeps zero and clamps the upper bound', () => {
    expect(clampCommandHistoryLimit(0)).toBe(0)
    expect(clampCommandHistoryLimit(MAX_COMMAND_HISTORY_LIMIT + 10)).toBe(MAX_COMMAND_HISTORY_LIMIT)
  })

  it('truncates fractional values and treats negatives as zero', () => {
    expect(clampCommandHistoryLimit(10.9)).toBe(10)
    expect(clampCommandHistoryLimit(-4)).toBe(0)
  })
})

describe('tailShellHistory', () => {
  it('returns the last n non-empty lines', () => {
    expect(tailShellHistory('git status\nls\npwd\n', 2)).toEqual(['ls', 'pwd'])
  })

  it('keeps a short file and drops a trailing blank line', () => {
    expect(tailShellHistory('ls\n', 200)).toEqual(['ls'])
  })

  it('returns nothing when saving is disabled', () => {
    expect(tailShellHistory('ls\npwd\n', 0)).toEqual([])
  })

  it('splits Windows newlines', () => {
    expect(tailShellHistory('echo a\r\necho b\r\n', 1)).toEqual(['echo b'])
  })
})

describe('shellHistorySeed', () => {
  it('joins commands with a trailing newline', () => {
    expect(shellHistorySeed(['ls', 'pwd'])).toBe('ls\npwd\n')
  })

  it('is empty when there is nothing to restore', () => {
    expect(shellHistorySeed(undefined)).toBe('')
    expect(shellHistorySeed([])).toBe('')
  })
})
