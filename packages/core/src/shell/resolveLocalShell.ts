export type LocalShellType = 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'zsh' | 'sh' | 'wsl'

export interface ShellSpawnSpec {
  file: string
  args: string[]
  cwd?: string
}

export interface ResolveLocalShellOptions {
  shell: LocalShellType
  wslDistro?: string
  wslShell?: string
  platform: NodeJS.Platform
  existsSync: (path: string) => boolean
  homeDir?: string
}

export function resolveLocalShell(options: ResolveLocalShellOptions): ShellSpawnSpec {
  const { shell, wslDistro, wslShell = '/bin/bash', platform, existsSync } = options

  switch (shell) {
    case 'pwsh':
      return { file: platform === 'win32' ? 'pwsh.exe' : 'pwsh', args: [] }
    case 'powershell':
      return { file: 'powershell.exe', args: [] }
    case 'cmd':
      return { file: 'cmd.exe', args: [] }
    case 'bash': {
      const candidates =
        platform === 'win32'
          ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe']
          : ['/bin/bash', '/usr/bin/bash']
      const bash = candidates.find((p) => existsSync(p)) ?? 'bash'
      return { file: bash, args: ['--login', '-i'] }
    }
    case 'zsh': {
      const candidates = platform === 'win32' ? [] : ['/bin/zsh', '/usr/bin/zsh']
      const zsh = candidates.find((p) => existsSync(p)) ?? 'zsh'
      return { file: zsh, args: ['-l', '-i'] }
    }
    case 'sh': {
      const candidates =
        platform === 'win32'
          ? []
          : ['/bin/sh', '/usr/bin/sh']
      const sh = candidates.find((p) => existsSync(p)) ?? 'sh'
      return { file: sh, args: ['-l'] }
    }
    case 'wsl':
      return {
        file: 'wsl.exe',
        args: wslDistro ? ['-d', wslDistro, '--', wslShell, '-l'] : ['--', wslShell, '-l']
      }
    default:
      return { file: platform === 'win32' ? 'powershell.exe' : 'bash', args: [] }
  }
}
