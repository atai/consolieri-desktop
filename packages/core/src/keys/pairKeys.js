import { isSshDirSkipName } from './sshDirArtifacts';
import { isEncryptedPrivateKey, looksLikePrivateKeyContent } from './detectPrivateKey';
import { parsePublicKeyFile } from './parsePublicKey';
import { labelFromKeyPath } from './credentialRef';
export function buildKeyDescriptor(input) {
    if (!looksLikePrivateKeyContent(input.privateContent))
        return null;
    const parsed = input.publicContent ? parsePublicKeyFile(input.publicContent) : null;
    return {
        id: input.id,
        label: input.label ?? labelFromKeyPath(input.privateKeyPath),
        privateKeyPath: input.privateKeyPath,
        publicKeyPath: input.publicKeyPath,
        fingerprint: parsed?.fingerprint ?? null,
        keyType: parsed?.keyType ?? null,
        encrypted: isEncryptedPrivateKey(input.privateContent),
        source: input.source,
        exists: true
    };
}
export function shouldScanAsPrivateKey(filename, content) {
    if (isSshDirSkipName(filename))
        return false;
    return looksLikePrivateKeyContent(content);
}
