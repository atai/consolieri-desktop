import { which, type WhichPlatform } from '../which'

export interface LocalShellAvailabilityDeps {
  platform: WhichPlatform
  pathEnv: string | undefined
  existsSync: (p: string) => boolean
  homeDir?: string
  pathext?: string[]
}

export function isPowerShellAvailable(deps: LocalShellAvailabilityDeps): boolean {
  if (deps.platform !== 'win32') return false

  return (
    which({
      command: 'powershell.exe',
      platform: deps.platform,
      pathEnv: deps.pathEnv,
      existsSync: deps.existsSync,
      pathext: deps.pathext
    }) !== null
  )
}

