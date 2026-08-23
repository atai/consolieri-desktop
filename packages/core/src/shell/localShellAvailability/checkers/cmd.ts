import { which } from '../which'
import type { LocalShellAvailabilityDeps } from './powershell'

export function isCmdAvailable(deps: LocalShellAvailabilityDeps): boolean {
  if (deps.platform !== 'win32') return false

  return (
    which({
      command: 'cmd.exe',
      platform: deps.platform,
      pathEnv: deps.pathEnv,
      existsSync: deps.existsSync,
      pathext: deps.pathext
    }) !== null
  )
}

