export type WhichPlatform = 'win32' | 'linux' | 'darwin' | 'aix' | 'freebsd' | 'sunos' | 'openbsd' | 'netbsd';
export interface WhichOptions {
    command: string;
    platform: WhichPlatform;
    pathEnv: string | undefined;
    existsSync: (p: string) => boolean;
    /**
     * PATHEXT-like list. Should include the leading dot (e.g. ".EXE").
     * When undefined, a small default set is used.
     */
    pathext?: string[];
}
export declare function which({ command, platform, pathEnv, existsSync, pathext }: WhichOptions): string | null;
