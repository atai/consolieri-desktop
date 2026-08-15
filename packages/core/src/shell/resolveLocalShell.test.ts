import { describe, expect, it } from 'vitest'
import { resolveLocalShell } from './resolveLocalShell'

describe('resolveLocalShell', () => {
  it('resolves powershell on windows', () => {
    const spec = resolveLocalShell({
      shell: 'powershell',
      platform: 'win32',
      existsSync: () => false
    })
    expect(spec.file).toBe('powershell.exe')
  })

  it('resolves wsl with distro', () => {
    const spec = resolveLocalShell({
      shell: 'wsl',
      wslDistro: 'Ubuntu',
      platform: 'win32',
      existsSync: () => false
    })
    expect(spec.args).toEqual(['-d', 'Ubuntu', '--', '/bin/bash', '-l'])
  })

  it('resolves bash on linux', () => {
    const spec = resolveLocalShell({
      shell: 'bash',
      platform: 'linux',
      existsSync: (p) => p === '/bin/bash'
    })
    expect(spec.file).toBe('/bin/bash')
  })

  it('resolves zsh on darwin', () => {
    const spec = resolveLocalShell({
      shell: 'zsh',
      platform: 'darwin',
      existsSync: (p) => p === '/bin/zsh'
    })
    expect(spec.file).toBe('/bin/zsh')
    expect(spec.args).toEqual(['-l', '-i'])
  })

  it('passes cwd when provided', () => {
    const spec = resolveLocalShell({
      shell: 'zsh',
      platform: 'darwin',
      existsSync: (p) => p === '/bin/zsh',
      cwd: '/Users/ra/git/consoleri'
    })
    expect(spec.cwd).toBe('/Users/ra/git/consoleri')
  })

  it('resolves sh on linux', () => {
    const spec = resolveLocalShell({
      shell: 'sh',
      platform: 'linux',
      existsSync: (p) => p === '/bin/sh'
    })
    expect(spec.file).toBe('/bin/sh')
    expect(spec.args).toEqual(['-l'])
  })
})
