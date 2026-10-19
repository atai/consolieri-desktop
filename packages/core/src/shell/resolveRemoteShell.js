import { wrapShellCommandWithPs1 } from './remotePrompt';
const DEFAULT_BASH_COMMAND = '/bin/bash --login -i';
function hasLoginFlag(shell) {
    return /(?:^|\s)(?:-l|--login)(?:\s|$)/.test(shell);
}
function hasInteractiveFlag(shell) {
    return /(?:^|\s)-i(?:\s|$)/.test(shell);
}
function shellBasename(shellPath) {
    const executable = shellPath.trim().split(/\s+/)[0] ?? shellPath;
    const parts = executable.split('/');
    return parts[parts.length - 1] ?? executable;
}
const BASH_PS1_SHELLS = new Set(['bash', 'sh', 'zsh', 'ksh', 'dash']);
function supportsBashPs1(shell) {
    return BASH_PS1_SHELLS.has(shellBasename(shell));
}
function augmentShellCommand(shell) {
    const trimmed = shell.trim();
    const base = shellBasename(trimmed);
    const flags = [];
    if (base === 'bash') {
        if (!hasLoginFlag(trimmed))
            flags.push('--login');
        if (!hasInteractiveFlag(trimmed))
            flags.push('-i');
    }
    else if (base === 'sh') {
        if (!hasLoginFlag(trimmed))
            flags.push('-l');
    }
    else if (base === 'zsh') {
        if (!hasLoginFlag(trimmed))
            flags.push('-l');
        if (!hasInteractiveFlag(trimmed))
            flags.push('-i');
    }
    else if (base === 'csh' || base === 'tcsh') {
        if (!hasInteractiveFlag(trimmed))
            flags.push('-i');
    }
    if (flags.length === 0)
        return trimmed;
    return `${trimmed} ${flags.join(' ')}`;
}
function shellSingleQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function withRemoteCwd(command, cwd) {
    const dir = cwd?.trim();
    if (!dir)
        return command;
    return `cd ${shellSingleQuote(dir)} && ${command}`;
}
function execCommand(shell, promptFallback) {
    const trimmed = shell?.trim() ?? '';
    const baseCommand = trimmed ? augmentShellCommand(trimmed) : DEFAULT_BASH_COMMAND;
    const command = promptFallback && supportsBashPs1(baseCommand)
        ? wrapShellCommandWithPs1(baseCommand)
        : baseCommand;
    return { mode: 'exec', command };
}
export function resolveRemoteShellInvoke(shell, options) {
    const promptFallback = options?.promptFallback ?? false;
    const cwd = options?.cwd?.trim() || undefined;
    const trimmed = shell?.trim() ?? '';
    if (!trimmed && !promptFallback && !cwd) {
        return { mode: 'default' };
    }
    const invoke = execCommand(shell, promptFallback);
    if (invoke.mode !== 'exec' || !cwd)
        return invoke;
    return { mode: 'exec', command: withRemoteCwd(invoke.command, cwd) };
}
