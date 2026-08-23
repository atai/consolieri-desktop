import { describe, expect, it } from 'vitest'
import { getLocalShellAvailability } from '../index'

describe('localShellAvailability (powershell/pwsh/cmd)', () => {
  it('marks powershell available on win32 when powershell.exe is found', () => {
    const availability = getLocalShellAvailability({
      platform: 'win32',
      pathEnv: 'C:\\Windows\\System32',
      existsSync: (p) => p === 'C:\\Windows\\System32\\powershell.exe',
      pathext: ['.EXE']
    })

    expect(availability.powershell).toBe(true)
    expect(availability.pwsh).toBe(false)
    expect(availability.cmd).toBe(false)
  })

  it('marks pwsh available on win32 when pwsh.exe is found', () => {
    const availability = getLocalShellAvailability({
      platform: 'win32',
      pathEnv: 'C:\\Tools',
      existsSync: (p) => p === 'C:\\Tools\\pwsh.exe',
      pathext: ['.EXE']
    })

    expect(availability.pwsh).toBe(true)
    expect(availability.powershell).toBe(false)
  })

  it('marks pwsh available on darwin when pwsh is found in PATH', () => {
    const availability = getLocalShellAvailability({
      platform: 'darwin',
      pathEnv: '/opt/homebrew/bin:/usr/bin',
      existsSync: (p) => p === '/opt/homebrew/bin/pwsh'
    })

    expect(availability.pwsh).toBe(true)
    expect(availability.powershell).toBe(false)
    expect(availability.cmd).toBe(false)
  })

  it('marks cmd available on win32 when cmd.exe is found', () => {
    const availability = getLocalShellAvailability({
      platform: 'win32',
      pathEnv: 'C:\\Windows\\System32',
      existsSync: (p) => p === 'C:\\Windows\\System32\\cmd.exe',
      pathext: ['.EXE']
    })

    expect(availability.cmd).toBe(true)
    expect(availability.powershell).toBe(false)
  })

  it('marks powershell/pwsh/cmd unavailable on darwin', () => {
    const availability = getLocalShellAvailability({
      platform: 'darwin',
      pathEnv: '/bin',
      existsSync: () => false
    })

    expect(availability.powershell).toBe(false)
    expect(availability.pwsh).toBe(false)
    expect(availability.cmd).toBe(false)
  })
})

