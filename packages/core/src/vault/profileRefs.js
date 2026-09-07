import { makeVaultKv2Ref } from '../keys/credentialRef';
export function vaultFieldForMaterial(material) {
    return material === 'privateKey' ? 'private_key' : 'password';
}
export function makeProfileLocalRef(profileId, material) {
    return material === 'privateKey' ? `profile:${profileId}:key` : `profile:${profileId}:password`;
}
export function makeProfileVaultRef(mount, prefix, profileId, material) {
    const path = `${prefix.replace(/^\/+|\/+$/g, '')}/profiles/${profileId}`;
    return makeVaultKv2Ref(mount, path, vaultFieldForMaterial(material));
}
export function makeProfileCredentialRef(backend, profileId, material, vault) {
    if (backend === 'vault') {
        if (!vault)
            throw new Error('Vault settings required for vault backend');
        return makeProfileVaultRef(vault.mount, vault.prefix, profileId, material);
    }
    return makeProfileLocalRef(profileId, material);
}
export function vaultPathForProfile(prefix, profileId) {
    return `${prefix.replace(/^\/+|\/+$/g, '')}/profiles/${profileId}`;
}
