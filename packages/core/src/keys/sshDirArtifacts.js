/** Filenames in ~/.ssh that are never private keys. */
const SSH_DIR_SKIP_NAMES = new Set([
    'config',
    'known_hosts',
    'known_hosts.old',
    'authorized_keys',
    'authorized_keys2',
    'environment'
]);
export function isSshDirSkipName(filename) {
    if (SSH_DIR_SKIP_NAMES.has(filename))
        return true;
    if (filename.endsWith('.pub'))
        return true;
    return false;
}
export function publicKeyPathForPrivate(privatePath) {
    return `${privatePath}.pub`;
}
