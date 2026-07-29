import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { spawnPnpm } from './pnpm.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const desktopDir = join(root, 'apps', 'desktop')

function electronPresent() {
  return [
    join(root, 'node_modules', 'electron'),
    join(desktopDir, 'node_modules', 'electron')
  ].some(existsSync)
}

function electronBuilderPresent() {
  return [
    join(root, 'node_modules', 'electron-builder'),
    join(desktopDir, 'node_modules', 'electron-builder')
  ].some(existsSync)
}

/**
 * Rebuild native deps against the installed Electron ABI.
 * @param {string} [logPrefix='install-app-deps']
 * @returns {number} exit code (0 on skip/success/warned failure)
 */
export function installAppDeps(logPrefix = 'install-app-deps') {
  if (!electronPresent()) {
    console.log(`[${logPrefix}] electron not installed yet, skipping`)
    return 0
  }
  if (!electronBuilderPresent()) {
    console.log(`[${logPrefix}] electron-builder not installed yet, skipping`)
    return 0
  }

  console.log(`[${logPrefix}] electron-builder install-app-deps …`)
  const pnpmCjs = join(root, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')
  let status = 1

  if (existsSync(pnpmCjs)) {
    const result = spawnSync(
      process.execPath,
      [pnpmCjs, 'exec', 'electron-builder', 'install-app-deps'],
      { cwd: desktopDir, stdio: 'inherit' }
    )
    status = result.status ?? 1
  }

  if (status !== 0) {
    status = spawnPnpm(['exec', 'electron-builder', 'install-app-deps'], desktopDir)
  }

  if (status !== 0) {
    console.warn(
      `[${logPrefix}] native rebuild failed — terminal/ssh may not work until rebuilt`
    )
    return 0
  }

  return 0
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isMain) {
  process.exit(installAppDeps())
}
