import type { ConnectionProfile, Host } from '../types';
export declare function rowToHost(row: Record<string, unknown>): Host;
export declare function rowToProfile(row: Record<string, unknown>): ConnectionProfile;
