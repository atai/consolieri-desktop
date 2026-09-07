export type SshKeySource = 'ssh_dir' | 'custom';
export interface SshKeyDescriptor {
    id: string;
    label: string;
    privateKeyPath: string;
    publicKeyPath: string | null;
    fingerprint: string | null;
    keyType: string | null;
    encrypted: boolean;
    source: SshKeySource;
    exists: boolean;
}
export interface ScanKeyFileInput {
    privateKeyPath: string;
    privateContent: string;
    publicKeyPath: string | null;
    publicContent: string | null;
    source: SshKeySource;
    id: string;
    label?: string;
}
export declare function buildKeyDescriptor(input: ScanKeyFileInput): SshKeyDescriptor | null;
export declare function shouldScanAsPrivateKey(filename: string, content: string): boolean;
