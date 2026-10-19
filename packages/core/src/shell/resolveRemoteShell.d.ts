export type RemoteShellInvoke = {
    mode: 'default';
} | {
    mode: 'exec';
    command: string;
};
export interface ResolveRemoteShellOptions {
    promptFallback?: boolean;
    cwd?: string;
}
export declare function resolveRemoteShellInvoke(shell: string | null | undefined, options?: ResolveRemoteShellOptions): RemoteShellInvoke;
