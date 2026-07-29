import * as path from 'node:path'

export type WhichPlatform = 'win32' | 'linux' | 'darwin' | 'aix' | 'freebsd' | 'sunos' | 'openbsd' | 'netbsd'

export interface WhichOptions {
  command: string
  platform: WhichPlatform
  pathEnv: string | undefined
  existsSync: (p: string) => boolean
  /**
   * PATHEXT-like list. Should include the leading dot (e.g. ".EXE").
   * When undefined, a small default set is used.
   */
  pathext?: string[]
}

function isPathLike(command: string): boolean {
  return command.includes('/') || command.includes('\\')
}

function splitPathEnv(platform: WhichPlatform, pathEnv: string | undefined): string[] {
  if (!pathEnv) return []
  const delimiter = platform === 'win32' ? ';' : ':'
  return pathEnv.split(delimiter).map((d) => d.trim()).filter(Boolean)
}

function defaultPathext(): string[] {
  // Minimal set: enough for shell detection and keeps behaviour predictable.
  return ['.EXE', '.BAT', '.CMD', '.COM', '.PS1']
}

export function which({ command, platform, pathEnv, existsSync, pathext }: WhichOptions): string | null {
  if (isPathLike(command)) {
    return existsSync(command) ? command : null
  }

  const dirs = splitPathEnv(platform, pathEnv)
  if (dirs.length === 0) return null

  const isWin = platform === 'win32'
  const pathextList = (pathext ?? defaultPathext()).filter(Boolean)

  const ext = isWin ? path.win32.extname(command) : ''
  const candidates =
    isWin && ext === ''
      ? pathextList.map((e) => `${command}${e}`)
      : [command]

  const joinFn = isWin ? path.win32.join : path.posix.join
  for (const dir of dirs) {
    for (const c of candidates) {
      const full = joinFn(dir, c)
      if (existsSync(full)) return full
    }
  }

  return null
}

