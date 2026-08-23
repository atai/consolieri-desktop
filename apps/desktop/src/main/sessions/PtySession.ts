import * as pty from 'node-pty'
import { BaseTransport } from './Transport'
import { resolveLocalShellSpawn } from './shellUtils'
import { buildShellHistoryOverrides } from './shellHistory'
import type { LocalShellType } from '../../shared/types'

export interface PtySessionOptions {
  shell: LocalShellType
  cols: number
  rows: number
  wslDistro?: string
  wslShell?: string
  cwd?: string
  histFile?: string
}

export class PtySession extends BaseTransport {
  readonly protocol = 'local_pty'
  private proc: pty.IPty | null = null

  constructor(options: PtySessionOptions)
  /** @deprecated Prefer options object */
  constructor(
    shell: LocalShellType,
    cols: number,
    rows: number,
    wslDistro?: string,
    wslShell?: string
  )
  constructor(
    shellOrOptions: LocalShellType | PtySessionOptions,
    cols?: number,
    rows?: number,
    wslDistro?: string,
    wslShell?: string
  ) {
    super()
    const options: PtySessionOptions =
      typeof shellOrOptions === 'object'
        ? shellOrOptions
        : {
            shell: shellOrOptions,
            cols: cols!,
            rows: rows!,
            wslDistro,
            wslShell
          }

    const { file, args: baseArgs, cwd } = resolveLocalShellSpawn(
      options.shell,
      options.wslDistro,
      options.wslShell,
      options.cwd
    )
    let env = { ...process.env } as Record<string, string>
    if (process.platform === 'win32' && !env.TERM) {
      env.TERM = 'xterm-256color'
    }
    if (process.platform !== 'win32' && !env.TERM) {
      env.TERM = 'xterm-256color'
    }

    let args = baseArgs
    if (options.histFile) {
      const overrides = buildShellHistoryOverrides(options.shell, options.histFile, env)
      env = overrides.env
      if (overrides.args) args = overrides.args
    }

    this.proc = pty.spawn(file, args, {
      name: 'xterm-256color',
      cols: options.cols,
      rows: options.rows,
      cwd: cwd ?? process.env.HOME ?? process.env.USERPROFILE,
      env
    })

    this.proc.onData((data) => this.emit('data', data))
    this.proc.onExit(({ exitCode, signal }) => this.emit('exit', exitCode, signal))
  }

  get pid(): number | undefined {
    return this.proc?.pid
  }

  write(data: string): void {
    this.proc?.write(data)
  }

  resize(cols: number, rows: number): void {
    this.proc?.resize(cols, rows)
  }

  disconnect(): void {
    this.proc?.kill()
    this.proc = null
  }
}
