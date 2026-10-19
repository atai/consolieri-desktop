import type { HostKind, OsType, Protocol, AuthMethod } from '../types';
import { normalizeHostLogVerbosity } from '../logging/verbosity';
export interface HostFormInput {
    name: string;
    hostname: string;
    port?: number;
    osType?: string;
    kind?: string;
    tags?: string[];
    groupId?: string | null;
    notes?: string;
    defaultProfileId?: string | null;
    uxProfileId?: string | null;
    logVerbosity?: string;
    relatedHostIds?: string[];
    gatewayHostId?: string | null;
    httpEndpoint?: string | null;
    homeDir?: string | null;
}
export interface NormalizedHostInput {
    name: string;
    hostname: string;
    port: number;
    osType: OsType;
    kind: HostKind;
    tags: string[];
    groupId: string | null;
    notes: string;
    defaultProfileId: string | null;
    uxProfileId: string | null;
    logVerbosity: ReturnType<typeof normalizeHostLogVerbosity>;
    relatedHostIds: string[];
    gatewayHostId: string | null;
    httpEndpoint: string | null;
    homeDir: string | null;
}
export declare function normalizeHomeDir(value: string | null | undefined): string | null;
export interface ProfileFormInput {
    name: string;
    protocol?: string;
    shell?: string | null;
    username?: string | null;
    authMethod?: string;
    credentialRef?: string | null;
    jumpHostId?: string | null;
    extra?: Record<string, unknown>;
}
export interface NormalizedProfileInput {
    name: string;
    protocol: Protocol;
    shell: string | null;
    username: string | null;
    authMethod: AuthMethod;
    credentialRef: string | null;
    jumpHostId: string | null;
    extra: Record<string, unknown>;
}
export declare function normalizeHostInput(input: Partial<HostFormInput>): {
    errors: Record<string, string>;
    normalized: NormalizedHostInput | null;
};
export declare function normalizeProfileInput(input: Partial<ProfileFormInput>): {
    errors: Record<string, string>;
    normalized: NormalizedProfileInput | null;
};
