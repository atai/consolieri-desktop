import type { SecretBackendKind } from './types';
export type ProfileCredentialMaterial = 'password' | 'privateKey';
export declare function vaultFieldForMaterial(material: ProfileCredentialMaterial): string;
export declare function makeProfileLocalRef(profileId: string, material: ProfileCredentialMaterial): string;
export declare function makeProfileVaultRef(mount: string, prefix: string, profileId: string, material: ProfileCredentialMaterial): string;
export declare function makeProfileCredentialRef(backend: SecretBackendKind, profileId: string, material: ProfileCredentialMaterial, vault?: {
    mount: string;
    prefix: string;
}): string;
export declare function vaultPathForProfile(prefix: string, profileId: string): string;
