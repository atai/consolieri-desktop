export declare const KEYFILE_REF_PREFIX = "keyfile:";
export declare const VAULT_KV2_REF_PREFIX = "vault:kv2:";
export interface ParsedVaultRef {
    mount: string;
    logicalPath: string;
    field: string;
}
export declare function makeKeyFileRef(absolutePath: string): string;
export declare function makeVaultKv2Ref(mount: string, logicalPath: string, field: string): string;
export declare function isVaultRef(credentialRef: string | null): boolean;
export declare function parseVaultRef(credentialRef: string): ParsedVaultRef;
export declare function isKeyFileRef(credentialRef: string | null): boolean;
export declare function keyPathFromRef(credentialRef: string): string;
export declare function keyFilePassphraseRef(absolutePath: string): string;
export declare function labelFromKeyPath(path: string): string;
