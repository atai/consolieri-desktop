import { which } from '../which'
import type { LocalShellAvailabilityDeps } from './powershell'

export function isPwshAvailable(deps: LocalShellAvailabilityDeps): boolean {
  return (
    which({
      command: deps.platform === 'win32' ? 'pwsh.exe' : 'pwsh',
      platform: deps.platform,
      pathEnv: deps.pathEnv,
      existsSync: deps.existsSync,
      pathext: deps.pathext
    }) !== null
  )
}

