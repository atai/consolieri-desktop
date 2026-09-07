export const KEYFILE_REF_PREFIX = 'keyfile:';
export const VAULT_KV2_REF_PREFIX = 'vault:kv2:';
export function makeKeyFileRef(absolutePath) {
    return `${KEYFILE_REF_PREFIX}${absolutePath}`;
}
export function makeVaultKv2Ref(mount, logicalPath, field) {
    const normalizedMount = mount.replace(/^\/+|\/+$/g, '');
    const normalizedPath = logicalPath.replace(/^\/+|\/+$/g, '');
    return `${VAULT_KV2_REF_PREFIX}${normalizedMount}/${normalizedPath}#${field}`;
}
export function isVaultRef(credentialRef) {
    return credentialRef?.startsWith(VAULT_KV2_REF_PREFIX) ?? false;
}
export function parseVaultRef(credentialRef) {
    if (!isVaultRef(credentialRef)) {
        throw new Error(`Not a vault ref: ${credentialRef}`);
    }
    const body = credentialRef.slice(VAULT_KV2_REF_PREFIX.length);
    const hashIndex = body.lastIndexOf('#');
    if (hashIndex <= 0) {
        throw new Error(`Invalid vault ref: ${credentialRef}`);
    }
    const field = body.slice(hashIndex + 1);
    const mountAndPath = body.slice(0, hashIndex);
    const slashIndex = mountAndPath.indexOf('/');
    if (slashIndex <= 0) {
        throw new Error(`Invalid vault ref mount/path: ${credentialRef}`);
    }
    return {
        mount: mountAndPath.slice(0, slashIndex),
        logicalPath: mountAndPath.slice(slashIndex + 1),
        field
    };
}
export function isKeyFileRef(credentialRef) {
    return credentialRef?.startsWith(KEYFILE_REF_PREFIX) ?? false;
}
export function keyPathFromRef(credentialRef) {
    if (!isKeyFileRef(credentialRef)) {
        throw new Error(`Not a keyfile ref: ${credentialRef}`);
    }
    return credentialRef.slice(KEYFILE_REF_PREFIX.length);
}
export function keyFilePassphraseRef(absolutePath) {
    return `${KEYFILE_REF_PREFIX}${absolutePath}:passphrase`;
}
export function labelFromKeyPath(path) {
    const parts = path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || path;
}
