import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { app } from 'electron'
import {
  clampCommandHistoryLimit,
  shellHistoryDir,
  shellHistoryFile,
  shellHistorySeed,
  tailShellHistory
} from '@consoleri/core'
import type { LocalShellType } from '../../shared/types'
import { reportBestEffortFailure } from '../../shared/bestEffort'

export function shellHistoryRoot(): string {
  return join(app.getPath('userData'), 'shell-history')
}

export function shellHistoryPath(hostId: string, paneId: string): string {
  return shellHistoryFile(app.getPath('userData'), hostId, paneId)
}

export function ensureShellHistoryFile(
  hostId: string,
  paneId: string,
  lines?: readonly string[]
): string {
  const dir = shellHistoryDir(app.getPath('userData'), hostId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const file = join(dir, paneId)
  if (!existsSync(file)) writeFileSync(file, shellHistorySeed(lines), 'utf8')
  return file
}

export function readPaneShellHistory(hostId: string, paneId: string, limit: number): string[] {
  const clamped = clampCommandHistoryLimit(limit)
  if (clamped === 0) return []
  const file = shellHistoryPath(hostId, paneId)
  if (!existsSync(file)) return []
  return tailShellHistory(readFileSync(file, 'utf8'), clamped)
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
function historyTailLines(shell: 'zsh' | 'bash', histFile: string, limit: number): string[] {
  const quoted = shellQuote(histFile)
  const size = String(limit)
  if (shell === 'zsh') {
    return [
      `export HISTFILE=${quoted}`,
      `export HISTSIZE=${size}`,
      `export SAVEHIST=${size}`,
      'setopt INC_APPEND_HISTORY'
    ]
  }
  return [
    `export HISTFILE=${quoted}`,
    `export HISTSIZE=${size}`,
    `export HISTFILESIZE=${size}`,
    'shopt -s histappend',
    'PROMPT_COMMAND="history -a${PROMPT_COMMAND:+;$PROMPT_COMMAND}"'
  ]
}

export function buildShellHistoryOverrides(
  shell: LocalShellType,
  histFile: string,
  baseEnv: Record<string, string>,
  historyLimit?: number
): ShellHistoryOverrides {
  const env: Record<string, string> = { ...baseEnv, HISTFILE: histFile }
  if (shell !== 'bash' && shell !== 'zsh' && shell !== 'sh') {
    return { env }
  }

  const limit = clampCommandHistoryLimit(historyLimit)
  const wrapDir = join(shellHistoryRoot(), '_rc')
  if (!existsSync(wrapDir)) mkdirSync(wrapDir, { recursive: true })
  const home = homedir()
  const histLine = `export HISTFILE=${shellQuote(histFile)}`

  if (shell === 'zsh') {
    const zdotdir = join(wrapDir, 'zsh')
    if (!existsSync(zdotdir)) mkdirSync(zdotdir, { recursive: true })
    const tail = historyTailLines('zsh', histFile, limit)
    const sourceUser = (name: string): string =>
      `[[ -f ${shellQuote(join(home, name))} ]] && source ${shellQuote(join(home, name))}`

    writeFileSync(
      join(zdotdir, '.zshenv'),
      [histLine, sourceUser('.zshenv'), ...tail, ''].join('\n'),
      'utf8'
    )
    writeFileSync(
      join(zdotdir, '.zprofile'),
      [histLine, sourceUser('.zprofile'), ...tail, ''].join('\n'),
      'utf8'
    )
    writeFileSync(
      join(zdotdir, '.zshrc'),
      [histLine, sourceUser('.zshrc'), ...tail, ''].join('\n'),
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
      histLine,
      `[[ -f ${shellQuote(join(home, '.bashrc'))} ]] && source ${shellQuote(join(home, '.bashrc'))}`,
      `[[ -f ${shellQuote(join(home, '.bash_profile'))} ]] && source ${shellQuote(join(home, '.bash_profile'))}`,
      ...historyTailLines('bash', histFile, limit),
      ''
    ].join('\n'),
    'utf8'
  )
  return { env, args: ['--rcfile', bashRcfile, '-i'] }
}
