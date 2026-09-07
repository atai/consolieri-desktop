import { isKeyFileRef, isVaultRef, parseVaultRef } from '../keys/credentialRef';
function authTypeFromVaultField(field) {
    if (field === 'private_key' || field === 'privateKey')
        return 'privateKey';
    return 'password';
}
export function authTypeFromCredentialRef(credentialRef) {
    if (!credentialRef)
        return 'none';
    if (isKeyFileRef(credentialRef))
        return 'privateKey';
    if (isVaultRef(credentialRef)) {
        return authTypeFromVaultField(parseVaultRef(credentialRef).field);
    }
    if (credentialRef.includes(':key'))
        return 'privateKey';
    return 'password';
}
export function applyAuthToConnectConfig(credentialRef, secret) {
    if (!secret || !credentialRef)
        return {};
    const type = authTypeFromCredentialRef(credentialRef);
    if (type === 'privateKey')
        return { privateKey: secret };
    if (type === 'password')
        return { password: secret };
    return {};
}
