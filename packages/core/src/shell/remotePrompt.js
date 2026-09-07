import { shellEscapeSingleQuoted } from '../keys/shellEscape';
/** Bash PS1 with green user@host and blue working directory (xterm-256color). */
export function buildFallbackPs1() {
    return String.raw `\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ `;
}
/** Prefix a remote shell command with PS1 via env(1) so it works when sshd blocks AcceptEnv and when the login shell is csh. */
export function wrapShellCommandWithPs1(command, ps1 = buildFallbackPs1()) {
    return `env PS1=${shellEscapeSingleQuoted(ps1)} ${command}`;
}
export function remoteShellEnv(options) {
    if (!options?.promptFallback)
        return undefined;
    return { PS1: buildFallbackPs1() };
}
