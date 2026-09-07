export declare const HTTP_TIMEOUT_MS = 10000;
export type HttpStatusTone = 'success' | 'error' | 'warning' | 'none';
export declare function classifyHttpStatus(statusCode: number | undefined, error?: string): HttpStatusTone;
export declare function formatHttpStatusLabel(statusCode: number | undefined, error?: string): string;
export declare function httpStatusTailwindClass(tone: HttpStatusTone): string;
export declare function connectivityResultHasHttpColumn(entries: Array<{
    httpStatusCode?: number;
    httpError?: string;
}>): boolean;
