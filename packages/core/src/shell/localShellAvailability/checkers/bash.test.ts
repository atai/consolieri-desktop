import { describe, expect, it } from 'vitest'
import { getLocalShellAvailability } from '../index'

describe('localShellAvailability (bash)', () => {
  it('marks bash available on darwin when /bin/bash exists', () => {
    const availability = getLocalShellAvailability({
      platform: 'darwin',
      pathEnv: '/bin:/usr/bin',
      existsSync: (p) => p === '/bin/bash'
    })

    expect(availability.bash).toBe(true)
  })

  it('marks bash unavailable on darwin when /bin/bash missing', () => {
    const availability = getLocalShellAvailability({
      platform: 'darwin',
      pathEnv: '/bin:/usr/bin',
      existsSync: () => false
    })

    expect(availability.bash).toBe(false)
  })

  it('marks bash available on linux when /usr/bin/bash exists', () => {
    const availability = getLocalShellAvailability({
      platform: 'linux',
      pathEnv: '/usr/bin:/bin',
      existsSync: (p) => p === '/usr/bin/bash'
    })

    expect(availability.bash).toBe(true)
  })

  it('marks zsh and sh available on unix when executables exist', () => {
    const availability = getLocalShellAvailability({
      platform: 'darwin',
      pathEnv: '/bin:/usr/bin',
      existsSync: (p) => ['/bin/zsh', '/bin/sh'].includes(p)
    })

    expect(availability.zsh).toBe(true)
    expect(availability.sh).toBe(true)
  })
})

