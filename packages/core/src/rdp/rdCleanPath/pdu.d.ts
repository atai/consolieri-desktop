export interface RDCleanPathRequest {
    destination: string;
    proxyAuth: string | null;
    x224ConnectionRequest: Buffer;
    preconnectionBlob: string | null;
}
export declare function parseRDCleanPathRequest(data: Buffer): RDCleanPathRequest;
export declare function buildRDCleanPathResponse(serverAddr: string, x224Response: Buffer, certChain: Buffer[]): Buffer;
export declare function buildRDCleanPathError(errorCode: number, httpStatusCode?: number): Buffer;
