export interface ParsedDestination {
    host: string;
    port: number;
}
/**
 * Parse a destination string into host and port.
 * Supports IPv6 "[::1]:3389" and regular "host:port" formats.
 */
export declare function parseDestination(destination: string): ParsedDestination;
