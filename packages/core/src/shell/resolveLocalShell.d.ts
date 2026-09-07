export type LocalShellType = 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'zsh' | 'sh' | 'wsl';
export interface ShellSpawnSpec {
    file: string;
    args: string[];
    cwd?: string;
}
export interface ResolveLocalShellOptions {
    shell: LocalShellType;
    wslDistro?: string;
    wslShell?: string;
    platform: NodeJS.Platform;
    existsSync: (path: string) => boolean;
    homeDir?: string;
    cwd?: string;
}
export declare function resolveLocalShell(options: ResolveLocalShellOptions): ShellSpawnSpec;
