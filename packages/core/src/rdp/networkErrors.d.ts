export interface TcpConnectErrorLike {
    code?: string;
    message?: string;
}
export declare function formatTcpConnectError(host: string, port: number, err: TcpConnectErrorLike): string;
export declare function formatWsaErrorCode(code: number): string;
