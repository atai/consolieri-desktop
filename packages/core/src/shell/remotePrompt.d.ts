/** Bash PS1 with green user@host and blue working directory (xterm-256color). */
export declare function buildFallbackPs1(): string;
/** Prefix a remote shell command with PS1 via env(1) so it works when sshd blocks AcceptEnv and when the login shell is csh. */
export declare function wrapShellCommandWithPs1(command: string, ps1?: string): string;
export declare function remoteShellEnv(options?: {
    promptFallback?: boolean;
}): Record<string, string> | undefined;
