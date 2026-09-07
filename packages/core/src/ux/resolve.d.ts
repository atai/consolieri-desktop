import type { UxProfile } from './types';
export interface ResolveUxProfileOptions {
    hostUxProfileId?: string | null;
    activeUxProfileId?: string | null;
}
export declare function resolveUxProfile(profiles: UxProfile[], options?: ResolveUxProfileOptions): UxProfile;
