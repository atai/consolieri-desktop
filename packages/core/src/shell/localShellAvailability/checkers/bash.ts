import { which, type WhichPlatform } from '../which'
import { resolveLocalShell } from '../../resolveLocalShell'
import type { LocalShellAvailabilityDeps } from './powershell'

function isAbsolutePath(p: string, platform: WhichPlatform): boolean {
  if (!p) return false
  if (platform === 'win32') {
    return /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\')
  }
  return p.startsWith('/')
}

export function isBashAvailable(deps: LocalShellAvailabilityDeps): boolean {
  // resolveLocalShell already knows platform-specific candidates for bash
  const spec = resolveLocalShell({
    shell: 'bash',
    platform: deps.platform,
    existsSync: deps.existsSync,
    wslDistro: undefined,
    homeDir: deps.homeDir
  })

  if (isAbsolutePath(spec.file, deps.platform)) {
    return deps.existsSync(spec.file)
  }

  // spec.file may fall back to just "bash" if no absolute candidate matched
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

