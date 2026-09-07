export declare function formatDuration(ms: number): string;
export declare function statusLabel(status: string): string;
export declare function formatRunTimestamp(iso: string): string;
export declare function formatBytes(bytes: number): string;
export declare function joinList(items: string[]): string;
export declare function totalReportDurationMs(entries: Array<{
    durationMs: number;
}>): number;
