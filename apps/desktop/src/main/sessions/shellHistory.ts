import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { app } from 'electron'
import { shellHistoryDir, shellHistoryFile } from '@consoleri/core'
import type { LocalShellType } from '../../shared/types'
import { reportBestEffortFailure } from '../../shared/bestEffort'

export function shellHistoryRoot(): string {
  return join(app.getPath('userData'), 'shell-history')
}

export function shellHistoryPath(hostId: string, paneId: string): string {
  return shellHistoryFile(app.getPath('userData'), hostId, paneId)
}

export function ensureShellHistoryFile(hostId: string, paneId: string): string {
  const dir = shellHistoryDir(app.getPath('userData'), hostId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const file = join(dir, paneId)
  if (!existsSync(file)) writeFileSync(file, '', 'utf8')
  return file
}

export function deletePaneShellHistory(hostId: string, paneId: string): void {
  const file = shellHistoryPath(hostId, paneId)
  try {
    rmSync(file, { force: true })
  } catch (error) {
    reportBestEffortFailure('delete pane shell history', error)
  }
}

export function deleteHostShellHistory(hostId: string): void {
  const dir = shellHistoryDir(app.getPath('userData'), hostId)
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch (error) {
    reportBestEffortFailure('delete host shell history', error)
  }
}

export interface ShellHistoryOverrides {
  env: Record<string, string>
  /** When set, replace shell args with these (bash --rcfile). */
  args?: string[]
}

function shellQuote(path: string): string {
  return JSON.stringify(path)
}

/**
 * Build env / rc overrides so bash/zsh use a per-pane HISTFILE without
 * replacing the user's interactive config.
 */
export function buildShellHistoryOverrides(
  shell: LocalShellType,
  histFile: string,
  baseEnv: Record<string, string>
): ShellHistoryOverrides {
  const env: Record<string, string> = { ...baseEnv, HISTFILE: histFile }
  if (shell !== 'bash' && shell !== 'zsh' && shell !== 'sh') {
    return { env }
  }

  const wrapDir = join(shellHistoryRoot(), '_rc')
  if (!existsSync(wrapDir)) mkdirSync(wrapDir, { recursive: true })
  const home = homedir()

  if (shell === 'zsh') {
    const zdotdir = join(wrapDir, 'zsh')
    if (!existsSync(zdotdir)) mkdirSync(zdotdir, { recursive: true })
    const histLine = `export HISTFILE=${shellQuote(histFile)}`
    const sourceUser = (name: string): string =>
      `[[ -f ${shellQuote(join(home, name))} ]] && source ${shellQuote(join(home, name))}`

    writeFileSync(
      join(zdotdir, '.zshenv'),
      [histLine, sourceUser('.zshenv'), histLine, ''].join('\n'),
      'utf8'
    )
    writeFileSync(
      join(zdotdir, '.zprofile'),
      [histLine, sourceUser('.zprofile'), histLine, ''].join('\n'),
      'utf8'
    )
    writeFileSync(
      join(zdotdir, '.zshrc'),
      [histLine, sourceUser('.zshrc'), histLine, ''].join('\n'),
      'utf8'
    )
    env.ZDOTDIR = zdotdir
    return { env }
  }

  // bash / sh: interactive non-login with --rcfile so HISTFILE sticks
  const bashRcfile = join(wrapDir, 'bashrc')
  writeFileSync(
    bashRcfile,
    [
      `export HISTFILE=${shellQuote(histFile)}`,
      `[[ -f ${shellQuote(join(home, '.bashrc'))} ]] && source ${shellQuote(join(home, '.bashrc'))}`,
      `[[ -f ${shellQuote(join(home, '.bash_profile'))} ]] && source ${shellQuote(join(home, '.bash_profile'))}`,
      `export HISTFILE=${shellQuote(histFile)}`,
      ''
    ].join('\n'),
    'utf8'
  )
  return { env, args: ['--rcfile', bashRcfile, '-i'] }
}
