import { describe, expect, it } from 'vitest'
import { which } from './which'

describe('which', () => {
  it('returns direct path if command contains separators', () => {
    const found = which({
      command: '/bin/bash',
      platform: 'darwin',
      pathEnv: undefined,
      existsSync: (p) => p === '/bin/bash'
    })

    expect(found).toBe('/bin/bash')
  })

  it('finds bash on darwin via PATH', () => {
    const found = which({
      command: 'bash',
      platform: 'darwin',
      pathEnv: '/bin:/usr/bin',
      existsSync: (p) => p === '/bin/bash'
    })

    expect(found).toBe('/bin/bash')
  })

  it('finds powershell.exe on win32 via PATH', () => {
    const found = which({
      command: 'powershell.exe',
      platform: 'win32',
      pathEnv: 'C:\\Windows\\System32;D:\\Tools',
      existsSync: (p) => p === 'C:\\Windows\\System32\\powershell.exe',
      pathext: ['.EXE']
    })

    expect(found).toBe('C:\\Windows\\System32\\powershell.exe')
  })

  it('appends pathext when command has no extension on win32', () => {
    const found = which({
      command: 'cmd',
      platform: 'win32',
      pathEnv: 'C:\\Windows\\System32',
      existsSync: (p) => p === 'C:\\Windows\\System32\\cmd.exe',
      pathext: ['.exe']
    })

    expect(found).toBe('C:\\Windows\\System32\\cmd.exe')
  })
})

