import type { WhichPlatform } from './which';
export type LocalShellExecutableType = 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'zsh' | 'sh';
export type LocalShellAvailability = Record<LocalShellExecutableType, boolean>;
export interface LocalShellAvailabilityDeps {
    platform: WhichPlatform;
    pathEnv: string | undefined;
    existsSync: (p: string) => boolean;
    homeDir?: string;
    pathext?: string[];
}
export declare function getLocalShellAvailability(deps: LocalShellAvailabilityDeps): LocalShellAvailability;
export declare function isLocalShellExecutableAvailable(shell: LocalShellExecutableType, deps: LocalShellAvailabilityDeps): boolean;
