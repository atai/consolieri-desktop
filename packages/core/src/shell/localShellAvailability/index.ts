import type { WhichPlatform } from './which'
import { isPowerShellAvailable } from './checkers/powershell'
import { isPwshAvailable } from './checkers/pwsh'
import { isCmdAvailable } from './checkers/cmd'
import { isBashAvailable } from './checkers/bash'
import { isZshAvailable } from './checkers/zsh'
import { isShAvailable } from './checkers/sh'

export type LocalShellExecutableType = 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'zsh' | 'sh'

export type LocalShellAvailability = Record<LocalShellExecutableType, boolean>

export interface LocalShellAvailabilityDeps {
  platform: WhichPlatform
  pathEnv: string | undefined
  existsSync: (p: string) => boolean
  homeDir?: string
  pathext?: string[]
}

export function getLocalShellAvailability(deps: LocalShellAvailabilityDeps): LocalShellAvailability {
  return {
    powershell: isPowerShellAvailable(deps),
    pwsh: isPwshAvailable(deps),
    cmd: isCmdAvailable(deps),
    bash: isBashAvailable(deps),
    zsh: isZshAvailable(deps),
    sh: isShAvailable(deps)
  }
}

export function isLocalShellExecutableAvailable(
  shell: LocalShellExecutableType,
  deps: LocalShellAvailabilityDeps
): boolean {
  return getLocalShellAvailability(deps)[shell]
}

