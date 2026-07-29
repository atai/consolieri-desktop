import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { spawnPnpm } from './pnpm.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const desktopDir = join(root, 'apps', 'desktop')

/** Modules that must match the Electron ABI. Skip optional broken natives (e.g. cpu-features). */
const ONLY_MODULES = 'node-pty'

function electronPresent() {
  return [
    join(root, 'node_modules', 'electron'),
    join(desktopDir, 'node_modules', 'electron')
  ].some(existsSync)
}

function electronRebuildPresent() {
  return [
    join(root, 'node_modules', '@electron', 'rebuild'),
    join(desktopDir, 'node_modules', '@electron', 'rebuild')
  ].some(existsSync)
}

/**
 * Rebuild required native deps against the installed Electron ABI.
 * Uses `--only` so optional ssh2 deps like `cpu-features` (broken gyp) are skipped.
 *
 * @param {string} [logPrefix='install-app-deps']
 * @returns {number} exit code (0 on skip/success/warned failure)
 */
export function installAppDeps(logPrefix = 'install-app-deps') {
  if (!electronPresent()) {
    console.log(`[${logPrefix}] electron not installed yet, skipping`)
    return 0
  }
  if (!electronRebuildPresent()) {
    console.log(`[${logPrefix}] @electron/rebuild not installed yet, skipping`)
    return 0
  }

  const args = [
    'exec',
    'electron-rebuild',
    '-f',
    '-o',
    ONLY_MODULES,
    '-m',
    desktopDir
  ]

  console.log(`[${logPrefix}] electron-rebuild --only ${ONLY_MODULES} …`)

  const pnpmCjs = join(root, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')
  let status = 1

  if (existsSync(pnpmCjs)) {
    const result = spawnSync(process.execPath, [pnpmCjs, ...args], {
      cwd: root,
      stdio: 'inherit'
    })
    status = result.status ?? 1
  } else {
    status = spawnPnpm(args, root)
  }

  if (status !== 0) {
    console.warn(
      `[${logPrefix}] native rebuild failed — local terminals may not work until rebuilt`
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
