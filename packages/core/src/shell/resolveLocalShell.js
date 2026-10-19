function expandLocalCwd(cwd, homeDir) {
    if (!cwd || !homeDir)
        return cwd;
    if (cwd === '~')
        return homeDir;
    if (cwd.startsWith('~/') || cwd.startsWith('~\\')) {
        const sep = cwd[1];
        const rest = cwd.slice(2);
        const base = homeDir.endsWith('/') || homeDir.endsWith('\\') ? homeDir.slice(0, -1) : homeDir;
        return rest ? `${base}${sep}${rest}` : base;
    }
    return cwd;
}
export function resolveLocalShell(options) {
    const { shell, wslDistro, wslShell = '/bin/bash', platform, existsSync, homeDir } = options;
    const cwd = expandLocalCwd(options.cwd, homeDir);
    const withCwd = (spec) => (cwd ? { ...spec, cwd } : spec);
    switch (shell) {
        case 'pwsh':
            return withCwd({ file: platform === 'win32' ? 'pwsh.exe' : 'pwsh', args: [] });
        case 'powershell':
            return withCwd({ file: 'powershell.exe', args: [] });
        case 'cmd':
            return withCwd({ file: 'cmd.exe', args: [] });
        case 'bash': {
            const candidates = platform === 'win32'
                ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe']
                : ['/bin/bash', '/usr/bin/bash'];
            const bash = candidates.find((p) => existsSync(p)) ?? 'bash';
            return withCwd({ file: bash, args: ['--login', '-i'] });
        }
        case 'zsh': {
            const candidates = platform === 'win32' ? [] : ['/bin/zsh', '/usr/bin/zsh'];
            const zsh = candidates.find((p) => existsSync(p)) ?? 'zsh';
            return withCwd({ file: zsh, args: ['-l', '-i'] });
        }
        case 'sh': {
            const candidates = platform === 'win32'
                ? []
                : ['/bin/sh', '/usr/bin/sh'];
            const sh = candidates.find((p) => existsSync(p)) ?? 'sh';
            return withCwd({ file: sh, args: ['-l'] });
        }
        case 'wsl':
            return withCwd({
                file: 'wsl.exe',
                args: wslDistro ? ['-d', wslDistro, '--', wslShell, '-l'] : ['--', wslShell, '-l']
            });
        default:
            return withCwd({ file: platform === 'win32' ? 'powershell.exe' : 'bash', args: [] });
    }
}
