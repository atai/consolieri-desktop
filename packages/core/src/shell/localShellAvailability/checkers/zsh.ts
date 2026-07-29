import { which, type WhichPlatform } from '../which'
import { resolveLocalShell } from '../../resolveLocalShell'
import type { LocalShellAvailabilityDeps } from './powershell'

function isAbsolutePath(p: string, platform: WhichPlatform): boolean {
  if (!p) return false
  if (platform === 'win32') return /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\')
  return p.startsWith('/')
}

export function isZshAvailable(deps: LocalShellAvailabilityDeps): boolean {
  const spec = resolveLocalShell({
    shell: 'zsh',
    platform: deps.platform,
    existsSync: deps.existsSync,
    wslDistro: undefined,
    homeDir: deps.homeDir
  })

  if (isAbsolutePath(spec.file, deps.platform)) {
    return deps.existsSync(spec.file)
  }

  return (
    which({
      command: spec.file,
      platform: deps.platform,
      pathEnv: deps.pathEnv,
      existsSync: deps.existsSync,
      pathext: deps.pathext
    }) !== null
  )
}

