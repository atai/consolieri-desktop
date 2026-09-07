const PRIVATE_KEY_MARKERS = [
    'BEGIN OPENSSH PRIVATE KEY',
    'BEGIN RSA PRIVATE KEY',
    'BEGIN DSA PRIVATE KEY',
    'BEGIN EC PRIVATE KEY',
    'BEGIN PRIVATE KEY'
];
const ENCRYPTED_MARKERS = ['ENCRYPTED', 'Proc-Type: 4,ENCRYPTED'];
export function looksLikePrivateKeyContent(content) {
    const trimmed = content.trim();
    return PRIVATE_KEY_MARKERS.some((m) => trimmed.includes(m));
}
export function isEncryptedPrivateKey(content) {
    if (!looksLikePrivateKeyContent(content))
        return false;
    return ENCRYPTED_MARKERS.some((m) => content.includes(m));
}
