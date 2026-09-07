export interface ParsedPublicKey {
    keyType: string;
    fingerprint: string;
    comment: string;
    line: string;
}
export declare function parsePublicKeyLine(line: string): ParsedPublicKey | null;
export declare function parsePublicKeyFile(content: string): ParsedPublicKey | null;
