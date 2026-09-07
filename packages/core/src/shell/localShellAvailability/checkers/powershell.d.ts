import { type WhichPlatform } from '../which';
export interface LocalShellAvailabilityDeps {
    platform: WhichPlatform;
    pathEnv: string | undefined;
    existsSync: (p: string) => boolean;
    homeDir?: string;
    pathext?: string[];
}
export declare function isPowerShellAvailable(deps: LocalShellAvailabilityDeps): boolean;
