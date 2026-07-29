import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { installAppDeps } from './install-app-deps.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const electronInstallJs = join(root, 'node_modules', 'electron', 'install.js')
const electronExe = join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
const electronApp = join(root, 'node_modules', 'electron', 'dist', 'Electron.app')
const electronBinary = join(root, 'node_modules', 'electron', 'dist', 'electron')

function ensureElectronBinary() {
  if (existsSync(electronExe) || existsSync(electronApp) || existsSync(electronBinary)) {
    console.log('[postinstall] Electron binary already present')
    return 0
  }

  if (!existsSync(electronInstallJs)) {
    console.log('[postinstall] electron package not installed yet, skipping binary download')
    return 0
  }

  console.log('[postinstall] Downloading Electron binary…')
  const result = spawnSync(process.execPath, [electronInstallJs], {
    cwd: root,
    stdio: 'inherit'
  })
  return result.status ?? 1
}

const downloadStatus = ensureElectronBinary()
if (downloadStatus !== 0) {
  process.exit(downloadStatus)
}

process.exit(installAppDeps('postinstall'))
