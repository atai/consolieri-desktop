import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const userData = mkdtempSync(join(tmpdir(), 'consoleri-hist-'))

const mockApp = {
  getPath: vi.fn(() => userData)
}

vi.mock('electron', () => ({ app: mockApp }))

const {
  buildShellHistoryOverrides,
  ensureShellHistoryFile,
  readPaneShellHistory,
  shellHistoryPath
} = await import('./shellHistory')

afterAll(() => {
  rmSync(userData, { recursive: true, force: true })
})

beforeEach(() => {
  mockApp.getPath.mockReturnValue(userData)
})

describe('ensureShellHistoryFile', () => {
  it('seeds a missing history file from saved commands', () => {
    const file = ensureShellHistoryFile('host-seed', 'pane-seed', ['ls', 'pwd'])
    expect(readFileSync(file, 'utf8')).toBe('ls\npwd\n')
  })

  it('leaves an existing history file untouched', () => {
    const file = shellHistoryPath('host-keep', 'pane-keep')
    ensureShellHistoryFile('host-keep', 'pane-keep', ['first'])
    writeFileSync(file, 'newer\n', 'utf8')
    ensureShellHistoryFile('host-keep', 'pane-keep', ['first'])
    expect(readFileSync(file, 'utf8')).toBe('newer\n')
  })
})

describe('readPaneShellHistory', () => {
  it('returns the last n lines from the pane file', () => {
    ensureShellHistoryFile('host-read', 'pane-read')
    writeFileSync(shellHistoryPath('host-read', 'pane-read'), 'one\ntwo\nthree\n', 'utf8')
    expect(readPaneShellHistory('host-read', 'pane-read', 2)).toEqual(['two', 'three'])
  })

  it('returns nothing when the limit is zero', () => {
    ensureShellHistoryFile('host-off', 'pane-off', ['ls'])
    expect(readPaneShellHistory('host-off', 'pane-off', 0)).toEqual([])
  })
})

describe('buildShellHistoryOverrides', () => {
  it('makes zsh append history up to the configured limit', () => {
    const { env } = buildShellHistoryOverrides('zsh', '/tmp/hist', {}, 50)
    const rc = readFileSync(join(env.ZDOTDIR!, '.zshrc'), 'utf8')
    expect(rc).toContain('export HISTSIZE=50')
    expect(rc).toContain('export SAVEHIST=50')
    expect(rc).toContain('setopt INC_APPEND_HISTORY')
  })

  it('makes bash append history after the user rc', () => {
    const { args } = buildShellHistoryOverrides('bash', '/tmp/hist-bash', {}, 80)
    const rc = readFileSync(args![1]!, 'utf8')
    expect(rc).toContain('export HISTSIZE=80')
    expect(rc).toContain('export HISTFILESIZE=80')
    expect(rc).toContain('shopt -s histappend')
    expect(rc).toContain('history -a')
  })

  it('does not wrap powershell', () => {
    const overrides = buildShellHistoryOverrides('powershell', '/tmp/hist-ps', {}, 10)
    expect(overrides.args).toBeUndefined()
    expect(overrides.env.HISTFILE).toBe('/tmp/hist-ps')
  })
})
