import { existsSync } from 'fs'
import { getLocalShellAvailability, type LocalShellAvailability, type LocalShellAvailabilityDeps } from '@consoleri/core'

function getDeps(): LocalShellAvailabilityDeps {
  const homeDir = process.env.HOME ?? process.env.USERPROFILE
  const pathEnv = process.env.PATH
  const pathext = process.env.PATHEXT?.split(';').map((s) => s.trim()).filter(Boolean)

  return {
    platform: process.platform as LocalShellAvailabilityDeps['platform'],
    pathEnv,
    existsSync,
    homeDir,
    pathext
  }
}

export const localShellsService = {
  available(): LocalShellAvailability {
    return getLocalShellAvailability(getDeps())
  }
}

